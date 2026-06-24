import { describe, expect, it, vi } from 'vitest';
import { TFile } from 'obsidian';
import { CompressionTracker } from '@/core/compression/compression-tracker';

vi.mock('obsidian', () => ({
  TFile: class {
    path: string;
    stat = {
      size: 0,
      mtime: 0
    };

    constructor(path: string) {
      this.path = path;
    }
  },
  normalizePath: (value: string) => value.replace(/\\/g, '/').replace(/\/+/g, '/')
}));

function createApp() {
  const files = new Map<string, TFile>();
  const storage = new Map<string, string>();

  return {
    app: {
      vault: {
        configDir: '.obsidian',
        adapter: {
          exists: vi.fn(async (path: string) => storage.has(path)),
          read: vi.fn(async (path: string) => storage.get(path) ?? ''),
          write: vi.fn(async (path: string, value: string) => {
            storage.set(path, value);
          }),
          mkdir: vi.fn(async (_path: string) => undefined)
        },
        getAbstractFileByPath: vi.fn((path: string) => files.get(path) ?? null)
      }
    },
    files,
    storage
  };
}

describe('CompressionTracker', () => {
  it('persists processed compressed versions and matches by path, size, and mtime', async () => {
    const { app, files, storage } = createApp();
    const file = Object.assign(new TFile('assets/photo.webp'), {
      path: 'assets/photo.webp',
      stat: {
        size: 128,
        mtime: 1234
      }
    });
    files.set(file.path, file);

    const tracker = new CompressionTracker(app as never, 'obsidian-image-manager');
    await tracker.initialize();
    await tracker.markCompressed(file.path, file.stat.size, file.stat.mtime);

    expect(storage.get('.obsidian/plugins/obsidian-image-manager/compression-history.json')).toContain('"status": "compressed"');

    const reloaded = new CompressionTracker(app as never, 'obsidian-image-manager');
    await reloaded.initialize();

    expect(await reloaded.getCurrentStatus(file)).toBe('compressed');
  });

  it('drops stale records when the file version changes', async () => {
    const { app, files, storage } = createApp();
    storage.set(
      '.obsidian/plugins/obsidian-image-manager/compression-history.json',
      JSON.stringify({
        records: [
          {
            path: 'assets/photo.webp',
            size: 128,
            mtime: 1234,
            status: 'compressed',
            updatedAt: 5678
          }
        ]
      })
    );

    const file = Object.assign(new TFile('assets/photo.webp'), {
      path: 'assets/photo.webp',
      stat: {
        size: 256,
        mtime: 9999
      }
    });
    files.set(file.path, file);

    const tracker = new CompressionTracker(app as never, 'obsidian-image-manager');
    await tracker.initialize();

    expect(await tracker.getCurrentStatus(file)).toBeNull();
    expect(storage.get('.obsidian/plugins/obsidian-image-manager/compression-history.json')).not.toContain('"assets/photo.webp"');
  });
});
