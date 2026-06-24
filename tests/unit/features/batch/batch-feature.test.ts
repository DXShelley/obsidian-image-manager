import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TFolder } from 'obsidian';
import { BatchFeature } from '@/features/batch/batch-feature';
import { BatchExecutionStatus, BatchScope } from '@/types/index';

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
          rewriteImageLinksInNote: vi.fn(async () => ({ replaced: 0, moved: 0, downloaded: 0, deleted: 0, foldersDeleted: 0 }))
        },
        settings: {
          getSettings: vi.fn(() => ({
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
});
