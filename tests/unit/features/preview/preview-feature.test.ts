import { describe, expect, it, vi } from 'vitest';
import { Alignment } from '@/types/index';
import { PreviewFeature } from '@/features/preview/preview-feature';
import { getUiCopy } from '@/i18n';

const { openSingleImageGalleryMock, showAtMouseEventMock, latestMenuItemsRef, noticeMock } = vi.hoisted(() => ({
  openSingleImageGalleryMock: vi.fn(async () => undefined),
  showAtMouseEventMock: vi.fn(),
  latestMenuItemsRef: {
    current: [] as Array<{
      title?: string;
      icon?: string;
      onClick?: () => void;
    }>
  },
  noticeMock: vi.fn()
}));

vi.mock('obsidian', () => ({
  Menu: class {
    constructor() {
      latestMenuItemsRef.current = [];
    }

    addItem(callback: (item: {
      setTitle: (title: string) => unknown;
      setIcon: (icon: string) => unknown;
      onClick: (handler: () => void) => unknown;
    }) => void) {
      const state: {
        title?: string;
        icon?: string;
        onClick?: () => void;
      } = {};
      const item = {
        setTitle: (title: string) => {
          state.title = title;
          return item;
        },
        setIcon: (icon: string) => {
          state.icon = icon;
          return item;
        },
        onClick: (handler: () => void) => {
          state.onClick = handler;
          return item;
        }
      };
      callback(item);
      latestMenuItemsRef.current.push(state);
      return this;
    }

    showAtMouseEvent(event: Event) {
      showAtMouseEventMock(event);
      return this;
    }
  },
  Notice: class {
    constructor(message: string) {
      noticeMock(message);
    }
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
      expect(openSingleImageGalleryMock).toHaveBeenCalledWith(context, imageFile, noteFile, {
        lightboxCloseBehavior: 'close-modal'
      });
    });
    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(imageElement.setAttribute).toHaveBeenCalledWith('data-image-manager-path', 'assets/photo.png');
    expect(attrs.get('src')).toContain('image-manager-mtime=200');
  });

  it('shows a context-menu entry for rendered external images and imports only the clicked source', async () => {
    const { TFile } = await import('obsidian');
    const feature = new PreviewFeature();
    const noteFile = Object.assign(new TFile(), {
      path: 'notes/demo.md',
      name: 'demo.md',
      basename: 'demo',
      extension: 'md',
      stat: {
        size: 0,
        mtime: 1
      }
    });
    let postProcessor: ((element: HTMLElement, context: { sourcePath: string }) => void) | undefined;
    const listeners = new Map<string, (event: Event) => void>();
    const importExternalImageLinkInNoteBySource = vi.fn(async () => ({ replaced: 1, downloaded: 1 }));
    const recoveryRunTransaction = vi.fn(async (_meta: unknown, run: () => Promise<void>) => run());
    const imageElement = {
      addClass: vi.fn(),
      removeClass: vi.fn(),
      addEventListener: vi.fn((type: string, handler: (event: Event) => void) => {
        listeners.set(type, handler);
      }),
      setAttribute: vi.fn(),
      getAttribute: vi.fn((name: string) => (name === 'src' ? 'https://example.com/photo.png' : null)),
      closest: vi.fn(() => null)
    };
    const context = {
      app: {
        metadataCache: {
          getFirstLinkpathDest: vi.fn(() => null)
        },
        vault: {
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
          isImageFile: vi.fn(() => true),
          importExternalImageLinkInNoteBySource
        },
        recovery: {
          runTransaction: recoveryRunTransaction
        },
        logger: {
          refreshMode: vi.fn()
        },
        settings: {
          getSettings: vi.fn(() => ({
            enableContextMenu: true,
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

    postProcessor?.(
      {
        querySelectorAll: vi.fn(() => [imageElement])
      } as never,
      { sourcePath: noteFile.path }
    );

    const contextmenu = listeners.get('contextmenu');
    expect(contextmenu).toBeTypeOf('function');

    const event = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    } as unknown as Event;
    contextmenu?.(event);

    expect(showAtMouseEventMock).toHaveBeenCalledWith(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();

    const importItem = latestMenuItemsRef.current.find(
      (item) => item.title === getUiCopy('zh-CN').contextMenu.downloadExternalImage
    );
    expect(importItem?.icon).toBe('download');

    importItem?.onClick?.();

    await vi.waitFor(() => {
      expect(recoveryRunTransaction).toHaveBeenCalled();
      expect(importExternalImageLinkInNoteBySource).toHaveBeenCalledWith(noteFile, 'https://example.com/photo.png');
    });
  });
});
