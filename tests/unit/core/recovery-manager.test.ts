import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TFile } from 'obsidian';
import { RecoveryManager } from '@/core/recovery/recovery-manager';

vi.mock('obsidian', () => ({
  Notice: class {},
  TFile: class {
    constructor(public path: string) {}
  },
  normalizePath: (value: string) => value.replace(/\\/g, '/').replace(/\/+/g, '/')
}));

function createApp() {
  const textFiles = new Map<string, string>();
  const binaryFiles = new Map<string, ArrayBuffer>();
  const recoveryFiles = new Map<string, string | ArrayBuffer>();
  const vaultFiles = new Map<string, TFile>();

  const adapter = {
    exists: vi.fn(async (path: string) => recoveryFiles.has(path)),
    read: vi.fn(async (path: string) => {
      const value = recoveryFiles.get(path);
      return typeof value === 'string' ? value : '';
    }),
    readBinary: vi.fn(async (path: string) => {
      const value = recoveryFiles.get(path);
      return value instanceof ArrayBuffer ? value : new ArrayBuffer(0);
    }),
    write: vi.fn(async (path: string, value: string) => {
      recoveryFiles.set(path, value);
    }),
    writeBinary: vi.fn(async (path: string, value: ArrayBuffer) => {
      recoveryFiles.set(path, value);
    }),
    mkdir: vi.fn(async (_path: string) => undefined),
    remove: vi.fn(async (path: string) => {
      recoveryFiles.delete(path);
    })
  };

  const app = {
    vault: {
      configDir: '.obsidian',
      adapter,
      readBinary: vi.fn(async (file: TFile) => binaryFiles.get(file.path) ?? new ArrayBuffer(0)),
      getAbstractFileByPath: vi.fn((path: string) => vaultFiles.get(path) ?? null),
      delete: vi.fn(async (file: TFile) => {
        vaultFiles.delete(file.path);
      })
    },
    fileManager: {
      renameFile: vi.fn(async (file: TFile, nextPath: string) => {
        vaultFiles.delete(file.path);
        file.path = nextPath;
        vaultFiles.set(nextPath, file);
      })
    }
  };

  const fileManager = {
    restoreBinaryFile: vi.fn(async (path: string, data: ArrayBuffer) => {
      binaryFiles.set(path, data);
      return new TFile(path);
    }),
    restoreTextFile: vi.fn(async (path: string, data: string) => {
      textFiles.set(path, data);
      return new TFile(path);
    })
  };

  return {
    app,
    fileManager,
    textFiles,
    binaryFiles,
    recoveryFiles,
    vaultFiles
  };
}

describe('RecoveryManager', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('undoes the last transaction by restoring files and deleting created files', async () => {
    const { app, fileManager, recoveryFiles, vaultFiles, textFiles } = createApp();
    const manager = new RecoveryManager(app as never, 'note-image-manager', fileManager as never);

    recoveryFiles.set(
      '.obsidian/plugins/note-image-manager/recovery/history.json',
      JSON.stringify({
        transactions: [
          {
            id: 'tx-1',
            label: '转换图片',
            trigger: 'convert',
            scope: 'single-file',
            status: 'committed',
            createdAt: Date.now(),
            entries: [
              {
                kind: 'rename',
                fromPath: 'assets/photo.png',
                toPath: 'assets/photo.webp'
              },
              {
                kind: 'binary-snapshot',
                path: 'assets/photo.png',
                snapshotPath: '.obsidian/plugins/note-image-manager/recovery/snapshots/tx-1-assets_photo.png.bin'
              },
              {
                kind: 'text-snapshot',
                path: 'notes/demo.md',
                snapshotPath: '.obsidian/plugins/note-image-manager/recovery/snapshots/tx-1-notes_demo.md.txt'
              },
              {
                kind: 'created-file',
                path: 'assets/new-image.png'
              }
            ]
          }
        ]
      })
    );
    recoveryFiles.set(
      '.obsidian/plugins/note-image-manager/recovery/snapshots/tx-1-assets_photo.png.bin',
      new Uint8Array([1, 2, 3]).buffer
    );
    recoveryFiles.set(
      '.obsidian/plugins/note-image-manager/recovery/snapshots/tx-1-notes_demo.md.txt',
      'restored markdown'
    );
    vaultFiles.set('assets/photo.webp', new TFile('assets/photo.webp'));
    vaultFiles.set('assets/new-image.png', new TFile('assets/new-image.png'));

    const restored = await manager.undoLastTransaction();

    expect(restored?.status).toBe('undone');
    expect(app.fileManager.renameFile).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'assets/photo.png' }),
      'assets/photo.png'
    );
    expect(fileManager.restoreBinaryFile).toHaveBeenCalledWith('assets/photo.png', expect.any(ArrayBuffer));
    expect(fileManager.restoreTextFile).toHaveBeenCalledWith('notes/demo.md', 'restored markdown');
    expect(app.vault.delete).toHaveBeenCalledWith(expect.objectContaining({ path: 'assets/new-image.png' }), true);
    expect(textFiles.get('notes/demo.md')).toBe('restored markdown');
  });

  it('keeps only the newest ten transactions and prunes snapshots older than one day', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-23T10:00:00.000Z'));

    const { app, fileManager, recoveryFiles } = createApp();
    const manager = new RecoveryManager(app as never, 'note-image-manager', fileManager as never);
    const oldTimestamp = Date.now() - 2 * 24 * 60 * 60 * 1000;
    const transactions = Array.from({ length: 12 }, (_value, index) => ({
      id: `tx-${index}`,
      label: `tx-${index}`,
      trigger: 'compress',
      scope: 'single-file',
      status: 'committed',
      createdAt: index === 0 ? oldTimestamp : Date.now() - index,
      entries: [
        {
          kind: 'text-snapshot',
          path: `notes/${index}.md`,
          snapshotPath: `.obsidian/plugins/note-image-manager/recovery/snapshots/tx-${index}.txt`
        }
      ],
      beforeState:
        index === 0
          ? {
              files: [
                {
                  path: 'assets/before.png',
                  kind: 'binary',
                  exists: true,
                  snapshotPath: '.obsidian/plugins/note-image-manager/recovery/snapshots/tx-0-before.bin'
                }
              ],
              folders: []
            }
          : undefined,
      afterState:
        index === 0
          ? {
              files: [
                {
                  path: 'assets/after.webp',
                  kind: 'binary',
                  exists: true,
                  snapshotPath: '.obsidian/plugins/note-image-manager/recovery/snapshots/tx-0-after.bin'
                }
              ],
              folders: []
            }
          : undefined
    }));
    recoveryFiles.set(
      '.obsidian/plugins/note-image-manager/recovery/history.json',
      JSON.stringify({ transactions })
    );
    for (const transaction of transactions) {
      recoveryFiles.set(
        `.obsidian/plugins/note-image-manager/recovery/snapshots/${transaction.id}.txt`,
        transaction.id
      );
    }
    recoveryFiles.set(
      '.obsidian/plugins/note-image-manager/recovery/snapshots/tx-0-before.bin',
      new Uint8Array([1, 2, 3]).buffer
    );
    recoveryFiles.set(
      '.obsidian/plugins/note-image-manager/recovery/snapshots/tx-0-after.bin',
      new Uint8Array([4, 5, 6]).buffer
    );

    await manager.initialize();

    const retained = manager.listTransactions();
    expect(retained).toHaveLength(10);
    expect(retained.some((transaction) => transaction.id === 'tx-0')).toBe(false);
    expect(recoveryFiles.has('.obsidian/plugins/note-image-manager/recovery/snapshots/tx-0.txt')).toBe(false);
    expect(recoveryFiles.has('.obsidian/plugins/note-image-manager/recovery/snapshots/tx-0-before.bin')).toBe(false);
    expect(recoveryFiles.has('.obsidian/plugins/note-image-manager/recovery/snapshots/tx-0-after.bin')).toBe(false);
  });

  it('redoes the earliest undone transaction after the current history boundary', async () => {
    const { app, fileManager, recoveryFiles, vaultFiles } = createApp();
    const manager = new RecoveryManager(app as never, 'note-image-manager', fileManager as never);

    recoveryFiles.set(
      '.obsidian/plugins/note-image-manager/recovery/history.json',
      JSON.stringify({
        transactions: [
          {
            id: 'tx-1',
            label: '转换图片',
            trigger: 'convert',
            scope: 'single-file',
            status: 'undone',
            redoable: true,
            createdAt: Date.now(),
            entries: [],
            beforeState: {
              files: [
                {
                  path: 'assets/photo.png',
                  kind: 'binary',
                  exists: true,
                  snapshotPath: '.obsidian/plugins/note-image-manager/recovery/snapshots/tx-1-before.bin'
                },
                {
                  path: 'assets/photo.webp',
                  kind: 'binary',
                  exists: false
                }
              ],
              folders: []
            },
            afterState: {
              files: [
                {
                  path: 'assets/photo.png',
                  kind: 'binary',
                  exists: false
                },
                {
                  path: 'assets/photo.webp',
                  kind: 'binary',
                  exists: true,
                  snapshotPath: '.obsidian/plugins/note-image-manager/recovery/snapshots/tx-1-after.bin'
                }
              ],
              folders: []
            }
          }
        ]
      })
    );
    recoveryFiles.set(
      '.obsidian/plugins/note-image-manager/recovery/snapshots/tx-1-after.bin',
      new Uint8Array([4, 5, 6]).buffer
    );
    vaultFiles.set('assets/photo.png', new TFile('assets/photo.png'));

    const restored = await manager.redoLastUndoneTransaction();

    expect(restored?.status).toBe('committed');
    expect(fileManager.restoreBinaryFile).toHaveBeenCalledWith('assets/photo.webp', expect.any(ArrayBuffer));
    expect(app.vault.delete).toHaveBeenCalledWith(expect.objectContaining({ path: 'assets/photo.png' }), true);
  });
});
