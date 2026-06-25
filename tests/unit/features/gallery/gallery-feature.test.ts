import { describe, expect, it, vi } from 'vitest';
import { GalleryFeature } from '@/features/gallery/gallery-feature';

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
  openGalleryForFiles: vi.fn(async () => undefined)
}));

vi.mock('@/utils/command-logging', () => ({
  executeLoggedCommand: vi.fn(async (_context: unknown, _meta: unknown, run: () => Promise<void>) => run()),
  logSkippedCommand: vi.fn()
}));

describe('GalleryFeature', () => {
  it('registers note and folder gallery commands', async () => {
    const feature = new GalleryFeature();
    const context = {
      app: {
        workspace: {
          getActiveFile: vi.fn(() => null),
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

    expect(context.plugin.addCommand).toHaveBeenCalledTimes(2);
    expect(context.plugin.addCommand).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        id: 'open-current-note-gallery',
        name: '打开画廊'
      })
    );
    expect(context.plugin.addCommand).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        id: 'open-current-folder-gallery',
        name: '打开画廊'
      })
    );
  });
});
