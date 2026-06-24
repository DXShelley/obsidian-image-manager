import { describe, expect, it, vi } from 'vitest';
import { EditorFeature } from '@/features/editor/editor-feature';
import { ResizeFeature } from '@/features/resize/resize-feature';

vi.mock('obsidian', () => ({
  TFile: class {
    path = '';
    name = '';
    extension = '';
  }
}));

vi.mock('@/utils/command-logging', () => ({
  executeLoggedCommand: vi.fn(async (_context: unknown, _meta: unknown, run: () => Promise<void>) => run()),
  logSkippedCommand: vi.fn()
}));

describe('EditorFeature', () => {
  it('registers rotate and flip commands for the active image file', async () => {
    const { TFile } = await import('obsidian');
    const feature = new EditorFeature();
    const activeFile = Object.assign(new TFile(), {
      path: 'assets/photo.png',
      name: 'photo.png',
      extension: 'png'
    });
    const rotateMock = vi.fn(async () => new ArrayBuffer(4));
    const flipMock = vi.fn(async () => new ArrayBuffer(4));
    const replaceFileMock = vi.fn(async () => activeFile);
    const runTransactionMock = vi.fn(async (_meta: unknown, run: () => Promise<void>) => run());
    const context = {
      app: {
        workspace: {
          getActiveFile: vi.fn(() => activeFile)
        }
      },
      plugin: {
        addCommand: vi.fn()
      },
      services: {
        fileManager: {
          isImageFile: vi.fn(() => true),
          replaceFile: replaceFileMock
        },
        imageProcessor: {
          rotate: rotateMock,
          flip: flipMock
        },
        recovery: {
          runTransaction: runTransactionMock
        },
        settings: {
          getSettings: vi.fn(() => ({
            showOperationNotifications: true
          }))
        }
      }
    };

    await feature.register(context as never);

    expect(context.plugin.addCommand).toHaveBeenCalledTimes(2);

    const rotateCommand = vi.mocked(context.plugin.addCommand).mock.calls[0]?.[0];
    const flipCommand = vi.mocked(context.plugin.addCommand).mock.calls[1]?.[0];

    rotateCommand?.callback?.();
    flipCommand?.callback?.();

    await vi.waitFor(() => {
      expect(runTransactionMock).toHaveBeenCalledTimes(2);
      expect(rotateMock).toHaveBeenCalledWith(activeFile, 90);
      expect(flipMock).toHaveBeenCalledWith(activeFile, 'horizontal');
      expect(replaceFileMock).toHaveBeenCalledTimes(2);
    });
  });
});

describe('ResizeFeature', () => {
  it('registers the active-image resize command and applies the preset bounds', async () => {
    const { TFile } = await import('obsidian');
    const feature = new ResizeFeature();
    const activeFile = Object.assign(new TFile(), {
      path: 'assets/photo.png',
      name: 'photo.png',
      extension: 'png'
    });
    const resizeMock = vi.fn(async () => new ArrayBuffer(4));
    const replaceFileMock = vi.fn(async () => activeFile);
    const runTransactionMock = vi.fn(async (_meta: unknown, run: () => Promise<void>) => run());
    const context = {
      app: {
        workspace: {
          getActiveFile: vi.fn(() => activeFile)
        }
      },
      plugin: {
        addCommand: vi.fn()
      },
      services: {
        fileManager: {
          isImageFile: vi.fn(() => true),
          replaceFile: replaceFileMock
        },
        imageProcessor: {
          resize: resizeMock
        },
        recovery: {
          runTransaction: runTransactionMock
        },
        settings: {
          getSettings: vi.fn(() => ({
            showOperationNotifications: true
          }))
        }
      }
    };

    await feature.register(context as never);

    expect(context.plugin.addCommand).toHaveBeenCalledTimes(1);

    const resizeCommand = vi.mocked(context.plugin.addCommand).mock.calls[0]?.[0];
    resizeCommand?.callback?.();

    await vi.waitFor(() => {
      expect(runTransactionMock).toHaveBeenCalledTimes(1);
      expect(resizeMock).toHaveBeenCalledWith(activeFile, 1920, 1920);
      expect(replaceFileMock).toHaveBeenCalledWith(activeFile, expect.any(ArrayBuffer));
    });
  });
});
