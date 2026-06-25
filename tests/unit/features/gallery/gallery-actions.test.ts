import { describe, expect, it, vi } from 'vitest';
import { GalleryGridSize, GallerySortBy } from '@/types/index';

const modalOpenMock = vi.fn();
const modalOptionsMock = vi.fn();
const galleryUi = {
  titleForNote: (noteName: string) => `Images in ${noteName}`,
  titleForFolder: (folderPath: string) => `Images in ${folderPath}`,
  titleForImage: (fileName: string) => `Image: ${fileName}`,
  searchPlaceholder: 'Filter by file name',
  sortBy: { date: 'Newest first', name: 'By name', size: 'Largest first' },
  viewMode: { grid: 'Grid', list: 'List' },
  emptyResults: 'No images match the current filter.',
  close: 'Close',
  previous: 'Previous',
  next: 'Next',
  copyImage: 'Copy Image'
};

vi.mock('obsidian', () => ({
  MarkdownView: class {},
  TFile: class {
    path = '';
    name = '';
    extension = '';
    basename = '';
    stat = {
      size: 0,
      mtime: 0
    };
  }
}));

vi.mock('@/ui/modals/image-gallery-modal', () => ({
  ImageGalleryModal: class {
    constructor(_app: unknown, options: unknown) {
      modalOptionsMock(options);
    }

    open(): void {
      modalOpenMock();
    }
  }
}));

describe('gallery-actions', () => {
  it('opens the source-note gallery with the current image preselected when a note context is available', async () => {
    const { TFile } = await import('obsidian');
    const { openSingleImageGallery } = await import('@/features/gallery/gallery-actions');
    const imageFile = Object.assign(new TFile(), {
      path: 'assets/photo.png',
      name: 'photo.png',
      basename: 'photo',
      extension: 'png',
      stat: {
        size: 128,
        mtime: 42
      }
    });
    const siblingImageFile = Object.assign(new TFile(), {
      path: 'assets/diagram.png',
      name: 'diagram.png',
      basename: 'diagram',
      extension: 'png',
      stat: {
        size: 256,
        mtime: 84
      }
    });
    const noteFile = Object.assign(new TFile(), {
      path: 'notes/demo.md',
      name: 'demo.md',
      basename: 'demo',
      extension: 'md'
    });
    const imageInfo = {
      path: imageFile.path,
      name: imageFile.name,
      extension: imageFile.extension,
      size: imageFile.stat.size,
      mtime: imageFile.stat.mtime,
      resourcePath: 'app://assets/photo.png',
      width: 100,
      height: 80
    };
    const siblingImageInfo = {
      path: siblingImageFile.path,
      name: siblingImageFile.name,
      extension: siblingImageFile.extension,
      size: siblingImageFile.stat.size,
      mtime: siblingImageFile.stat.mtime,
      resourcePath: 'app://assets/diagram.png',
      width: 160,
      height: 120
    };
    const context = {
      app: {
        metadataCache: {
          resolvedLinks: {}
        }
      },
      services: {
        imageProcessor: {
          getImageInfo: vi.fn(async (file: typeof imageFile) => (file.path === imageFile.path ? imageInfo : siblingImageInfo))
        },
        fileManager: {
          getImagesInNote: vi.fn(async () => [siblingImageFile, imageFile])
        },
        settings: {
          getSettings: vi.fn(() => ({
            uiLanguage: 'en',
            gallerySortBy: GallerySortBy.DATE,
            galleryGridSize: GalleryGridSize.MEDIUM
          }))
        }
      }
    };

    await openSingleImageGallery(context as never, imageFile as never, noteFile as never);

    expect(context.services.fileManager.getImagesInNote).toHaveBeenCalledWith(noteFile);
    expect(context.services.imageProcessor.getImageInfo).toHaveBeenCalledWith(siblingImageFile);
    expect(context.services.imageProcessor.getImageInfo).toHaveBeenCalledWith(imageFile);
    expect(modalOptionsMock.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        title: 'Images in demo',
        ui: expect.objectContaining({ copyImage: galleryUi.copyImage, close: galleryUi.close }),
        images: [siblingImageInfo, imageInfo],
        defaultSortBy: GallerySortBy.DATE,
        defaultGridSize: GalleryGridSize.MEDIUM,
        initialSelectedImagePath: 'assets/photo.png',
        onCopyImageToClipboard: expect.any(Function)
      })
    );
    expect(modalOpenMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to a single-image gallery when no note context is available', async () => {
    const { TFile } = await import('obsidian');
    const { openSingleImageGallery } = await import('@/features/gallery/gallery-actions');
    const imageFile = Object.assign(new TFile(), {
      path: 'assets/solo.png',
      name: 'solo.png',
      basename: 'solo',
      extension: 'png',
      stat: {
        size: 128,
        mtime: 42
      }
    });
    const imageInfo = {
      path: imageFile.path,
      name: imageFile.name,
      extension: imageFile.extension,
      size: imageFile.stat.size,
      mtime: imageFile.stat.mtime,
      resourcePath: 'app://assets/solo.png',
      width: 100,
      height: 80
    };
    const context = {
      app: {
        metadataCache: {
          resolvedLinks: {}
        },
        vault: {
          getAbstractFileByPath: vi.fn(() => null)
        },
        workspace: {
          getActiveViewOfType: vi.fn(() => null)
        }
      },
      services: {
        imageProcessor: {
          getImageInfo: vi.fn(async () => imageInfo)
        },
        settings: {
          getSettings: vi.fn(() => ({
            uiLanguage: 'en',
            gallerySortBy: GallerySortBy.DATE,
            galleryGridSize: GalleryGridSize.MEDIUM
          }))
        }
      }
    };

    await openSingleImageGallery(context as never, imageFile as never);

    expect(modalOptionsMock.mock.lastCall?.[0]).toEqual(
      expect.objectContaining({
        title: 'Image: solo.png',
        ui: expect.objectContaining({ copyImage: galleryUi.copyImage, close: galleryUi.close }),
        images: [imageInfo],
        initialSelectedImagePath: 'assets/solo.png'
      })
    );
  });

  it('passes through close-modal behavior for click-opened galleries', async () => {
    const { TFile } = await import('obsidian');
    const { openSingleImageGallery } = await import('@/features/gallery/gallery-actions');
    const imageFile = Object.assign(new TFile(), {
      path: 'assets/clicked.png',
      name: 'clicked.png',
      basename: 'clicked',
      extension: 'png',
      stat: {
        size: 512,
        mtime: 64
      }
    });
    const imageInfo = {
      path: imageFile.path,
      name: imageFile.name,
      extension: imageFile.extension,
      size: imageFile.stat.size,
      mtime: imageFile.stat.mtime,
      resourcePath: 'app://assets/clicked.png',
      width: 100,
      height: 80
    };
    const context = {
      app: {
        metadataCache: {
          resolvedLinks: {}
        },
        vault: {
          getAbstractFileByPath: vi.fn(() => null)
        },
        workspace: {
          getActiveViewOfType: vi.fn(() => null)
        }
      },
      services: {
        imageProcessor: {
          getImageInfo: vi.fn(async () => imageInfo)
        },
        settings: {
          getSettings: vi.fn(() => ({
            uiLanguage: 'en',
            gallerySortBy: GallerySortBy.DATE,
            galleryGridSize: GalleryGridSize.MEDIUM
          }))
        }
      }
    };

    await openSingleImageGallery(context as never, imageFile as never, undefined, {
      lightboxCloseBehavior: 'close-modal'
    });

    expect(modalOptionsMock.mock.lastCall?.[0]).toEqual(
      expect.objectContaining({
        title: 'Image: clicked.png',
        ui: expect.objectContaining({ copyImage: galleryUi.copyImage, close: galleryUi.close }),
        lightboxCloseBehavior: 'close-modal'
      })
    );
  });
});
