import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TFolder } from 'obsidian';
import { BatchFeature } from '@/features/batch/batch-feature';
import { BatchExecutionStatus, BatchScope } from '@/types/index';
import { confirmVaultScopeOperation } from '@/utils/vault-operation';

const noticeMock = vi.fn();

vi.mock('@/utils/vault-operation', () => ({
  confirmVaultScopeOperation: vi.fn(async () => true)
}));

vi.mock('obsidian', () => ({
  MarkdownView: class {},
  Notice: class {
    constructor(message: string) {
      noticeMock(message);
    }
  },
  TFile: class {},
  TFolder: class {}
}));

describe('BatchFeature', () => {
  beforeEach(() => {
    noticeMock.mockClear();
    vi.mocked(confirmVaultScopeOperation).mockClear();
  });

  it('does not start a new batch while another job is active', async () => {
    const run = vi.fn(async () => {
      throw new Error('run should not be called');
    });
    const feature = new BatchFeature();
    const context = {
      app: {
        vault: {
          getFiles: vi.fn(() => [])
        }
      },
      services: {
        logger: {
          refreshMode: vi.fn(),
          debug: vi.fn(),
          error: vi.fn()
        },
        batchProcessor: {
          getReport: vi.fn(() => ({
            status: BatchExecutionStatus.RUNNING
          })),
          run
        },
        fileManager: {
          isImageFile: vi.fn(() => true),
          getMarkdownFilesInVault: vi.fn(() => []),
          rewriteImageLinksInNote: vi.fn(async () => ({ replaced: 0, moved: 0, downloaded: 0, deleted: 0, foldersDeleted: 0 })),
          importExternalImageLinksInNote: vi.fn(async () => ({ replaced: 0, downloaded: 0 }))
        },
        settings: {
          getSettings: vi.fn(() => ({
            uiLanguage: 'en',
            showOperationNotifications: true
          }))
        },
        imageProcessor: {} as never
      }
    };

    await (
      feature as unknown as {
        runLinkRewriteBatch: (ctx: typeof context, scope: BatchScope) => Promise<void>;
      }
    ).runLinkRewriteBatch(context, BatchScope.VAULT);

    expect(run).not.toHaveBeenCalled();
    expect(noticeMock).toHaveBeenCalledWith('An image batch job is already active');
  });

  it('shows one aggregated notice with per-note link counts after link rewrite', async () => {
    const feature = new BatchFeature();
    const notes = [{ path: 'notes/a.md' }, { path: 'notes/b.md' }];
    const context = {
      app: {
        vault: {
          getFiles: vi.fn(() => [])
        }
      },
      services: {
        logger: {
          refreshMode: vi.fn(),
          debug: vi.fn(),
          error: vi.fn()
        },
        batchProcessor: {
          getReport: vi.fn(() => null),
          run: vi.fn(async (request: { tasks: Array<{ run: () => Promise<void> }> }) => {
            for (const task of request.tasks) {
              await task.run();
            }
            return {
              completed: 2,
              failed: 0,
              skipped: 0,
              status: BatchExecutionStatus.COMPLETED
            };
          })
        },
        fileManager: {
          getMarkdownFilesInVault: vi.fn(() => notes),
          rewriteImageLinksInNote: vi
            .fn()
            .mockResolvedValueOnce({ replaced: 2, moved: 0, downloaded: 0, deleted: 0, foldersDeleted: 0 })
            .mockResolvedValueOnce({ replaced: 1, moved: 1, downloaded: 0, deleted: 0, foldersDeleted: 0 })
        },
        settings: {
          getSettings: vi.fn(() => ({
            uiLanguage: 'en',
            showOperationNotifications: true
          }))
        },
        imageProcessor: {} as never
      }
    };

    await (
      feature as unknown as {
        runLinkRewriteBatch: (ctx: typeof context, scope: BatchScope) => Promise<void>;
      }
    ).runLinkRewriteBatch(context, BatchScope.VAULT);

    expect(noticeMock).toHaveBeenCalledTimes(1);
    expect(noticeMock).toHaveBeenCalledWith(
      'Batch link update finished: 2 file(s), 3 link(s) updated: notes/a.md (2 links), notes/b.md (1 link); moved 1 image(s)'
    );
  });

  it('shows one aggregated notice after external image import', async () => {
    const feature = new BatchFeature();
    const notes = [{ path: 'notes/a.md' }, { path: 'notes/b.md' }];
    const context = {
      app: {
        vault: {
          getFiles: vi.fn(() => []),
          getAbstractFileByPath: vi.fn(() => null)
        },
        workspace: {
          getActiveViewOfType: vi.fn(() => null)
        }
      },
      services: {
        logger: {
          refreshMode: vi.fn(),
          debug: vi.fn(),
          error: vi.fn()
        },
        batchProcessor: {
          getReport: vi.fn(() => null),
          run: vi.fn(async (request: { tasks: Array<{ run: () => Promise<void> }> }) => {
            for (const task of request.tasks) {
              await task.run();
            }
            return {
              completed: 2,
              failed: 0,
              skipped: 0,
              status: BatchExecutionStatus.COMPLETED
            };
          })
        },
        fileManager: {
          getMarkdownFilesInVault: vi.fn(() => notes),
          importExternalImageLinksInNote: vi
            .fn()
            .mockResolvedValueOnce({ replaced: 2, downloaded: 1 })
            .mockResolvedValueOnce({ replaced: 1, downloaded: 1 })
        },
        settings: {
          getSettings: vi.fn(() => ({
            uiLanguage: 'en',
            showOperationNotifications: true
          }))
        },
        recovery: {
          runTransaction: vi.fn()
        },
        imageProcessor: {} as never
      }
    };

    await (
      feature as unknown as {
        runExternalImageImportBatch: (ctx: typeof context, scope: BatchScope) => Promise<void>;
      }
    ).runExternalImageImportBatch(context, BatchScope.VAULT);

    expect(noticeMock).toHaveBeenCalledWith(
      'External image import finished: 2 file(s), 3 link(s) updated: notes/a.md (2 links), notes/b.md (1 link); downloaded 2 image(s)'
    );
  });

  it('shows an aggregated notice after orphan cleanup', async () => {
    const feature = new BatchFeature();
    const folder = Object.assign(new TFolder(), { path: 'assets' });
    const context = {
      services: {
        logger: {
          refreshMode: vi.fn(),
          debug: vi.fn(),
          error: vi.fn()
        },
        batchProcessor: {
          getReport: vi.fn(() => null)
        },
        fileManager: {
          deleteOrphanImagesInFolder: vi.fn(async () => ({
            deletedImages: 2,
            deletedFolders: 1,
            relocatedImages: 0,
            preservedImages: 0
          }))
        },
        settings: {
          getSettings: vi.fn(() => ({
            uiLanguage: 'en',
            showOperationNotifications: true
          }))
        }
      }
    };

    await (
      feature as unknown as {
        runOrphanCleanupBatch: (ctx: typeof context, scope: BatchScope, source: typeof folder) => Promise<void>;
      }
    ).runOrphanCleanupBatch(context, BatchScope.FOLDER, folder);

    expect(noticeMock).toHaveBeenCalledWith('Extra image cleanup finished: removed 2 image(s); removed 1 empty folder(s)');
  });

  it('confirms risk before vault empty managed folder cleanup', async () => {
    const feature = new BatchFeature();
    const commands = new Map<string, { callback: () => void }>();
    const deleteEmptyManagedFoldersInVault = vi.fn(async () => 0);
    const context = {
      app: {},
      plugin: {
        addCommand: vi.fn((command: { id: string; callback: () => void }) => {
          commands.set(command.id, command);
        })
      },
      services: {
        logger: {
          refreshMode: vi.fn(),
          debug: vi.fn(),
          warn: vi.fn(),
          error: vi.fn()
        },
        recovery: {
          runTransaction: vi.fn(async (_meta: unknown, run: () => Promise<void>) => {
            await run();
          })
        },
        fileManager: {
          deleteEmptyManagedFoldersInVault
        },
        settings: {
          getSettings: vi.fn(() => ({
            uiLanguage: 'en',
            showOperationNotifications: true
          }))
        },
        batchProcessor: {
          getReport: vi.fn(() => null)
        }
      }
    };

    await feature.register(context as never);
    commands.get('c6-clean-vault-empty-managed-folders')?.callback();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(confirmVaultScopeOperation).toHaveBeenCalledWith(
      context.app,
      'en',
      'Vault-wide empty managed folder cleanup'
    );
    expect(deleteEmptyManagedFoldersInVault).toHaveBeenCalled();
    expect(noticeMock).toHaveBeenCalledWith('No empty managed folders found');
  });
});
