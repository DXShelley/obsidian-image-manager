import { afterEach, describe, expect, it, vi } from 'vitest';
import { TFile } from 'obsidian';
import { FileManager } from '@/services/file-manager';
import { LinkFormatter } from '@/services/link-formatter';
import { VariableResolver } from '@/services/variable-resolver';
import {
  Alignment,
  GalleryGridSize,
  GallerySortBy,
  ImageFormat,
  LinkFormat,
  PathFormat,
  type ImageManagerSettings
} from '@/types/index';

const settings: ImageManagerSettings = {
  defaultFormat: ImageFormat.WEBP,
  defaultQuality: 80,
  defaultLinkFormat: LinkFormat.WIKI,
  defaultPathFormat: PathFormat.SHORTEST,
  renamePattern: '{noteName}-{date}-{random}',
  outputFolder: '',
  enablePasteHandler: true,
  enableAutoDownloadImagesFromText: true,
  enableAutoConvert: true,
  enableAutoRename: true,
  enableGallery: true,
  enableContextMenu: true,
  enableDragResize: true,
  enableImageAlign: true,
  imageAlignmentDefaultAlignment: Alignment.NONE,
  disableObsidianImageSelectionOnClick: false,
  dropPasteCursorLocation: 'back',
  showOperationNotifications: true,
  showSpaceSavedNotification: true,
  enableNoteRenameSync: true,
  renameImagesOnNoteRelocate: false,
  galleryGridSize: GalleryGridSize.MEDIUM,
  gallerySortBy: GallerySortBy.DATE,
  compressionQuality: 80,
  compressionIgnorePattern: '',
  conversionIgnorePattern: '',
  compressionThresholdKB: 100
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('FileManager.replaceFile', () => {
  it('updates binary content in place when the target path is unchanged', async () => {
    const app = {
      vault: {
        modifyBinary: vi.fn(async () => undefined)
      },
      fileManager: {
        renameFile: vi.fn(async () => undefined)
      },
      workspace: {
        iterateAllLeaves: vi.fn()
      }
    };
    const manager = new FileManager(
      app as never,
      () => settings,
      {} as never,
      {} as never
    );
    const file = { path: 'assets/photo.png', name: 'photo.png' };

    const result = await manager.replaceFile(file as never, new ArrayBuffer(8));

    expect(result).toBe(file);
    expect(app.vault.modifyBinary).toHaveBeenCalledWith(file, expect.any(ArrayBuffer), expect.objectContaining({ mtime: expect.any(Number) }));
    expect(app.fileManager.renameFile).not.toHaveBeenCalled();
  });

  it('renames the file after replacing binary content when the target path changes', async () => {
    const file = { path: 'assets/photo.png', name: 'photo.png' };
    const app = {
      vault: {
        modifyBinary: vi.fn(async () => undefined)
      },
      fileManager: {
        renameFile: vi.fn(async (_file: typeof file, newPath: string) => {
          file.path = newPath;
          file.name = newPath.split('/').pop() ?? newPath;
        })
      },
      workspace: {
        iterateAllLeaves: vi.fn()
      }
    };
    const manager = new FileManager(
      app as never,
      () => settings,
      {} as never,
      {} as never
    );

    const result = await manager.replaceFile(file as never, new ArrayBuffer(8), 'assets/photo.webp');

    expect(result).toBe(file);
    expect(app.vault.modifyBinary).toHaveBeenCalledWith(file, expect.any(ArrayBuffer), expect.objectContaining({ mtime: expect.any(Number) }));
    expect(app.fileManager.renameFile).toHaveBeenCalledWith(file, 'assets/photo.webp');
    expect(file.path).toBe('assets/photo.webp');
  });
});

describe('FileManager.syncManagedImagesForNote', () => {
  it('skips note relocation sync when outputFolder does not identify a managed folder', async () => {
    const manager = new FileManager(
      {
        vault: {},
        fileManager: {}
      } as never,
      () => settings,
      {} as never,
      {} as never
    );

    const movedCount = await manager.syncManagedImagesForNote({ path: 'note.md', basename: 'note' } as never, 'old-note.md');

    expect(movedCount).toBe(0);
  });
});

describe('FileManager.saveImage', () => {
  it('adds a zero-padded sequence for time-based rename collisions', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 24, 0, 5, 7));

    const savedPaths = new Set<string>();
    const note = Object.assign(new TFile(), {
      path: 'notes/test.md',
      name: 'test.md',
      basename: 'test',
      extension: 'md'
    });
    const app = {
      vault: {
        getAbstractFileByPath: vi.fn((path: string) => {
          if (path === 'notes') {
            return { path: 'notes' };
          }
          return savedPaths.has(path) ? { path } : null;
        }),
        createBinary: vi.fn(async (path: string) => {
          savedPaths.add(path);
          return Object.assign(new TFile(), {
            path,
            name: path.split('/').pop() ?? path,
            basename: (path.split('/').pop() ?? path).replace(/\.[^/.]+$/, ''),
            extension: 'png'
          });
        })
      }
    };
    const manager = new FileManager(
      app as never,
      () => ({
        ...settings,
        renamePattern: '{noteName}-{date}-{time}'
      }),
      new VariableResolver(),
      {} as never
    );

    const first = await manager.saveImage(new ArrayBuffer(8), 'photo.png', note as never);
    const second = await manager.saveImage(new ArrayBuffer(8), 'photo.png', note as never);

    expect(first.path).toBe('notes/test-2026-06-24-00-05-07.png');
    expect(second.path).toBe('notes/test-2026-06-24-00-05-07-01.png');
  });
});

describe('FileManager.rewriteImageLinksInNote', () => {
  it('rewrites image links in a note using the current link preferences', async () => {
    const note = Object.assign(new TFile(), {
      path: 'notes/test.md',
      name: 'test.md',
      basename: 'test',
      extension: 'md'
    });
    const image = Object.assign(new TFile(), {
      path: 'notes/photo.png',
      name: 'photo.png',
      basename: 'photo',
      extension: 'png'
    });
    const app = {
      vault: {
        read: vi.fn(async () => '![Preview](photo.png)'),
        modify: vi.fn(async () => undefined),
        getFiles: vi.fn(() => [note, image])
      },
      metadataCache: {
        getFirstLinkpathDest: vi.fn(() => image),
        resolvedLinks: {
          'notes/test.md': {
            'notes/photo.png': 1
          }
        }
      },
      fileManager: {
        renameFile: vi.fn(async () => undefined)
      }
    };
    const manager = new FileManager(
      app as never,
      () => settings,
      new VariableResolver(),
      new LinkFormatter(app as never)
    );

    const result = await manager.rewriteImageLinksInNote(note as never);

    expect(result).toEqual({ replaced: 1, moved: 0, downloaded: 0 });
    expect(app.vault.modify).toHaveBeenCalledWith(note, '![[photo.png|Preview]]');
  });

  it('downloads external image links when auto-download is enabled', async () => {
    const note = Object.assign(new TFile(), {
      path: 'notes/test.md',
      name: 'test.md',
      basename: 'test',
      extension: 'md'
    });
    const savedImage = Object.assign(new TFile(), {
      path: 'notes/photo.png',
      name: 'photo.png',
      basename: 'photo',
      extension: 'png',
      parent: { path: 'notes' }
    });
    const app = {
      vault: {
        read: vi.fn(async () => '![Remote](https://example.com/photo.png)'),
        modify: vi.fn(async () => undefined),
        getFiles: vi.fn(() => [note, savedImage]),
        getAbstractFileByPath: vi.fn((path: string) => {
          if (path === 'notes') {
            return { path: 'notes' };
          }
          return null;
        }),
        createBinary: vi.fn(async () => savedImage)
      },
      metadataCache: {
        getFirstLinkpathDest: vi.fn((rawTarget: string) => {
          if (rawTarget === 'photo.png' || rawTarget === 'notes/photo.png') {
            return savedImage;
          }
          return null;
        }),
        resolvedLinks: {}
      },
      fileManager: {
        renameFile: vi.fn(async () => undefined)
      }
    };
    const manager = new FileManager(
      app as never,
      () => ({
        ...settings,
        enableAutoRename: false,
        defaultLinkFormat: LinkFormat.MARKDOWN,
        defaultPathFormat: PathFormat.RELATIVE
      }),
      new VariableResolver(),
      new LinkFormatter(app as never)
    );
    const fetchMock = vi.fn(async () => ({
      ok: true,
      headers: {
        get: vi.fn(() => 'image/png')
      },
      arrayBuffer: vi.fn(async () => new Uint8Array([1, 2, 3]).buffer)
    }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await manager.rewriteImageLinksInNote(note as never);

    expect(fetchMock).toHaveBeenCalledWith('https://example.com/photo.png');
    expect(app.vault.createBinary).toHaveBeenCalled();
    expect(result).toEqual({ replaced: 1, moved: 0, downloaded: 1 });
    expect(app.vault.modify).toHaveBeenCalledWith(note, '![Remote](photo.png)');
  });

  it('deduplicates repeated references to the same image inside a note', async () => {
    const note = Object.assign(new TFile(), {
      path: 'notes/test.md',
      name: 'test.md',
      basename: 'test',
      extension: 'md'
    });
    const image = Object.assign(new TFile(), {
      path: 'notes/photo.png',
      name: 'photo.png',
      basename: 'photo',
      extension: 'png'
    });
    const app = {
      vault: {
        read: vi.fn(async () => '![One](photo.png)\n![Two](photo.png)')
      },
      metadataCache: {
        getFirstLinkpathDest: vi.fn(() => image)
      }
    };
    const manager = new FileManager(
      app as never,
      () => settings,
      new VariableResolver(),
      {} as never
    );

    const files = await manager.getImagesInNote(note as never);

    expect(files).toEqual([image]);
  });
});
