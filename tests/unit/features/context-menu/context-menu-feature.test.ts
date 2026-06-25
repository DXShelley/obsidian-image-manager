import { describe, expect, it, vi } from 'vitest';
import { ContextMenuFeature } from '@/features/context-menu/context-menu-feature';

const { openSingleImageGalleryMock } = vi.hoisted(() => ({
  openSingleImageGalleryMock: vi.fn(async () => undefined)
}));

const { pickImageSelectionMock } = vi.hoisted(() => ({
  pickImageSelectionMock: vi.fn(async () => null)
}));

const noticeMock = vi.fn();

vi.mock('obsidian', () => ({
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

vi.mock('@/ui/modals/image-selection-modal', () => ({
  pickImageSelection: pickImageSelectionMock
}));

vi.mock('@/utils/compatibility', () => ({
  canWriteImageToClipboard: vi.fn(() => false)
}));

function createMenuSpy() {
  const addedItems: Array<{
    title?: string;
    icon?: string;
    onClick?: () => void;
  }> = [];

  return {
    addedItems,
    menu: {
      addSeparator: vi.fn(),
      addItem: vi.fn((callback: (item: {
        setTitle: (title: string) => unknown;
        setIcon: (icon: string) => unknown;
        onClick: (handler: () => void) => unknown;
      }) => void) => {
        const itemState: {
          title?: string;
          icon?: string;
          onClick?: () => void;
        } = {};
        const item = {
          setTitle: (title: string) => {
            itemState.title = title;
            return item;
          },
          setIcon: (icon: string) => {
            itemState.icon = icon;
            return item;
          },
          onClick: (handler: () => void) => {
            itemState.onClick = handler;
            return item;
          }
        };
        callback(item);
        addedItems.push(itemState);
      })
    }
  };
}

describe('ContextMenuFeature', () => {
  it('does not add image actions when the context-menu setting is disabled', async () => {
    const { TFile } = await import('obsidian');
    const feature = new ContextMenuFeature();
    let fileMenuHandler:
      | ((menu: unknown, file: InstanceType<typeof TFile>) => void)
      | undefined;
    const file = Object.assign(new TFile(), {
      path: 'assets/photo.png',
      name: 'photo.png',
      extension: 'png'
    });
    const { menu, addedItems } = createMenuSpy();
    const context = {
      app: {
        workspace: {
          on: vi.fn((_event: string, callback: typeof fileMenuHandler) => {
            fileMenuHandler = callback;
            return { event: 'file-menu' };
          }),
          getActiveViewOfType: vi.fn(() => null)
        }
      },
      plugin: {
        registerEvent: vi.fn()
      },
      services: {
        fileManager: {
          isImageFile: vi.fn(() => true)
        },
        settings: {
          getSettings: vi.fn(() => ({
            enableContextMenu: false,
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

    fileMenuHandler?.(menu as never, file);

    expect(menu.addSeparator).not.toHaveBeenCalled();
    expect(addedItems).toHaveLength(0);
  });

  it('adds a gallery entry to the image file context menu and opens the single-image gallery', async () => {
    const { TFile } = await import('obsidian');
    const feature = new ContextMenuFeature();
    let fileMenuHandler:
      | ((menu: unknown, file: InstanceType<typeof TFile>) => void)
      | undefined;
    const file = Object.assign(new TFile(), {
      path: 'assets/photo.png',
      name: 'photo.png',
      extension: 'png'
    });
    const { menu, addedItems } = createMenuSpy();
    const context = {
      app: {
        workspace: {
          on: vi.fn((_event: string, callback: typeof fileMenuHandler) => {
            fileMenuHandler = callback;
            return { event: 'file-menu' };
          }),
          getActiveViewOfType: vi.fn(() => null)
        }
      },
      plugin: {
        registerEvent: vi.fn()
      },
      services: {
        fileManager: {
          isImageFile: vi.fn(() => true)
        },
        settings: {
          getSettings: vi.fn(() => ({
            enableContextMenu: true,
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

    expect(fileMenuHandler).toBeTypeOf('function');
    fileMenuHandler?.(menu as never, file);

    const galleryItem = addedItems.find((item) => item.title === '在画廊中打开');
    expect(galleryItem).toBeDefined();
    expect(galleryItem?.icon).toBe('images');

    galleryItem?.onClick?.();

    await vi.waitFor(() => {
      expect(openSingleImageGalleryMock).toHaveBeenCalledWith(context, file);
    });
  });

  it('adds crop action that runs through selection and recovery', async () => {
    const { TFile } = await import('obsidian');
    const feature = new ContextMenuFeature();
    let fileMenuHandler:
      | ((menu: unknown, file: InstanceType<typeof TFile>) => void)
      | undefined;
    const file = Object.assign(new TFile(), {
      path: 'assets/photo.png',
      name: 'photo.png',
      extension: 'png'
    });
    const { menu, addedItems } = createMenuSpy();
    const recoveryRunTransaction = vi.fn(async (_meta: unknown, run: () => Promise<void>) => run());
    const cropMock = vi.fn(async () => new ArrayBuffer(4));
    const replaceFileMock = vi.fn(async () => file);
    vi.mocked(pickImageSelectionMock).mockResolvedValue({
      x: 8,
      y: 6,
      width: 40,
      height: 20
    });
    const context = {
      app: {
        workspace: {
          on: vi.fn((_event: string, callback: typeof fileMenuHandler) => {
            fileMenuHandler = callback;
            return { event: 'file-menu' };
          }),
          getActiveViewOfType: vi.fn(() => null)
        }
      },
      plugin: {
        registerEvent: vi.fn()
      },
      services: {
        fileManager: {
          isImageFile: vi.fn(() => true),
          replaceFile: replaceFileMock
        },
        imageProcessor: {
          crop: cropMock
        },
        recovery: {
          runTransaction: recoveryRunTransaction
        },
        settings: {
          getSettings: vi.fn(() => ({
            enableContextMenu: true,
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
    fileMenuHandler?.(menu as never, file);

    const cropItem = addedItems.find((item) => item.title === '拖拽裁剪');
    expect(cropItem).toBeDefined();
    expect(addedItems.find((item) => item.title?.includes('去水印'))).toBeUndefined();

    cropItem?.onClick?.();
    await vi.waitFor(() => {
      expect(pickImageSelectionMock).toHaveBeenCalled();
      expect(recoveryRunTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          label: '右键裁剪图片 photo.png',
          trigger: 'context-menu',
          scope: 'single-file'
        }),
        expect.any(Function)
      );
      expect(cropMock).toHaveBeenCalledWith(file, {
        x: 8,
        y: 6,
        width: 40,
        height: 20
      });
      expect(replaceFileMock).toHaveBeenCalledWith(file, expect.any(ArrayBuffer));
    });
  });

});
