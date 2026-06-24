import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConvertFeature } from '@/features/convert/convert-feature';
import { ImageFormat } from '@/types/index';

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
  TFile: class {},
  Modal: class {}
}));

describe('ConvertFeature', () => {
  beforeEach(() => {
    noticeMock.mockClear();
  });

  it('replaces the active file and retargets it when converting to a different format', async () => {
    const converted = new ArrayBuffer(8);
    const replaceFile = vi.fn(async (file, _data, targetPath) => {
      file.path = targetPath;
      return file;
    });
    const feature = new ConvertFeature();
    const file = { path: 'assets/photo.png', extension: 'png' };
    const context = {
      app: {
        vault: {
          getAbstractFileByPath: vi.fn(() => null)
        }
      },
      services: {
        logger: {
          debug: vi.fn()
        } as never,
        imageProcessor: {
          convert: vi.fn(async () => converted)
        },
        fileManager: {
          replaceFile
        },
        settings: {
          getSettings: vi.fn(() => ({
            defaultFormat: ImageFormat.WEBP,
            showOperationNotifications: true,
            conversionIgnorePattern: ''
          }))
        }
      }
    };

    const result = await feature.convertImage(context as never, file as never, ImageFormat.WEBP);

    expect(context.services.imageProcessor.convert).toHaveBeenCalledWith(file, ImageFormat.WEBP);
    expect(replaceFile).toHaveBeenCalledWith(file, converted, 'assets/photo.webp');
    expect(result).toBe(file);
    expect(file.path).toBe('assets/photo.webp');
  });

  it('converts every image referenced by the active note', async () => {
    const feature = new ConvertFeature();
    const note = { path: 'notes/test.md', name: 'test.md', basename: 'test', extension: 'md' };
    const image = { path: 'assets/photo.png', extension: 'png' };
    const context = {
      services: {
        logger: {
          debug: vi.fn()
        } as never,
        imageProcessor: {
          convert: vi.fn(async () => new ArrayBuffer(8))
        },
        fileManager: {
          getImagesInNote: vi.fn(async () => [image]),
          replaceFile: vi.fn(async (file) => file)
        },
        settings: {
          getSettings: vi.fn(() => ({
            defaultFormat: ImageFormat.WEBP,
            showOperationNotifications: true,
            conversionIgnorePattern: ''
          }))
        }
      },
      app: {
        vault: {
          getAbstractFileByPath: vi.fn(() => null)
        }
      }
    };

    await feature.convertImagesInNote(context as never, note as never, ImageFormat.WEBP);

    expect(context.services.fileManager.getImagesInNote).toHaveBeenCalledWith(note);
    expect(context.services.imageProcessor.convert).toHaveBeenCalledWith(image, ImageFormat.WEBP);
    expect(context.services.fileManager.replaceFile).toHaveBeenCalledWith(image, expect.any(ArrayBuffer), 'assets/photo.webp');
  });

  it('suffixes the target path when another format already converted to the same webp name', async () => {
    const feature = new ConvertFeature();
    const file = { path: 'assets/aaa.jpg', extension: 'jpg' };
    const context = {
      app: {
        vault: {
          getAbstractFileByPath: vi.fn((path: string) => (path === 'assets/aaa.webp' ? { path } : null))
        }
      },
      services: {
        logger: {
          debug: vi.fn()
        } as never,
        imageProcessor: {
          convert: vi.fn(async () => new ArrayBuffer(8))
        },
        fileManager: {
          replaceFile: vi.fn(async (inputFile, _data, targetPath) => ({
            ...inputFile,
            path: targetPath
          }))
        },
        settings: {
          getSettings: vi.fn(() => ({
            defaultFormat: ImageFormat.WEBP,
            showOperationNotifications: true,
            conversionIgnorePattern: ''
          }))
        }
      }
    };

    await feature.convertImage(context as never, file as never, ImageFormat.WEBP);

    expect(context.services.fileManager.replaceFile).toHaveBeenCalledWith(
      file,
      expect.any(ArrayBuffer),
      'assets/aaa-1.webp'
    );
  });

  it('surfaces the ignore pattern when png conversion is skipped', async () => {
    const feature = new ConvertFeature();
    const file = {
      path: 'assets/photo.png',
      name: 'photo.png',
      extension: 'png'
    };
    const context = {
      app: {
        vault: {
          getAbstractFileByPath: vi.fn(() => null)
        }
      },
      services: {
        logger: {
          debug: vi.fn()
        } as never,
        imageProcessor: {
          convert: vi.fn(async () => new ArrayBuffer(8))
        },
        fileManager: {
          replaceFile: vi.fn(async (inputFile) => inputFile)
        },
        settings: {
          getSettings: vi.fn(() => ({
            defaultFormat: ImageFormat.WEBP,
            showOperationNotifications: true,
            conversionIgnorePattern: '\\.png$'
          }))
        }
      }
    };

    const result = await feature.convertImage(context as never, file as never, ImageFormat.WEBP);

    expect(result).toBe(file);
    expect(context.services.imageProcessor.convert).not.toHaveBeenCalled();
    expect(noticeMock).toHaveBeenCalledWith(
      'Skipped conversion for photo.png: matched ignore rule "\\.png$"'
    );
  });
});
