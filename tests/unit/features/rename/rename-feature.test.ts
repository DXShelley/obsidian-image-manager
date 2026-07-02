import { afterEach, describe, expect, it, vi } from 'vitest';
import { TFile } from 'obsidian';
import { RenameFeature } from '@/features/rename/rename-feature';
import { DEFAULT_SETTINGS } from '@/types/index';

describe('RenameFeature deleted note cleanup queue', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('deduplicates deleted note cleanup by managed folder and waits for metadata resolution', async () => {
    vi.useFakeTimers();
    const feature = new RenameFeature();
    let deleteHandler: ((file: TFile) => void) | null = null;
    let resolvedHandler: (() => void) | null = null;
    const cleanupTarget = {
      notePath: 'notes/a.md',
      noteName: 'a',
      managedFolderPath: 'notes/assets/a',
      preservePath: 'notes'
    };
    const cleanupManagedImagesForDeletedNotePath = vi.fn(async () => ({
      deletedImages: 0,
      deletedFolders: 1,
      relocatedImages: 0,
      preservedImages: 0
    }));

    await feature.register({
      app: {
        vault: {
          on: vi.fn((name: string, callback: (file: TFile) => void) => {
            if (name === 'delete') {
              deleteHandler = callback;
            }
            return {};
          })
        },
        metadataCache: {
          on: vi.fn((name: string, callback: () => void) => {
            if (name === 'resolved') {
              resolvedHandler = callback;
            }
            return {};
          }),
          offref: vi.fn()
        }
      },
      plugin: {
        registerEvent: vi.fn()
      },
      services: {
        settings: {
          getSettings: vi.fn(() => ({
            ...DEFAULT_SETTINGS,
            deleteOrphanImages: true,
            deleteEmptyFolders: true
          }))
        },
        fileManager: {
          getDeletedNoteManagedCleanupTarget: vi.fn(() => cleanupTarget),
          cleanupManagedImagesForDeletedNotePath
        },
        recovery: {
          runTransaction: vi.fn(async (_meta, run: () => Promise<unknown>) => run())
        },
        logger: {
          refreshMode: vi.fn(),
          debug: vi.fn(),
          error: vi.fn()
        }
      }
    } as never);

    const first = Object.assign(new TFile(), {
      path: 'notes/a.md',
      basename: 'a',
      extension: 'md'
    });
    const second = Object.assign(new TFile(), {
      path: 'notes/a.md',
      basename: 'a',
      extension: 'md'
    });

    deleteHandler?.(first);
    deleteHandler?.(second);
    await vi.advanceTimersByTimeAsync(300);

    expect(cleanupManagedImagesForDeletedNotePath).not.toHaveBeenCalled();
    resolvedHandler?.();
    await vi.waitFor(() => {
      expect(cleanupManagedImagesForDeletedNotePath).toHaveBeenCalledTimes(1);
    });
    expect(cleanupManagedImagesForDeletedNotePath).toHaveBeenCalledWith(
      'notes/a.md',
      new Set(['notes/a.md']),
      { allowImageDeletion: true }
    );
  });

  it('passes the full deleted note batch and disables image deletion on metadata timeout', async () => {
    vi.useFakeTimers();
    const feature = new RenameFeature();
    let deleteHandler: ((file: TFile) => void) | null = null;
    const cleanupManagedImagesForDeletedNotePath = vi.fn(async () => ({
      deletedImages: 0,
      deletedFolders: 1,
      relocatedImages: 0,
      preservedImages: 0
    }));

    await feature.register({
      app: {
        vault: {
          on: vi.fn((name: string, callback: (file: TFile) => void) => {
            if (name === 'delete') {
              deleteHandler = callback;
            }
            return {};
          })
        },
        metadataCache: {
          on: vi.fn(() => ({})),
          offref: vi.fn()
        }
      },
      plugin: {
        registerEvent: vi.fn()
      },
      services: {
        settings: {
          getSettings: vi.fn(() => ({
            ...DEFAULT_SETTINGS,
            deleteOrphanImages: true,
            deleteEmptyFolders: true
          }))
        },
        fileManager: {
          getDeletedNoteManagedCleanupTarget: vi.fn((notePath: string) => ({
            notePath,
            noteName: notePath.includes('a.md') ? 'a' : 'b',
            managedFolderPath: notePath.includes('a.md') ? 'notes/assets/a' : 'notes/assets/b',
            preservePath: 'notes'
          })),
          cleanupManagedImagesForDeletedNotePath
        },
        recovery: {
          runTransaction: vi.fn(async (_meta, run: () => Promise<unknown>) => run())
        },
        logger: {
          refreshMode: vi.fn(),
          debug: vi.fn(),
          error: vi.fn()
        }
      }
    } as never);

    deleteHandler?.(Object.assign(new TFile(), { path: 'notes/a.md', basename: 'a', extension: 'md' }));
    deleteHandler?.(Object.assign(new TFile(), { path: 'notes/b.md', basename: 'b', extension: 'md' }));
    await vi.advanceTimersByTimeAsync(300);
    await vi.advanceTimersByTimeAsync(1200);

    await vi.waitFor(() => {
      expect(cleanupManagedImagesForDeletedNotePath).toHaveBeenCalledTimes(2);
    });
    expect(cleanupManagedImagesForDeletedNotePath).toHaveBeenCalledWith(
      'notes/a.md',
      new Set(['notes/a.md', 'notes/b.md']),
      { allowImageDeletion: false }
    );
    expect(cleanupManagedImagesForDeletedNotePath).toHaveBeenCalledWith(
      'notes/b.md',
      new Set(['notes/a.md', 'notes/b.md']),
      { allowImageDeletion: false }
    );
  });
});
