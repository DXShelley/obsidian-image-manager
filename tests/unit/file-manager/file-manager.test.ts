import { afterEach, describe, expect, it, vi } from 'vitest';
import * as obsidian from 'obsidian';
import { TFile, TFolder } from 'obsidian';
import { FileManager } from '@/services/file-manager';
import { LinkFormatter } from '@/services/link-formatter';
import { VariableResolver } from '@/services/variable-resolver';
import {
  Alignment,
  GalleryGridSize,
  GallerySortBy,
  ImageFormat,
  LinkFormat,
  MarkdownPathEncodingStrategy,
  PathFormat,
  type ImageManagerSettings
} from '@/types/index';

const settings: ImageManagerSettings = {
  defaultFormat: ImageFormat.WEBP,
  defaultQuality: 80,
  defaultLinkFormat: LinkFormat.WIKI,
  defaultPathFormat: PathFormat.SHORTEST,
  markdownPathEncodingStrategy: MarkdownPathEncodingStrategy.ENCODED,
  renamePattern: '{noteName}-{date}-{random}',
  outputFolder: '',
  enablePasteHandler: true,
  enableAutoDownloadImagesFromText: true,
  enableAutoConvert: true,
  enableAutoRename: true,
  enableGallery: true,
  enableContextMenu: true,
  enableImageAlign: true,
  imageAlignmentDefaultAlignment: Alignment.NONE,
  disableObsidianImageSelectionOnClick: false,
  dropPasteCursorLocation: 'back',
  showOperationNotifications: true,
  showSpaceSavedNotification: true,
  enableDebugLogging: false,
  enableNoteRenameSync: true,
  renameImagesOnNoteRelocate: false,
  deleteEmptyFolders: true,
  deleteOrphanImages: false,
  galleryGridSize: GalleryGridSize.MEDIUM,
  gallerySortBy: GallerySortBy.DATE,
  compressionQuality: 80,
  compressionIgnorePattern: '',
  conversionIgnorePattern: '',
  compressionThresholdKB: 100
};

afterEach(() => {
  vi.restoreAllMocks();
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

  it('defers leaf refresh during bulk updates and flushes once at the end', async () => {
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
    const first = { path: 'assets/one.png', name: 'one.png' };
    const second = { path: 'assets/two.png', name: 'two.png' };

    await manager.runWithDeferredLeafRefresh(async () => {
      await manager.replaceFile(first as never, new ArrayBuffer(8));
      await manager.replaceFile(second as never, new ArrayBuffer(8));
      expect(app.workspace.iterateAllLeaves).not.toHaveBeenCalled();
    });

    expect(app.workspace.iterateAllLeaves).toHaveBeenCalledTimes(1);
  });

  it('preserves literal percent markdown paths when renaming an image file', async () => {
    const note = Object.assign(new TFile(), {
      path: 'notes/test.md',
      name: 'test.md',
      basename: 'test',
      extension: 'md'
    });
    const file = Object.assign(new TFile(), {
      path: 'assets/%E6%89%AF%E7%9A%AE/test.png',
      name: 'test.png',
      basename: 'test',
      extension: 'png'
    });
    const originalTarget = 'assets/%E6%89%AF%E7%9A%AE/test.png';
    const app = {
      vault: {
        modifyBinary: vi.fn(async () => undefined),
        read: vi.fn(async () => `![Encoded](${originalTarget})`),
        modify: vi.fn(async () => undefined),
        getAbstractFileByPath: vi.fn((path: string) => {
          if (path === note.path) {
            return note;
          }
          return null;
        })
      },
      metadataCache: {
        getFirstLinkpathDest: vi.fn((target: string) => {
          if (target === originalTarget || target === 'assets/%E6%89%AF%E7%9A%AE/test.webp') {
            return file;
          }
          return null;
        }),
        resolvedLinks: {
          'notes/test.md': {
            [file.path]: 1
          }
        }
      },
      fileManager: {
        renameFile: vi.fn(async (_file: typeof file, newPath: string) => {
          file.path = newPath;
          file.name = newPath.split('/').pop() ?? newPath;
          file.extension = newPath.split('.').pop() ?? 'webp';
        })
      },
      workspace: {
        iterateAllLeaves: vi.fn()
      }
    };
    const manager = new FileManager(
      app as never,
      () => ({
        ...settings,
        defaultLinkFormat: LinkFormat.MARKDOWN,
        defaultPathFormat: PathFormat.RELATIVE
      }),
      new VariableResolver(),
      new LinkFormatter(app as never)
    );

    await manager.replaceFile(file as never, new ArrayBuffer(8), 'assets/%E6%89%AF%E7%9A%AE/test.webp');

    expect(app.vault.modify).toHaveBeenCalledWith(note, '![Encoded](../assets/%E6%89%AF%E7%9A%AE/test.webp)');
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

  it('records the original note path and created folder state so undo can restore a moved note cleanly', async () => {
    const oldNotePath = '00_inbox/fleeting/demo.md';
    const newNotePath = '04_archived/sunway/demo.md';
    const note = Object.assign(new TFile(), {
      path: newNotePath,
      name: 'demo.md',
      basename: 'demo',
      extension: 'md'
    });
    const image = Object.assign(new TFile(), {
      path: '00_inbox/fleeting/assets/demo/image.webp',
      name: 'image.webp',
      basename: 'image',
      extension: 'webp'
    });
    const oldFolder = Object.assign(new TFolder(), {
      path: '00_inbox/fleeting/assets/demo',
      children: [image]
    });
    const createdFolders: string[] = [];
    const recoveryManager = {
      captureTextSnapshot: vi.fn(async () => undefined),
      recordRename: vi.fn(),
      captureBinarySnapshot: vi.fn(async () => undefined),
      recordDeletedFolder: vi.fn(),
      recordCreatedFolder: vi.fn((path: string) => {
        createdFolders.push(path);
      })
    };
    const app = {
      vault: {
        read: vi.fn(async () => '![A](assets/demo/image.webp)'),
        modify: vi.fn(async () => undefined),
        getAbstractFileByPath: vi.fn((path: string) => {
          if (path === oldFolder.path) {
            return oldFolder;
          }
          return null;
        }),
        getFiles: vi.fn(() => [note, image]),
        createFolder: vi.fn(async () => undefined),
        delete: vi.fn(async () => undefined)
      },
      metadataCache: {
        getFirstLinkpathDest: vi.fn(() => image),
        resolvedLinks: {
          [newNotePath]: {
            [image.path]: 1
          }
        }
      },
      fileManager: {
        renameFile: vi.fn(async (file: TFile, targetPath: string) => {
          file.path = targetPath;
        }),
        trashFile: vi.fn(async () => undefined)
      }
    };
    const manager = new FileManager(
      app as never,
      () => ({
        ...settings,
        outputFolder: './assets/${noteFileName}'
      }),
      new VariableResolver(),
      new LinkFormatter(app as never)
    );
    manager.setRecoveryManager(recoveryManager as never);

    const movedCount = await manager.syncManagedImagesForNote(note as never, oldNotePath);

    expect(movedCount).toBe(1);
    expect(recoveryManager.captureTextSnapshot).toHaveBeenCalledWith(oldNotePath, '![A](assets/demo/image.webp)');
    expect(recoveryManager.recordRename).toHaveBeenCalledWith(oldNotePath, newNotePath);
    expect(createdFolders).toContain('04_archived');
    expect(createdFolders).toContain('04_archived/sunway/assets/demo');
  });

  it('only removes empty managed image folders after note relocation', async () => {
    const oldNotePath = '00_inbox/fleeting/demo.md';
    const newNotePath = '04_archived/sunway/demo.md';
    const note = Object.assign(new TFile(), {
      path: newNotePath,
      name: 'demo.md',
      basename: 'demo',
      extension: 'md'
    });
    const oldNoteFolder = Object.assign(new TFolder(), {
      path: '00_inbox/fleeting',
      children: [] as Array<TFolder | TFile>
    });
    const assetsFolder = Object.assign(new TFolder(), {
      path: '00_inbox/fleeting/assets',
      parent: oldNoteFolder,
      children: [] as Array<TFolder | TFile>
    });
    const oldImageFolder = Object.assign(new TFolder(), {
      path: '00_inbox/fleeting/assets/demo',
      parent: assetsFolder,
      children: [] as Array<TFolder | TFile>
    });
    const image = Object.assign(new TFile(), {
      path: '00_inbox/fleeting/assets/demo/image.webp',
      name: 'image.webp',
      basename: 'image',
      extension: 'webp',
      parent: oldImageFolder
    });
    oldNoteFolder.children = [assetsFolder];
    assetsFolder.children = [oldImageFolder];
    oldImageFolder.children = [image];

    const objects = new Map<string, TFolder | TFile>([
      [oldNoteFolder.path, oldNoteFolder],
      [assetsFolder.path, assetsFolder],
      [oldImageFolder.path, oldImageFolder],
      [image.path, image]
    ]);
    const deletedFolders: string[] = [];
    const app = {
      vault: {
        read: vi.fn(async () => '![A](assets/demo/image.webp)'),
        modify: vi.fn(async () => undefined),
        getAbstractFileByPath: vi.fn((path: string) => objects.get(path) ?? null),
        getFiles: vi.fn(() => [note, image]),
        createFolder: vi.fn(async () => undefined),
        delete: vi.fn(async (target: TFolder | TFile) => {
          objects.delete(target.path);
          if (target instanceof TFolder) {
            deletedFolders.push(target.path);
          }
          const parent = target.parent instanceof TFolder ? target.parent : null;
          if (parent) {
            parent.children = parent.children.filter((child) => child !== target);
          }
        })
      },
      metadataCache: {
        getFirstLinkpathDest: vi.fn(() => image),
        resolvedLinks: {
          [newNotePath]: {
            [image.path]: 1
          }
        }
      },
      fileManager: {
        renameFile: vi.fn(async (file: TFile, targetPath: string) => {
          const parent = file.parent instanceof TFolder ? file.parent : null;
          if (parent) {
            parent.children = parent.children.filter((child) => child !== file);
          }
          objects.delete(file.path);
          file.path = targetPath;
          file.parent = null;
          objects.set(file.path, file);
        }),
        trashFile: vi.fn(async (target: TFolder | TFile) => {
          objects.delete(target.path);
          if (target instanceof TFolder) {
            deletedFolders.push(target.path);
          }
          const parent = target.parent instanceof TFolder ? target.parent : null;
          if (parent) {
            parent.children = parent.children.filter((child) => child !== target);
          }
        })
      }
    };
    const manager = new FileManager(
      app as never,
      () => ({
        ...settings,
        outputFolder: './assets/${noteFileName}'
      }),
      new VariableResolver(),
      new LinkFormatter(app as never)
    );

    const movedCount = await manager.syncManagedImagesForNote(note as never, oldNotePath);

    expect(movedCount).toBe(1);
    expect(deletedFolders).toEqual([
      '00_inbox/fleeting/assets/demo',
      '00_inbox/fleeting/assets'
    ]);
    expect(objects.get('00_inbox/fleeting')).toBe(oldNoteFolder);
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

    expect(result).toEqual({ replaced: 1, moved: 0, downloaded: 0, deleted: 0, foldersDeleted: 0 });
    expect(app.vault.modify).toHaveBeenCalledWith(note, '![[photo.png|Preview]]');
  });

  it('imports external image links through the dedicated import flow', async () => {
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
    const requestUrlMock = vi.spyOn(obsidian, 'requestUrl').mockResolvedValue({
      status: 200,
      headers: { 'content-type': 'image/png' },
      arrayBuffer: new Uint8Array([1, 2, 3]).buffer,
      text: '',
      json: null
    });

    const result = await manager.importExternalImageLinksInNote(note as never);

    expect(requestUrlMock).toHaveBeenCalledWith({ url: 'https://example.com/photo.png', throw: false });
    expect(app.vault.createBinary).toHaveBeenCalled();
    expect(result).toEqual({ replaced: 1, downloaded: 1 });
    expect(app.vault.modify).toHaveBeenCalledWith(note, '![Remote](photo.png)');
  });

  it('imports extensionless external image urls when the response confirms an image content type', async () => {
    const note = Object.assign(new TFile(), {
      path: 'notes/test.md',
      name: 'test.md',
      basename: 'test',
      extension: 'md'
    });
    const savedImage = Object.assign(new TFile(), {
      path: 'notes/render.png',
      name: 'render.png',
      basename: 'render',
      extension: 'png',
      parent: { path: 'notes' }
    });
    const app = {
      vault: {
        read: vi.fn(async () => '![Remote](https://cdn.example.com/render?id=42)'),
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
          if (rawTarget === 'render.png' || rawTarget === 'notes/render.png') {
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
    const requestUrlMock = vi.spyOn(obsidian, 'requestUrl').mockResolvedValue({
      status: 200,
      headers: { 'content-type': 'image/png' },
      arrayBuffer: new Uint8Array([7, 8, 9]).buffer,
      text: '',
      json: null
    });

    const result = await manager.importExternalImageLinksInNote(note as never);

    expect(requestUrlMock).toHaveBeenCalledWith({ url: 'https://cdn.example.com/render?id=42', throw: false });
    expect(app.vault.createBinary).toHaveBeenCalled();
    expect(result).toEqual({ replaced: 1, downloaded: 1 });
    expect(app.vault.modify).toHaveBeenCalledWith(note, '![Remote](render.png)');
  });

  it('imports only the external image link that matches the selected rendered image source', async () => {
    const note = Object.assign(new TFile(), {
      path: 'notes/test.md',
      name: 'test.md',
      basename: 'test',
      extension: 'md'
    });
    const savedImage = Object.assign(new TFile(), {
      path: 'notes/photo-b.png',
      name: 'photo-b.png',
      basename: 'photo-b',
      extension: 'png',
      parent: { path: 'notes' }
    });
    const content = '![One](https://example.com/photo-a.png)\n![Two](https://example.com/photo-b.png)';
    const app = {
      vault: {
        read: vi.fn(async () => content),
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
          if (rawTarget === 'photo-b.png' || rawTarget === 'notes/photo-b.png') {
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
    const requestUrlMock = vi.spyOn(obsidian, 'requestUrl').mockImplementation(async (request) => {
      const url = typeof request === 'string' ? request : request.url;
      return {
        status: 200,
        headers: { 'content-type': 'image/png' },
        arrayBuffer: new Uint8Array(url.includes('photo-b') ? [4, 5, 6] : [1, 2, 3]).buffer,
        text: '',
        json: null
      };
    });

    const result = await manager.importExternalImageLinkInNoteBySource(note as never, 'https://example.com/photo-b.png');

    expect(requestUrlMock).toHaveBeenCalledTimes(1);
    expect(requestUrlMock).toHaveBeenCalledWith({ url: 'https://example.com/photo-b.png', throw: false });
    expect(result).toEqual({ replaced: 1, downloaded: 1 });
    expect(app.vault.modify).toHaveBeenCalledWith(
      note,
      '![One](https://example.com/photo-a.png)\n![Two](photo-b.png)'
    );
  });

  it('imports the requested occurrence when the same external image source appears multiple times', async () => {
    const note = Object.assign(new TFile(), {
      path: 'notes/test.md',
      name: 'test.md',
      basename: 'test',
      extension: 'md'
    });
    const firstSavedImage = Object.assign(new TFile(), {
      path: 'notes/first.png',
      name: 'first.png',
      basename: 'first',
      extension: 'png',
      parent: { path: 'notes' }
    });
    const secondSavedImage = Object.assign(new TFile(), {
      path: 'notes/second.png',
      name: 'second.png',
      basename: 'second',
      extension: 'png',
      parent: { path: 'notes' }
    });
    const content = [
      '![One](https://example.com/shared.png)',
      '![Two](https://example.com/shared.png)'
    ].join('\n');
    const createdImages = [firstSavedImage, secondSavedImage];
    const app = {
      vault: {
        read: vi.fn(async () => content),
        modify: vi.fn(async () => undefined),
        getFiles: vi.fn(() => [note, firstSavedImage, secondSavedImage]),
        getAbstractFileByPath: vi.fn((path: string) => {
          if (path === 'notes') {
            return { path: 'notes' };
          }
          return null;
        }),
        createBinary: vi.fn(async () => createdImages.shift())
      },
      metadataCache: {
        getFirstLinkpathDest: vi.fn((rawTarget: string) => {
          if (rawTarget === 'first.png' || rawTarget === 'notes/first.png') {
            return firstSavedImage;
          }
          if (rawTarget === 'second.png' || rawTarget === 'notes/second.png') {
            return secondSavedImage;
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
    const requestUrlMock = vi.spyOn(obsidian, 'requestUrl').mockResolvedValue({
      status: 200,
      headers: { 'content-type': 'image/png' },
      arrayBuffer: new Uint8Array([1, 2, 3]).buffer,
      text: '',
      json: null
    });

    const result = await manager.importExternalImageLinkInNoteBySource(note as never, 'https://example.com/shared.png', {
      occurrence: 2
    });

    expect(requestUrlMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ replaced: 1, downloaded: 1 });
    expect(app.vault.modify).toHaveBeenCalledWith(
      note,
      '![One](https://example.com/shared.png)\n![Two](first.png)'
    );
  });

  it('normalizes mixed encoded and unencoded Chinese markdown paths in a single note', async () => {
    const note = Object.assign(new TFile(), {
      path: 'notes/test.md',
      name: 'test.md',
      basename: 'test',
      extension: 'md'
    });
    const webpImage = Object.assign(new TFile(), {
      path: 'assets/扯皮留痕-裴-详细记录/扯皮留痕-裴-详细记录-2026-06-23-21-10-30-01.webp',
      name: '扯皮留痕-裴-详细记录-2026-06-23-21-10-30-01.webp',
      basename: '扯皮留痕-裴-详细记录-2026-06-23-21-10-30-01',
      extension: 'webp'
    });
    const pngImage = Object.assign(new TFile(), {
      path: 'assets/扯皮留痕-裴-详细记录/扯皮留痕-裴-详细记录-2026-06-23-21-10-30-02.png',
      name: '扯皮留痕-裴-详细记录-2026-06-23-21-10-30-02.png',
      basename: '扯皮留痕-裴-详细记录-2026-06-23-21-10-30-02',
      extension: 'png'
    });
    const encodedPngTarget =
      'assets/%E6%89%AF%E7%9A%AE%E7%95%99%E7%97%95-%E8%A3%B4-%E8%AF%A6%E7%BB%86%E8%AE%B0%E5%BD%95/%E6%89%AF%E7%9A%AE%E7%95%99%E7%97%95-%E8%A3%B4-%E8%AF%A6%E7%BB%86%E8%AE%B0%E5%BD%95-2026-06-23-21-10-30-02.png';
    const app = {
      vault: {
        read: vi.fn(async () => [
          '![A](assets/扯皮留痕-裴-详细记录/扯皮留痕-裴-详细记录-2026-06-23-21-10-30-01.webp)',
          `![B](${encodedPngTarget})`
        ].join('\n')),
        modify: vi.fn(async () => undefined),
        getFiles: vi.fn(() => [note, webpImage, pngImage]),
        getAbstractFileByPath: vi.fn(() => ({ path: 'assets/扯皮留痕-裴-详细记录' }))
      },
      metadataCache: {
        getFirstLinkpathDest: vi.fn((target: string) => {
          if (target === webpImage.path) {
            return webpImage;
          }
          if (target === encodedPngTarget) {
            return null;
          }
          if (target === pngImage.path) {
            return pngImage;
          }
          return null;
        }),
        resolvedLinks: {
          'notes/test.md': {
            [webpImage.path]: 1,
            [pngImage.path]: 1
          }
        }
      },
      fileManager: {
        renameFile: vi.fn(async () => undefined)
      }
    };
    const manager = new FileManager(
      app as never,
      () => ({
        ...settings,
        outputFolder: 'assets/扯皮留痕-裴-详细记录',
        defaultLinkFormat: LinkFormat.MARKDOWN,
        defaultPathFormat: PathFormat.RELATIVE
      }),
      new VariableResolver(),
      new LinkFormatter(app as never)
    );

    const result = await manager.rewriteImageLinksInNote(note as never);

    expect(result).toEqual({ replaced: 2, moved: 0, downloaded: 0, deleted: 0, foldersDeleted: 0 });
    expect(app.vault.modify).toHaveBeenCalledWith(
      note,
      [
        '![A](../assets/%E6%89%AF%E7%9A%AE%E7%95%99%E7%97%95-%E8%A3%B4-%E8%AF%A6%E7%BB%86%E8%AE%B0%E5%BD%95/%E6%89%AF%E7%9A%AE%E7%95%99%E7%97%95-%E8%A3%B4-%E8%AF%A6%E7%BB%86%E8%AE%B0%E5%BD%95-2026-06-23-21-10-30-01.webp)',
        '![B](../assets/%E6%89%AF%E7%9A%AE%E7%95%99%E7%97%95-%E8%A3%B4-%E8%AF%A6%E7%BB%86%E8%AE%B0%E5%BD%95/%E6%89%AF%E7%9A%AE%E7%95%99%E7%97%95-%E8%A3%B4-%E8%AF%A6%E7%BB%86%E8%AE%B0%E5%BD%95-2026-06-23-21-10-30-02.png)'
      ].join('\n')
    );
  });

  it('resolves literal percent paths before decoded paths when rewriting links', async () => {
    const note = Object.assign(new TFile(), {
      path: 'notes/test.md',
      name: 'test.md',
      basename: 'test',
      extension: 'md'
    });
    const image = Object.assign(new TFile(), {
      path: 'assets/%E6%89%AF%E7%9A%AE/test.png',
      name: 'test.png',
      basename: 'test',
      extension: 'png'
    });
    const encodedTarget = 'assets/%E6%89%AF%E7%9A%AE/test.png';
    const app = {
      vault: {
        read: vi.fn(async () => `![Encoded](${encodedTarget})`),
        modify: vi.fn(async () => undefined),
        getFiles: vi.fn(() => [note, image]),
        getAbstractFileByPath: vi.fn(() => ({ path: 'assets/%E6%89%AF%E7%9A%AE' }))
      },
      metadataCache: {
        getFirstLinkpathDest: vi.fn((target: string) => {
          if (target === encodedTarget) {
            return image;
          }
          return null;
        }),
        resolvedLinks: {
          'notes/test.md': {
            [image.path]: 1
          }
        }
      },
      fileManager: {
        renameFile: vi.fn(async () => undefined)
      }
    };
    const manager = new FileManager(
      app as never,
      () => ({
        ...settings,
        outputFolder: 'assets/%E6%89%AF%E7%9A%AE',
        defaultLinkFormat: LinkFormat.MARKDOWN,
        defaultPathFormat: PathFormat.RELATIVE
      }),
      new VariableResolver(),
      new LinkFormatter(app as never)
    );

    const result = await manager.rewriteImageLinksInNote(note as never);

    expect(result).toEqual({ replaced: 1, moved: 0, downloaded: 0, deleted: 0, foldersDeleted: 0 });
    expect(app.vault.modify).toHaveBeenCalledWith(note, '![Encoded](../assets/%25E6%2589%25AF%25E7%259A%25AE/test.png)');
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
      new LinkFormatter(app as never)
    );

    const files = await manager.getImagesInNote(note as never);

    expect(files).toEqual([image]);
  });

  it('treats AVIF files as managed note images for conversion and link maintenance', async () => {
    const note = Object.assign(new TFile(), {
      path: 'notes/test.md',
      name: 'test.md',
      basename: 'test',
      extension: 'md'
    });
    const image = Object.assign(new TFile(), {
      path: 'notes/photo.avif',
      name: 'photo.avif',
      basename: 'photo',
      extension: 'avif'
    });
    const app = {
      vault: {
        read: vi.fn(async () => '![One](photo.avif)')
      },
      metadataCache: {
        getFirstLinkpathDest: vi.fn(() => image)
      }
    };
    const manager = new FileManager(
      app as never,
      () => settings,
      new VariableResolver(),
      new LinkFormatter(app as never)
    );

    const files = await manager.getImagesInNote(note as never);

    expect(files).toEqual([image]);
  });

  it('deletes orphan images in a folder and removes empty folders when enabled', async () => {
    const orphan = Object.assign(new TFile(), {
      path: 'assets/note/orphan.png',
      name: 'orphan.png',
      basename: 'orphan',
      extension: 'png'
    });
    const folder = Object.assign(new TFolder(), {
      path: 'assets/note',
      parent: Object.assign(new TFolder(), {
        path: 'assets',
        children: [],
        parent: null
      }),
      children: [orphan]
    });
    (orphan as TFile & { parent: TFolder | null }).parent = folder;
    (folder.parent as TFolder).children = [folder];

    const folders = new Map<string, TFolder>([
      [folder.path, folder],
      [(folder.parent as TFolder).path, folder.parent as TFolder]
    ]);
    const app = {
      vault: {
        getFiles: vi.fn(() => [orphan]),
        getAbstractFileByPath: vi.fn((path: string) => folders.get(path) ?? null),
        delete: vi.fn(async (target: TFile | TFolder) => {
          if (target instanceof TFile) {
            const parent = target.parent;
            if (parent instanceof TFolder) {
              parent.children = parent.children.filter((child) => child !== target);
            }
            return;
          }

          folders.delete(target.path);
          const parent = target.parent;
          if (parent instanceof TFolder) {
            parent.children = parent.children.filter((child) => child !== target);
          }
        })
      },
      metadataCache: {
        resolvedLinks: {}
      },
      fileManager: {
        trashFile: vi.fn(async (target: TFile | TFolder) => {
          if (target instanceof TFile) {
            const parent = target.parent;
            if (parent instanceof TFolder) {
              parent.children = parent.children.filter((child) => child !== target);
            }
            return;
          }

          folders.delete(target.path);
          const parent = target.parent;
          if (parent instanceof TFolder) {
            parent.children = parent.children.filter((child) => child !== target);
          }
        })
      }
    };
    const recoveryManager = {
      captureBinarySnapshot: vi.fn(async () => undefined),
      recordDeletedFolder: vi.fn()
    };
    const manager = new FileManager(
      app as never,
      () => ({
        ...settings,
        deleteOrphanImages: true,
        deleteEmptyFolders: true
      }),
      new VariableResolver(),
      {} as never
    );
    manager.setRecoveryManager(recoveryManager as never);

    const result = await manager.deleteOrphanImagesInFolder(folder);

    expect(result).toEqual({ deletedImages: 1, deletedFolders: 2, relocatedImages: 0, preservedImages: 0 });
    expect(recoveryManager.captureBinarySnapshot).toHaveBeenCalledWith(orphan);
    expect(recoveryManager.recordDeletedFolder).toHaveBeenCalledWith('assets/note');
    expect(recoveryManager.recordDeletedFolder).toHaveBeenCalledWith('assets');
  });

  it('moves images referenced by one external note into that note folder instead of deleting them', async () => {
    const currentNote = Object.assign(new TFile(), {
      path: 'notes/source.md',
      name: 'source.md',
      basename: 'source',
      extension: 'md'
    });
    const referencedNote = Object.assign(new TFile(), {
      path: 'archive/keep.md',
      name: 'keep.md',
      basename: 'keep',
      extension: 'md'
    });
    const image = Object.assign(new TFile(), {
      path: 'notes/attachments/source/orphan.png',
      name: 'orphan.png',
      basename: 'orphan',
      extension: 'png'
    });
    const notesFolder = Object.assign(new TFolder(), {
      path: 'notes',
      children: [currentNote]
    });
    const currentCleanupParent = Object.assign(new TFolder(), {
      path: 'notes/attachments',
      parent: notesFolder,
      children: []
    });
    const currentCleanupFolder = Object.assign(new TFolder(), {
      path: 'notes/attachments/source',
      parent: currentCleanupParent,
      children: [image]
    });
    const archiveFolder = Object.assign(new TFolder(), {
      path: 'archive',
      children: [referencedNote]
    });
    (currentNote as TFile & { parent: TFolder | null }).parent = notesFolder;
    (referencedNote as TFile & { parent: TFolder | null }).parent = archiveFolder;
    (image as TFile & { parent: TFolder | null }).parent = currentCleanupFolder;
    currentCleanupParent.children = [currentCleanupFolder];
    notesFolder.children = [currentNote, currentCleanupParent];

    const folders = new Map<string, TFolder>([
      [notesFolder.path, notesFolder],
      [currentCleanupParent.path, currentCleanupParent],
      [currentCleanupFolder.path, currentCleanupFolder],
      [archiveFolder.path, archiveFolder]
    ]);
    const app = {
      vault: {
        read: vi.fn(async (file: TFile) => (file.path === referencedNote.path ? '![Keep](/notes/attachments/source/orphan.png)' : '')),
        modify: vi.fn(async () => undefined),
        getFiles: vi.fn(() => [currentNote, referencedNote, image]),
        getAbstractFileByPath: vi.fn((path: string) => {
          if (path === currentNote.path) {
            return currentNote;
          }
          if (path === referencedNote.path) {
            return referencedNote;
          }
          return folders.get(path) ?? null;
        }),
        createFolder: vi.fn(async (path: string) => {
          const parentPath = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';
          const parent = parentPath ? folders.get(parentPath) ?? null : null;
          const folder = Object.assign(new TFolder(), {
            path,
            parent,
            children: []
          });
          if (parent) {
            parent.children = [...parent.children, folder];
          }
          folders.set(path, folder);
          return folder;
        })
      },
      metadataCache: {
        getFirstLinkpathDest: vi.fn((target: string) => {
          if (target === '/notes/attachments/source/orphan.png' || target === 'notes/attachments/source/orphan.png') {
            return image;
          }
          if (target === '/archive/attachments/keep/orphan.png' || target === 'archive/attachments/keep/orphan.png') {
            return image;
          }
          return null;
        }),
        resolvedLinks: {
          [referencedNote.path]: {
            [image.path]: 1
          }
        }
      },
      fileManager: {
        renameFile: vi.fn(async (file: TFile, targetPath: string) => {
          const oldParent = file.parent;
          if (oldParent instanceof TFolder) {
            oldParent.children = oldParent.children.filter((child) => child !== file);
          }
          const parentPath = targetPath.slice(0, targetPath.lastIndexOf('/'));
          const nextParent = folders.get(parentPath) ?? null;
          if (nextParent) {
            nextParent.children = [...nextParent.children, file];
          }
          (file as TFile & { parent: TFolder | null }).parent = nextParent;
          file.path = targetPath;
          file.name = targetPath.split('/').pop() ?? targetPath;
        })
      }
    };
    const recoveryManager = {
      captureBinarySnapshot: vi.fn(async () => undefined),
      captureTextSnapshot: vi.fn(async () => undefined),
      recordRename: vi.fn(),
      recordCreatedFolder: vi.fn()
    };
    const manager = new FileManager(
      app as never,
      () => ({
        ...settings,
        outputFolder: './attachments/${noteFileName}',
        deleteEmptyFolders: false
      }),
      new VariableResolver(),
      new LinkFormatter(app as never)
    );
    manager.setRecoveryManager(recoveryManager as never);

    const result = await manager.deleteOrphanImagesForNote(currentNote);

    expect(result).toEqual({ deletedImages: 0, deletedFolders: 0, relocatedImages: 1, preservedImages: 0 });
    expect(app.fileManager.renameFile).toHaveBeenCalledWith(image, 'archive/attachments/keep/orphan.png');
    expect(app.vault.modify).toHaveBeenCalledWith(referencedNote, '![Keep](/archive/attachments/keep/orphan.png)');
    expect(recoveryManager.recordRename).toHaveBeenCalledWith(
      'notes/attachments/source/orphan.png',
      'archive/attachments/keep/orphan.png'
    );
  });

  it('keeps images referenced by notes inside the allowed scope during link rewrite cleanup', async () => {
    const noteA = Object.assign(new TFile(), {
      path: 'notes/a.md',
      name: 'a.md',
      basename: 'a',
      extension: 'md'
    });
    const noteB = Object.assign(new TFile(), {
      path: 'notes/b.md',
      name: 'b.md',
      basename: 'b',
      extension: 'md'
    });
    const image = Object.assign(new TFile(), {
      path: 'notes/shared.png',
      name: 'shared.png',
      basename: 'shared',
      extension: 'png'
    });
    const folder = Object.assign(new TFolder(), {
      path: 'notes',
      children: [noteA, noteB, image]
    });
    (noteA as TFile & { parent: TFolder | null }).parent = folder;
    (noteB as TFile & { parent: TFolder | null }).parent = folder;
    (image as TFile & { parent: TFolder | null }).parent = folder;

    const app = {
      vault: {
        read: vi.fn(async () => ''),
        modify: vi.fn(async () => undefined),
        getFiles: vi.fn(() => [noteA, noteB, image]),
        getAbstractFileByPath: vi.fn((path: string) => {
          if (path === folder.path) {
            return folder;
          }
          return null;
        }),
        delete: vi.fn(async () => undefined)
      },
      metadataCache: {
        getFirstLinkpathDest: vi.fn(() => null),
        resolvedLinks: {
          [noteB.path]: {
            [image.path]: 1
          }
        }
      },
      fileManager: {
        renameFile: vi.fn(async () => undefined)
      }
    };
    const manager = new FileManager(
      app as never,
      () => ({
        ...settings,
        deleteOrphanImages: true
      }),
      new VariableResolver(),
      new LinkFormatter(app as never)
    );

    const result = await manager.rewriteImageLinksInNote(noteA, new Set([noteA.path, noteB.path]));

    expect(result).toEqual({ replaced: 0, moved: 0, downloaded: 0, deleted: 0, foldersDeleted: 0 });
    expect(app.fileManager.renameFile).not.toHaveBeenCalled();
    expect(app.vault.delete).not.toHaveBeenCalled();
  });

  it('keeps images referenced by multiple external notes during folder cleanup', async () => {
    const image = Object.assign(new TFile(), {
      path: 'assets/note/shared.png',
      name: 'shared.png',
      basename: 'shared',
      extension: 'png'
    });
    const folder = Object.assign(new TFolder(), {
      path: 'assets/note',
      children: [image]
    });
    const noteA = Object.assign(new TFile(), {
      path: 'notes/a.md',
      name: 'a.md',
      basename: 'a',
      extension: 'md'
    });
    const noteB = Object.assign(new TFile(), {
      path: 'notes/b.md',
      name: 'b.md',
      basename: 'b',
      extension: 'md'
    });
    (image as TFile & { parent: TFolder | null }).parent = folder;

    const app = {
      vault: {
        getFiles: vi.fn(() => [image, noteA, noteB]),
        getAbstractFileByPath: vi.fn(() => null),
        delete: vi.fn(async () => undefined)
      },
      metadataCache: {
        resolvedLinks: {
          [noteA.path]: {
            [image.path]: 1
          },
          [noteB.path]: {
            [image.path]: 1
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
      {} as never
    );

    const result = await manager.deleteOrphanImagesInFolder(folder);

    expect(result).toEqual({ deletedImages: 0, deletedFolders: 0, relocatedImages: 0, preservedImages: 1 });
    expect(app.fileManager.renameFile).not.toHaveBeenCalled();
    expect(app.vault.delete).not.toHaveBeenCalled();
  });

  it('does not fall back to the note folder when a custom output folder is configured but missing', async () => {
    const note = Object.assign(new TFile(), {
      path: 'notes/test.md',
      name: 'test.md',
      basename: 'test',
      extension: 'md',
      parent: Object.assign(new TFolder(), {
        path: 'notes',
        children: []
      })
    });
    const manager = new FileManager(
      {
        vault: {
          getAbstractFileByPath: vi.fn(() => null)
        }
      } as never,
      () => ({
        ...settings,
        outputFolder: 'attachments/${noteFileName}'
      }),
      new VariableResolver(),
      {} as never
    );

    const result = await manager.deleteOrphanImagesForNote(note);

    expect(result).toEqual({ deletedImages: 0, deletedFolders: 0, relocatedImages: 0, preservedImages: 0 });
  });

  it.each([
    ['follow current note', '', null],
    ['fixed attachment folder', 'Attachments/Images', null],
    ['sibling assets folder', './assets', null],
    [
      'folder per note',
      './assets/${noteFileName}',
      {
        notePath: 'notes/a.md',
        noteName: 'a',
        managedFolderPath: 'notes/assets/a',
        preservePath: 'notes'
      }
    ]
  ])('resolves deleted-note cleanup safely for the %s output-folder example', (_label, outputFolder, expected) => {
    const manager = new FileManager(
      {
        vault: {
          getAbstractFileByPath: vi.fn(() => null)
        }
      } as never,
      () => ({
        ...settings,
        outputFolder,
        deleteOrphanImages: true,
        deleteEmptyFolders: true
      }),
      new VariableResolver(),
      {} as never
    );

    expect(manager.getDeletedNoteManagedCleanupTarget('notes/a.md')).toEqual(expected);
  });

  it('does not create a deleted-note cleanup target when both cleanup toggles are disabled', () => {
    const manager = new FileManager(
      {
        vault: {
          getAbstractFileByPath: vi.fn(() => null)
        }
      } as never,
      () => ({
        ...settings,
        outputFolder: './assets/${noteFileName}',
        deleteOrphanImages: false,
        deleteEmptyFolders: false
      }),
      new VariableResolver(),
      {} as never
    );

    expect(manager.getDeletedNoteManagedCleanupTarget('notes/a.md')).toBeNull();
  });

  it('removes an empty note scoped managed folder when rewriting image links', async () => {
    const note = Object.assign(new TFile(), {
      path: 'notes/a.md',
      name: 'a.md',
      basename: 'a',
      extension: 'md'
    });
    const notesFolder = Object.assign(new TFolder(), {
      path: 'notes',
      children: [note]
    });
    const assetsFolder = Object.assign(new TFolder(), {
      path: 'notes/assets',
      parent: notesFolder,
      children: []
    });
    const managedFolder = Object.assign(new TFolder(), {
      path: 'notes/assets/a',
      parent: assetsFolder,
      children: []
    });
    (note as TFile & { parent: TFolder | null }).parent = notesFolder;
    assetsFolder.children = [managedFolder];
    notesFolder.children = [note, assetsFolder];

    const folders = new Map<string, TFolder>([
      [notesFolder.path, notesFolder],
      [assetsFolder.path, assetsFolder],
      [managedFolder.path, managedFolder]
    ]);
    const app = {
      vault: {
        adapter: {
          list: vi.fn(async () => ({ files: [], folders: [] }))
        },
        read: vi.fn(async () => ''),
        modify: vi.fn(async () => undefined),
        getFiles: vi.fn(() => [note]),
        getAbstractFileByPath: vi.fn((path: string) => folders.get(path) ?? (path === note.path ? note : null))
      },
      metadataCache: {
        getFirstLinkpathDest: vi.fn(() => null),
        resolvedLinks: {}
      },
      fileManager: {
        renameFile: vi.fn(async () => undefined),
        trashFile: vi.fn(async (target: TFolder) => {
          folders.delete(target.path);
          const parent = target.parent;
          if (parent instanceof TFolder) {
            parent.children = parent.children.filter((child) => child !== target);
          }
        })
      }
    };
    const manager = new FileManager(
      app as never,
      () => ({
        ...settings,
        outputFolder: './assets/${noteFileName}',
        deleteOrphanImages: false,
        deleteEmptyFolders: true
      }),
      new VariableResolver(),
      new LinkFormatter(app as never)
    );

    const result = await manager.rewriteImageLinksInNote(note);

    expect(result).toEqual({ replaced: 0, moved: 0, downloaded: 0, deleted: 0, foldersDeleted: 2 });
    expect(app.fileManager.trashFile).toHaveBeenCalledWith(managedFolder);
    expect(app.fileManager.trashFile).toHaveBeenCalledWith(assetsFolder);
  });

  it('removes an empty note scoped managed folder during current note orphan cleanup', async () => {
    const note = Object.assign(new TFile(), {
      path: 'notes/a.md',
      name: 'a.md',
      basename: 'a',
      extension: 'md'
    });
    const notesFolder = Object.assign(new TFolder(), {
      path: 'notes',
      children: [note]
    });
    const assetsFolder = Object.assign(new TFolder(), {
      path: 'notes/assets',
      parent: notesFolder,
      children: []
    });
    const managedFolder = Object.assign(new TFolder(), {
      path: 'notes/assets/a',
      parent: assetsFolder,
      children: []
    });
    (note as TFile & { parent: TFolder | null }).parent = notesFolder;
    assetsFolder.children = [managedFolder];
    notesFolder.children = [note, assetsFolder];

    const folders = new Map<string, TFolder>([
      [notesFolder.path, notesFolder],
      [assetsFolder.path, assetsFolder],
      [managedFolder.path, managedFolder]
    ]);
    const app = {
      vault: {
        adapter: {
          list: vi.fn(async () => ({ files: [], folders: [] }))
        },
        getFiles: vi.fn(() => [note]),
        getAbstractFileByPath: vi.fn((path: string) => folders.get(path) ?? (path === note.path ? note : null))
      },
      metadataCache: {
        resolvedLinks: {}
      },
      fileManager: {
        trashFile: vi.fn(async (target: TFolder) => {
          folders.delete(target.path);
          const parent = target.parent;
          if (parent instanceof TFolder) {
            parent.children = parent.children.filter((child) => child !== target);
          }
        })
      }
    };
    const manager = new FileManager(
      app as never,
      () => ({
        ...settings,
        outputFolder: './assets/${noteFileName}',
        deleteOrphanImages: true,
        deleteEmptyFolders: true
      }),
      new VariableResolver(),
      {} as never
    );

    const result = await manager.deleteOrphanImagesForNote(note);

    expect(result).toEqual({ deletedImages: 0, deletedFolders: 2, relocatedImages: 0, preservedImages: 0 });
    expect(app.fileManager.trashFile).toHaveBeenCalledWith(managedFolder);
    expect(app.fileManager.trashFile).toHaveBeenCalledWith(assetsFolder);
  });

  it('cleans a deleted note scoped managed image folder while ignoring stale deleted note references', async () => {
    const note = Object.assign(new TFile(), {
      path: 'notes/a.md',
      name: 'a.md',
      basename: 'a',
      extension: 'md'
    });
    const firstImage = Object.assign(new TFile(), {
      path: 'notes/assets/a/one.png',
      name: 'one.png',
      basename: 'one',
      extension: 'png'
    });
    const secondImage = Object.assign(new TFile(), {
      path: 'notes/assets/a/two.webp',
      name: 'two.webp',
      basename: 'two',
      extension: 'webp'
    });
    const notesFolder = Object.assign(new TFolder(), {
      path: 'notes',
      children: []
    });
    const assetsFolder = Object.assign(new TFolder(), {
      path: 'notes/assets',
      parent: notesFolder,
      children: []
    });
    const managedFolder = Object.assign(new TFolder(), {
      path: 'notes/assets/a',
      parent: assetsFolder,
      children: [firstImage, secondImage]
    });
    (firstImage as TFile & { parent: TFolder | null }).parent = managedFolder;
    (secondImage as TFile & { parent: TFolder | null }).parent = managedFolder;
    assetsFolder.children = [managedFolder];
    notesFolder.children = [assetsFolder];

    const folders = new Map<string, TFolder>([
      [notesFolder.path, notesFolder],
      [assetsFolder.path, assetsFolder],
      [managedFolder.path, managedFolder]
    ]);
    const app = {
      vault: {
        getFiles: vi.fn(() => [firstImage, secondImage]),
        getAbstractFileByPath: vi.fn((path: string) => {
          if (path === firstImage.path) {
            return firstImage;
          }
          if (path === secondImage.path) {
            return secondImage;
          }
          return folders.get(path) ?? null;
        })
      },
      metadataCache: {
        resolvedLinks: {
          [note.path]: {
            [firstImage.path]: 1,
            [secondImage.path]: 1
          }
        }
      },
      fileManager: {
        trashFile: vi.fn(async (target: TFile | TFolder) => {
          if (target instanceof TFile) {
            const parent = target.parent;
            if (parent instanceof TFolder) {
              parent.children = parent.children.filter((child) => child !== target);
            }
            return;
          }

          folders.delete(target.path);
          const parent = target.parent;
          if (parent instanceof TFolder) {
            parent.children = parent.children.filter((child) => child !== target);
          }
        })
      }
    };
    const manager = new FileManager(
      app as never,
      () => ({
        ...settings,
        enableNoteRenameSync: false,
        outputFolder: './assets/${noteFileName}',
        deleteOrphanImages: true,
        deleteEmptyFolders: true
      }),
      new VariableResolver(),
      {} as never
    );

    const result = await manager.cleanupManagedImagesForDeletedNote(note);

    expect(result).toEqual({ deletedImages: 2, deletedFolders: 2, relocatedImages: 0, preservedImages: 0 });
    expect(app.fileManager.trashFile).toHaveBeenCalledWith(firstImage);
    expect(app.fileManager.trashFile).toHaveBeenCalledWith(secondImage);
    expect(app.fileManager.trashFile).toHaveBeenCalledWith(managedFolder);
    expect(app.fileManager.trashFile).toHaveBeenCalledWith(assetsFolder);
    expect(folders.has(managedFolder.path)).toBe(false);
    expect(folders.has(assetsFolder.path)).toBe(false);
    expect(folders.has(notesFolder.path)).toBe(true);
  });

  it('deletes stale empty folders when Obsidian has not refreshed folder children yet', async () => {
    const note = Object.assign(new TFile(), {
      path: 'notes/a.md',
      name: 'a.md',
      basename: 'a',
      extension: 'md'
    });
    const image = Object.assign(new TFile(), {
      path: 'notes/assets/a/one.png',
      name: 'one.png',
      basename: 'one',
      extension: 'png'
    });
    const notesFolder = Object.assign(new TFolder(), {
      path: 'notes',
      children: []
    });
    const assetsFolder = Object.assign(new TFolder(), {
      path: 'notes/assets',
      parent: notesFolder,
      children: []
    });
    const managedFolder = Object.assign(new TFolder(), {
      path: 'notes/assets/a',
      parent: assetsFolder,
      children: [image]
    });
    (image as TFile & { parent: TFolder | null }).parent = managedFolder;
    assetsFolder.children = [managedFolder];
    notesFolder.children = [assetsFolder];

    const folders = new Map<string, TFolder>([
      [notesFolder.path, notesFolder],
      [assetsFolder.path, assetsFolder],
      [managedFolder.path, managedFolder]
    ]);
    const liveFiles = new Map<string, TFile>([[image.path, image]]);
    const app = {
      vault: {
        adapter: {
          list: vi.fn(async (path: string) => {
            if (path === managedFolder.path) {
              return {
                files: liveFiles.has(image.path) ? [image.path] : [],
                folders: []
              };
            }
            return {
              files: [],
              folders: folders.has(managedFolder.path) ? [managedFolder.path] : []
            };
          })
        },
        getFiles: vi.fn(() => [...liveFiles.values()]),
        getAbstractFileByPath: vi.fn((path: string) => folders.get(path) ?? liveFiles.get(path) ?? null)
      },
      metadataCache: {
        resolvedLinks: {
          [note.path]: {
            [image.path]: 1
          }
        }
      },
      fileManager: {
        trashFile: vi.fn(async (target: TFile | TFolder) => {
          if (target instanceof TFile) {
            liveFiles.delete(target.path);
            return;
          }

          folders.delete(target.path);
        })
      }
    };
    const manager = new FileManager(
      app as never,
      () => ({
        ...settings,
        enableNoteRenameSync: false,
        outputFolder: './assets/${noteFileName}',
        deleteOrphanImages: true,
        deleteEmptyFolders: true
      }),
      new VariableResolver(),
      {} as never
    );

    const result = await manager.cleanupManagedImagesForDeletedNote(note);

    expect(result).toEqual({ deletedImages: 1, deletedFolders: 2, relocatedImages: 0, preservedImages: 0 });
    expect(managedFolder.children).toEqual([image]);
    expect(assetsFolder.children).toEqual([managedFolder]);
    expect(app.fileManager.trashFile).toHaveBeenCalledWith(managedFolder);
    expect(app.fileManager.trashFile).toHaveBeenCalledWith(assetsFolder);
  });

  it('skips trashing stale image objects that no longer exist on disk', async () => {
    const note = Object.assign(new TFile(), {
      path: 'notes/a.md',
      name: 'a.md',
      basename: 'a',
      extension: 'md'
    });
    const image = Object.assign(new TFile(), {
      path: 'notes/assets/a/missing.png',
      name: 'missing.png',
      basename: 'missing',
      extension: 'png'
    });
    const notesFolder = Object.assign(new TFolder(), {
      path: 'notes',
      children: []
    });
    const assetsFolder = Object.assign(new TFolder(), {
      path: 'notes/assets',
      parent: notesFolder,
      children: []
    });
    const managedFolder = Object.assign(new TFolder(), {
      path: 'notes/assets/a',
      parent: assetsFolder,
      children: [image]
    });
    (image as TFile & { parent: TFolder | null }).parent = managedFolder;
    assetsFolder.children = [managedFolder];
    notesFolder.children = [assetsFolder];

    const folders = new Map<string, TFolder>([
      [notesFolder.path, notesFolder],
      [assetsFolder.path, assetsFolder],
      [managedFolder.path, managedFolder]
    ]);
    const app = {
      vault: {
        adapter: {
          exists: vi.fn(async (path: string) => path !== image.path),
          list: vi.fn(async () => ({ files: [], folders: [] }))
        },
        getFiles: vi.fn(() => [image]),
        getAbstractFileByPath: vi.fn((path: string) => folders.get(path) ?? (path === image.path ? image : null))
      },
      metadataCache: {
        resolvedLinks: {
          [note.path]: {
            [image.path]: 1
          }
        }
      },
      fileManager: {
        trashFile: vi.fn(async (target: TFile | TFolder) => {
          if (target instanceof TFile) {
            throw new Error('stale images should not be trashed');
          }

          folders.delete(target.path);
          const parent = target.parent;
          if (parent instanceof TFolder) {
            parent.children = parent.children.filter((child) => child !== target);
          }
        })
      }
    };
    const manager = new FileManager(
      app as never,
      () => ({
        ...settings,
        outputFolder: './assets/${noteFileName}',
        deleteOrphanImages: true,
        deleteEmptyFolders: true
      }),
      new VariableResolver(),
      {} as never
    );

    const result = await manager.cleanupManagedImagesForDeletedNote(note);

    expect(result).toEqual({ deletedImages: 0, deletedFolders: 2, relocatedImages: 0, preservedImages: 0 });
    expect(app.fileManager.trashFile).not.toHaveBeenCalledWith(image);
    expect(app.fileManager.trashFile).toHaveBeenCalledWith(managedFolder);
    expect(app.fileManager.trashFile).toHaveBeenCalledWith(assetsFolder);
  });

  it('continues deleted note cleanup when binary snapshot capture hits ENOENT', async () => {
    const note = Object.assign(new TFile(), {
      path: 'notes/a.md',
      name: 'a.md',
      basename: 'a',
      extension: 'md'
    });
    const image = Object.assign(new TFile(), {
      path: 'notes/assets/a/raced.png',
      name: 'raced.png',
      basename: 'raced',
      extension: 'png'
    });
    const notesFolder = Object.assign(new TFolder(), {
      path: 'notes',
      children: []
    });
    const assetsFolder = Object.assign(new TFolder(), {
      path: 'notes/assets',
      parent: notesFolder,
      children: []
    });
    const managedFolder = Object.assign(new TFolder(), {
      path: 'notes/assets/a',
      parent: assetsFolder,
      children: [image]
    });
    (image as TFile & { parent: TFolder | null }).parent = managedFolder;
    assetsFolder.children = [managedFolder];
    notesFolder.children = [assetsFolder];

    const folders = new Map<string, TFolder>([
      [notesFolder.path, notesFolder],
      [assetsFolder.path, assetsFolder],
      [managedFolder.path, managedFolder]
    ]);
    const app = {
      vault: {
        adapter: {
          exists: vi.fn(async () => true),
          list: vi.fn(async () => ({ files: [], folders: [] }))
        },
        getFiles: vi.fn(() => [image]),
        getAbstractFileByPath: vi.fn((path: string) => folders.get(path) ?? (path === image.path ? image : null))
      },
      metadataCache: {
        resolvedLinks: {
          [note.path]: {
            [image.path]: 1
          }
        }
      },
      fileManager: {
        trashFile: vi.fn(async (target: TFile | TFolder) => {
          if (target instanceof TFile) {
            throw new Error('stale images should not be trashed after ENOENT snapshot');
          }

          folders.delete(target.path);
        })
      }
    };
    const recoveryManager = {
      captureBinarySnapshot: vi.fn(async () => {
        const error = new Error(`ENOENT: no such file or directory, open '${image.path}'`);
        (error as Error & { code: string }).code = 'ENOENT';
        throw error;
      }),
      recordDeletedFolder: vi.fn()
    };
    const manager = new FileManager(
      app as never,
      () => ({
        ...settings,
        outputFolder: './assets/${noteFileName}',
        deleteOrphanImages: true,
        deleteEmptyFolders: true
      }),
      new VariableResolver(),
      {} as never
    );
    manager.setRecoveryManager(recoveryManager as never);

    const result = await manager.cleanupManagedImagesForDeletedNote(note);

    expect(result).toEqual({ deletedImages: 0, deletedFolders: 2, relocatedImages: 0, preservedImages: 0 });
    expect(app.fileManager.trashFile).not.toHaveBeenCalledWith(image);
    expect(app.fileManager.trashFile).toHaveBeenCalledWith(managedFolder);
    expect(app.fileManager.trashFile).toHaveBeenCalledWith(assetsFolder);
  });

  it('deletes an empty deleted note scoped managed folder even when orphan image cleanup is disabled', async () => {
    const note = Object.assign(new TFile(), {
      path: 'notes/a.md',
      name: 'a.md',
      basename: 'a',
      extension: 'md'
    });
    const notesFolder = Object.assign(new TFolder(), {
      path: 'notes',
      children: []
    });
    const assetsFolder = Object.assign(new TFolder(), {
      path: 'notes/assets',
      parent: notesFolder,
      children: []
    });
    const managedFolder = Object.assign(new TFolder(), {
      path: 'notes/assets/a',
      parent: assetsFolder,
      children: []
    });
    assetsFolder.children = [managedFolder];
    notesFolder.children = [assetsFolder];

    const folders = new Map<string, TFolder>([
      [notesFolder.path, notesFolder],
      [assetsFolder.path, assetsFolder],
      [managedFolder.path, managedFolder]
    ]);
    const app = {
      vault: {
        getFiles: vi.fn(() => []),
        getAbstractFileByPath: vi.fn((path: string) => folders.get(path) ?? null)
      },
      metadataCache: {
        resolvedLinks: {}
      },
      fileManager: {
        trashFile: vi.fn(async (target: TFolder) => {
          folders.delete(target.path);
          const parent = target.parent;
          if (parent instanceof TFolder) {
            parent.children = parent.children.filter((child) => child !== target);
          }
        })
      }
    };
    const manager = new FileManager(
      app as never,
      () => ({
        ...settings,
        enableNoteRenameSync: false,
        outputFolder: './assets/${noteFileName}',
        deleteOrphanImages: false,
        deleteEmptyFolders: true
      }),
      new VariableResolver(),
      {} as never
    );

    const result = await manager.cleanupManagedImagesForDeletedNote(note);

    expect(result).toEqual({ deletedImages: 0, deletedFolders: 2, relocatedImages: 0, preservedImages: 0 });
    expect(app.fileManager.trashFile).toHaveBeenCalledWith(managedFolder);
    expect(app.fileManager.trashFile).toHaveBeenCalledWith(assetsFolder);
  });

  it('does not scan shared relative folders when cleaning up a deleted note', async () => {
    const note = Object.assign(new TFile(), {
      path: 'notes/a.md',
      name: 'a.md',
      basename: 'a',
      extension: 'md'
    });
    const sharedFolder = Object.assign(new TFolder(), {
      path: 'notes/assets',
      children: []
    });
    const app = {
      vault: {
        getFiles: vi.fn(() => []),
        getAbstractFileByPath: vi.fn((path: string) => (path === sharedFolder.path ? sharedFolder : null))
      },
      metadataCache: {
        resolvedLinks: {}
      },
      fileManager: {
        trashFile: vi.fn(async () => undefined)
      }
    };
    const manager = new FileManager(
      app as never,
      () => ({
        ...settings,
        enableNoteRenameSync: false,
        outputFolder: './assets',
        deleteOrphanImages: true,
        deleteEmptyFolders: true
      }),
      new VariableResolver(),
      {} as never
    );

    const result = await manager.cleanupManagedImagesForDeletedNote(note);

    expect(result).toEqual({ deletedImages: 0, deletedFolders: 0, relocatedImages: 0, preservedImages: 0 });
    expect(app.fileManager.trashFile).not.toHaveBeenCalled();
  });
});
