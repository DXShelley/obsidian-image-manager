import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TFile } from 'obsidian';
import { CompressFeature } from '@/features/compress/compress-feature';

const noticeMock = vi.fn();

vi.mock('@/utils/vault-operation', () => ({
  confirmVaultScopeOperation: vi.fn(async () => true)
}));

vi.mock('obsidian', () => ({
  Notice: class {
    constructor(message: string) {
      noticeMock(message);
    }
  },
  MarkdownView: class {
    file = null;
    editor = {
      getCursor: () => ({ line: 0, ch: 0 })
    };
  },
  TFile: class {
    path = '';
    name = '';
    extension = '';
    stat = {
      size: 0,
      mtime: 0
    };
  }
}));

function createContext(overrides: Partial<{
  compressionStatus: 'compressed' | 'not-beneficial' | null;
  compressedBuffer: ArrayBuffer;
  showSpaceSavedNotification: boolean;
  activeView: {
    file: TFile | null;
    editor: {
      getCursor: () => { line: number; ch: number };
    };
  } | null;
}> = {}) {
  const replaceFile = vi.fn(async (file: TFile, data: ArrayBuffer, targetPath = file.path, modifiedAt = Date.now()) => {
    file.path = targetPath;
    file.stat.size = data.byteLength;
    file.stat.mtime = modifiedAt;
    return file;
  });

  return {
    app: {
      workspace: {
        getActiveViewOfType: vi.fn(() => overrides.activeView ?? null)
      },
      vault: {
        getFiles: vi.fn(() => [])
      }
    },
    plugin: {
      addCommand: vi.fn()
    },
    services: {
      logger: {
        debug: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        refreshMode: vi.fn()
      },
      recovery: {
        runTransaction: vi.fn(async (_meta, run: () => Promise<void>) => run())
      },
      fileManager: {
        isImageFile: vi.fn(() => true),
        getImagesInNote: vi.fn(async () => []),
        getImagesInFolder: vi.fn(() => []),
        runWithDeferredLeafRefresh: vi.fn(async (run: () => Promise<void>) => run()),
        replaceFile
      },
      imageProcessor: {
        compress: vi.fn(async () => overrides.compressedBuffer ?? new Uint8Array([1, 2, 3, 4]).buffer)
      },
      compressionTracker: {
        getCurrentStatus: vi.fn(async () => overrides.compressionStatus ?? null),
        markCompressed: vi.fn(async () => undefined),
        markNotBeneficial: vi.fn(async () => undefined)
      },
      settings: {
        getSettings: vi.fn(() => ({
          showOperationNotifications: true,
          showSpaceSavedNotification: overrides.showSpaceSavedNotification ?? true,
          compressionThresholdKB: 0,
          compressionIgnorePattern: ''
        }))
      }
    }
  };
}

describe('CompressFeature', () => {
  beforeEach(() => {
    noticeMock.mockClear();
  });

  it('registers scoped compression commands with explicit names', async () => {
    const feature = new CompressFeature();
    const context = createContext();

    await feature.register(context as never);

    expect(context.plugin.addCommand).toHaveBeenCalledTimes(3);
    expect(context.plugin.addCommand).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ id: 'a4-compress-active-image', name: '【单文件】压缩图片' })
    );
    expect(context.plugin.addCommand).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ id: 'b4-compress-current-folder-images', name: '【单文件夹】压缩图片' })
    );
    expect(context.plugin.addCommand).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ id: 'c4-compress-vault-images', name: '【整库】压缩图片' })
    );
  });

  it('skips recompressing a file version that was already processed', async () => {
    const feature = new CompressFeature();
    const context = createContext({
      compressionStatus: 'compressed'
    });
    const file = Object.assign(new TFile(), {
      path: 'assets/photo.webp',
      name: 'photo.webp',
      extension: 'webp',
      stat: {
        size: 256,
        mtime: 100
      }
    });

    await feature.compressImage(context as never, file as never);

    expect(context.services.imageProcessor.compress).not.toHaveBeenCalled();
    expect(noticeMock).toHaveBeenCalledWith(
      'Skipped compression for photo.webp: current file version was already compressed'
    );
  });

  it('only compresses files whose current version has not been processed yet', async () => {
    const feature = new CompressFeature();
    const context = createContext();
    const processed = Object.assign(new TFile(), {
      path: 'assets/processed.webp',
      name: 'processed.webp',
      extension: 'webp',
      stat: {
        size: 300,
        mtime: 100
      }
    });
    const fresh = Object.assign(new TFile(), {
      path: 'assets/fresh.webp',
      name: 'fresh.webp',
      extension: 'webp',
      stat: {
        size: 400,
        mtime: 200
      }
    });

    vi.mocked(context.services.compressionTracker.getCurrentStatus)
      .mockResolvedValueOnce('compressed')
      .mockResolvedValueOnce(null);
    vi.mocked(context.services.fileManager.getImagesInFolder).mockReturnValue([processed, fresh]);

    await feature.compressImagesInFolder(context as never, { path: 'assets' } as never);

    expect(context.services.imageProcessor.compress).toHaveBeenCalledTimes(1);
    expect(context.services.imageProcessor.compress).toHaveBeenCalledWith(fresh);
    expect(context.services.compressionTracker.markCompressed).toHaveBeenCalledWith('assets/fresh.webp', 4, expect.any(Number));
    expect(noticeMock).toHaveBeenCalledWith(
      'Batch compression finished: 1 image(s), 400 B -> 4 B (99.0% reduction)'
    );
  });

  it('marks non-beneficial outputs so the same file version will be skipped later', async () => {
    const feature = new CompressFeature();
    const context = createContext({
      compressedBuffer: new Uint8Array([1, 2, 3, 4, 5, 6]).buffer
    });
    const file = Object.assign(new TFile(), {
      path: 'assets/photo.webp',
      name: 'photo.webp',
      extension: 'webp',
      stat: {
        size: 6,
        mtime: 300
      }
    });

    await feature.compressImage(context as never, file as never);

    expect(context.services.fileManager.replaceFile).not.toHaveBeenCalled();
    expect(context.services.compressionTracker.markNotBeneficial).toHaveBeenCalledWith(file);
    expect(noticeMock).toHaveBeenCalledWith(
      'Skipped compression for photo.webp: no smaller output was produced'
    );
  });

  it('compresses all images referenced by the current markdown note', async () => {
    const feature = new CompressFeature();
    const note = Object.assign(new TFile(), {
      path: 'notes/demo.md',
      name: 'demo.md',
      extension: 'md',
      stat: {
        size: 10,
        mtime: 1
      }
    });
    const image = Object.assign(new TFile(), {
      path: 'assets/photo.webp',
      name: 'photo.webp',
      extension: 'webp',
      stat: {
        size: 400,
        mtime: 200
      }
    });
    const secondImage = Object.assign(new TFile(), {
      path: 'assets/photo-2.webp',
      name: 'photo-2.webp',
      extension: 'webp',
      stat: {
        size: 500,
        mtime: 201
      }
    });
    const activeView = {
      file: note,
      editor: {
        getCursor: () => ({ line: 0, ch: 5 })
      }
    };
    const context = createContext({
      activeView
    });
    vi.mocked(context.services.fileManager.getImagesInNote).mockResolvedValue([image, secondImage]);

    await feature.register(context as never);
    const command = vi.mocked(context.plugin.addCommand).mock.calls[0]?.[0];

    expect(command).toBeDefined();
    command?.callback?.();

    await vi.waitFor(() => {
      expect(context.services.fileManager.getImagesInNote).toHaveBeenCalledWith(note);
      expect(context.services.imageProcessor.compress).toHaveBeenCalledTimes(2);
      expect(context.services.imageProcessor.compress).toHaveBeenNthCalledWith(1, image);
      expect(context.services.imageProcessor.compress).toHaveBeenNthCalledWith(2, secondImage);
    });
  });
});
