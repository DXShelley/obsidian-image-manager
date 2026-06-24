import { describe, expect, it, vi } from 'vitest';
import { GalleryFeature } from '@/features/gallery/gallery-feature';

const { openSingleImageGalleryMock } = vi.hoisted(() => ({
  openSingleImageGalleryMock: vi.fn(async () => undefined)
}));

vi.mock('obsidian', () => ({
  MarkdownView: class {},
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

vi.mock('@/features/gallery/gallery-actions', () => ({
  openGalleryForFiles: vi.fn(async () => undefined),
  openSingleImageGallery: openSingleImageGalleryMock
}));

vi.mock('@/utils/command-logging', () => ({
  executeLoggedCommand: vi.fn(async (_context: unknown, _meta: unknown, run: () => Promise<void>) => run()),
  logSkippedCommand: vi.fn()
}));

describe('GalleryFeature', () => {
  it('registers an active-image command and opens a single-image gallery for the selected image file', async () => {
    const { TFile } = await import('obsidian');
    const feature = new GalleryFeature();
    const activeFile = Object.assign(new TFile(), {
      path: 'assets/cover.png',
      name: 'cover.png',
      extension: 'png'
    });
    const context = {
      app: {
        workspace: {
          getActiveFile: vi.fn(() => activeFile),
          getActiveViewOfType: vi.fn(() => null)
        }
      },
      plugin: {
        addCommand: vi.fn()
      },
      services: {
        fileManager: {
          isImageFile: vi.fn(() => true)
        },
        settings: {
          getSettings: vi.fn(() => ({
            enableGallery: true,
            showOperationNotifications: true
          }))
        },
        logger: {
          refreshMode: vi.fn(),
          debug: vi.fn(),
          warn: vi.fn(),
          error: vi.fn()
        }
      }
    };

    await feature.register(context as never);

    expect(context.plugin.addCommand).toHaveBeenCalledTimes(3);
    expect(context.plugin.addCommand).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        id: 'open-active-image-gallery',
        name: '打开当前图片画廊'
      })
    );

    const command = vi.mocked(context.plugin.addCommand).mock.calls[0]?.[0];
    expect(command).toBeDefined();

    command?.callback?.();

    await vi.waitFor(() => {
      expect(openSingleImageGalleryMock).toHaveBeenCalledWith(context, activeFile);
    });
  });
});
