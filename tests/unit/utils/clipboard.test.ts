import { TFile } from 'obsidian';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ImageFormat } from '@/types/index';
import * as compatibility from '@/utils/compatibility';
import { writeImageFileToClipboard } from '@/utils/clipboard';

class ClipboardItemMock {
  static supports = vi.fn<(type: string) => boolean>();

  constructor(readonly items: Record<string, Blob>) {}
}

describe('writeImageFileToClipboard', () => {
  beforeEach(() => {
    vi.spyOn(compatibility, 'canWriteImageToClipboard').mockReturnValue(true);
    vi.stubGlobal('ClipboardItem', ClipboardItemMock as unknown as typeof ClipboardItem);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('falls back to PNG when the source MIME type is not supported by ClipboardItem', async () => {
    ClipboardItemMock.supports.mockImplementation((type) => type === 'image/png');
    const writeMock = vi.fn(async () => undefined);
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: { write: writeMock },
      configurable: true
    });
    const file = Object.assign(new TFile(), {
      path: 'assets/photo.webp',
      name: 'photo.webp',
      extension: 'webp'
    });
    const pngBuffer = Uint8Array.from([1, 2, 3]).buffer;
    const app = {
      vault: {
        readBinary: vi.fn(async () => Uint8Array.from([9, 9, 9]).buffer)
      }
    };
    const imageProcessor = {
      convert: vi.fn(async () => pngBuffer)
    };

    const mimeType = await writeImageFileToClipboard(app as never, imageProcessor, file);

    expect(mimeType).toBe('image/png');
    expect(app.vault.readBinary).not.toHaveBeenCalled();
    expect(imageProcessor.convert).toHaveBeenCalledWith(file, ImageFormat.PNG);
    expect(writeMock).toHaveBeenCalledTimes(1);
    const [items] = writeMock.mock.calls[0] as [ClipboardItemMock[]];
    expect(Object.keys(items[0].items)).toEqual(['image/png']);
  });

  it('retries with PNG when writing the source MIME type fails at runtime', async () => {
    ClipboardItemMock.supports.mockImplementation((type) => type === 'image/webp' || type === 'image/png');
    const writeMock = vi.fn(async (items: ClipboardItemMock[]) => {
      const mimeType = Object.keys(items[0].items)[0];
      if (mimeType === 'image/webp') {
        throw new DOMException('Type image/webp not supported on write.', 'NotAllowedError');
      }
    });
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: { write: writeMock },
      configurable: true
    });
    const sourceBuffer = Uint8Array.from([4, 5, 6]).buffer;
    const pngBuffer = Uint8Array.from([7, 8, 9]).buffer;
    const file = Object.assign(new TFile(), {
      path: 'assets/photo.webp',
      name: 'photo.webp',
      extension: 'webp'
    });
    const app = {
      vault: {
        readBinary: vi.fn(async () => sourceBuffer)
      }
    };
    const imageProcessor = {
      convert: vi.fn(async () => pngBuffer)
    };

    const mimeType = await writeImageFileToClipboard(app as never, imageProcessor, file);

    expect(mimeType).toBe('image/png');
    expect(app.vault.readBinary).toHaveBeenCalledWith(file);
    expect(imageProcessor.convert).toHaveBeenCalledWith(file, ImageFormat.PNG);
    expect(writeMock).toHaveBeenCalledTimes(2);
    const firstMimeType = Object.keys((writeMock.mock.calls[0] as [ClipboardItemMock[]])[0][0].items)[0];
    const secondMimeType = Object.keys((writeMock.mock.calls[1] as [ClipboardItemMock[]])[0][0].items)[0];
    expect(firstMimeType).toBe('image/webp');
    expect(secondMimeType).toBe('image/png');
  });

  it('keeps the original MIME type when ClipboardItem supports it', async () => {
    ClipboardItemMock.supports.mockImplementation((type) => type === 'image/jpeg');
    const writeMock = vi.fn(async () => undefined);
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: { write: writeMock },
      configurable: true
    });
    const sourceBuffer = Uint8Array.from([1, 1, 1]).buffer;
    const file = Object.assign(new TFile(), {
      path: 'assets/photo.jpg',
      name: 'photo.jpg',
      extension: 'jpg'
    });
    const app = {
      vault: {
        readBinary: vi.fn(async () => sourceBuffer)
      }
    };
    const imageProcessor = {
      convert: vi.fn(async () => Uint8Array.from([2, 2, 2]).buffer)
    };

    const mimeType = await writeImageFileToClipboard(app as never, imageProcessor, file);

    expect(mimeType).toBe('image/jpeg');
    expect(app.vault.readBinary).toHaveBeenCalledWith(file);
    expect(imageProcessor.convert).not.toHaveBeenCalled();
    expect(writeMock).toHaveBeenCalledTimes(1);
    const [items] = writeMock.mock.calls[0] as [ClipboardItemMock[]];
    expect(Object.keys(items[0].items)).toEqual(['image/jpeg']);
  });
});
