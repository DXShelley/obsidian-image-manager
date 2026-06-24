import { describe, expect, it, vi } from 'vitest';
import { Alignment } from '@/types/index';
import { PreviewFeature } from '@/features/preview/preview-feature';

const { openSingleImageGalleryMock } = vi.hoisted(() => ({
  openSingleImageGalleryMock: vi.fn(async () => undefined)
}));

vi.mock('obsidian', () => ({
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
  openSingleImageGallery: openSingleImageGalleryMock
}));

describe('PreviewFeature', () => {
  it('opens the single-image gallery when a rendered markdown image is double-clicked', async () => {
    const { TFile } = await import('obsidian');
    const feature = new PreviewFeature();
    const noteFile = Object.assign(new TFile(), {
      path: 'notes/demo.md',
      name: 'demo.md',
      extension: 'md',
      stat: {
        size: 0,
        mtime: 1
      }
    });
    const imageFile = Object.assign(new TFile(), {
      path: 'assets/photo.png',
      name: 'photo.png',
      extension: 'png',
      stat: {
        size: 100,
        mtime: 200
      }
    });
    let postProcessor: ((element: HTMLElement, context: { sourcePath: string }) => void) | undefined;
    const listeners = new Map<string, (event: Event) => void>();
    const attrs = new Map<string, string>();
    const imageElement = {
      addClass: vi.fn(),
      removeClass: vi.fn(),
      addEventListener: vi.fn((type: string, handler: (event: Event) => void) => {
        listeners.set(type, handler);
      }),
      setAttribute: vi.fn((name: string, value: string) => {
        attrs.set(name, value);
      }),
      getAttribute: vi.fn((name: string) => attrs.get(name) ?? null),
      closest: vi.fn((selector: string) => {
        if (selector === '.internal-embed') {
          return {
            getAttribute: vi.fn(() => 'assets/photo.png')
          };
        }
        return null;
      })
    };
    const context = {
      app: {
        metadataCache: {
          getFirstLinkpathDest: vi.fn((candidate: string) => (candidate === 'assets/photo.png' ? imageFile : null))
        },
        vault: {
          getResourcePath: vi.fn(() => 'app://assets/photo.png'),
          getAbstractFileByPath: vi.fn((path: string) => (path === noteFile.path ? noteFile : null))
        }
      },
      plugin: {
        registerMarkdownPostProcessor: vi.fn((callback: typeof postProcessor) => {
          postProcessor = callback;
        })
      },
      services: {
        fileManager: {
          isImageFile: vi.fn(() => true)
        },
        settings: {
          getSettings: vi.fn(() => ({
            enableGallery: true,
            enableImageAlign: false,
            imageAlignmentDefaultAlignment: Alignment.NONE,
            disableObsidianImageSelectionOnClick: false,
            showOperationNotifications: true
          }))
        }
      }
    };

    await feature.register(context as never);

    expect(postProcessor).toBeTypeOf('function');
    postProcessor?.(
      {
        querySelectorAll: vi.fn(() => [imageElement])
      } as never,
      { sourcePath: noteFile.path }
    );

    const dblclick = listeners.get('dblclick');
    expect(dblclick).toBeTypeOf('function');

    const event = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    } as unknown as Event;
    dblclick?.(event);

    await vi.waitFor(() => {
      expect(openSingleImageGalleryMock).toHaveBeenCalledWith(context, imageFile, noteFile);
    });
    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(imageElement.setAttribute).toHaveBeenCalledWith('data-image-manager-path', 'assets/photo.png');
    expect(attrs.get('src')).toContain('image-manager-mtime=200');
  });
});
