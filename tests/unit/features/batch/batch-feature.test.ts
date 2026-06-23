import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BatchFeature } from '@/features/batch/batch-feature';
import { BatchExecutionStatus, BatchScope } from '@/types/index';

const noticeMock = vi.fn();

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
          rewriteImageLinksInNote: vi.fn(async () => ({ replaced: 0, moved: 0 }))
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
});
