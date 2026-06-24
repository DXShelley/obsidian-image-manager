import { afterEach, describe, expect, it, vi } from 'vitest';
import { ImageProcessor } from '@/services/image-processor';
import { ImageFormat } from '@/types/index';

describe('ImageProcessor', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('encodes png input as webp output during format conversion', async () => {
    const toBlob = vi.fn((callback: BlobCallback, mimeType?: string) => {
      callback(new Blob([new Uint8Array([1, 2, 3])], { type: mimeType }));
    });
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
      if (tagName === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: vi.fn(() => ({
            drawImage: vi.fn()
          })),
          toBlob
        } as unknown as HTMLCanvasElement;
      }

      return originalCreateElement(tagName);
    }) as typeof document.createElement);

    const app = {
      vault: {
        readBinary: vi.fn(async () => new Uint8Array([9, 8, 7]).buffer)
      }
    };
    const processor = new ImageProcessor(app as never, () => ({
      defaultFormat: ImageFormat.WEBP,
      defaultQuality: 80
    }) as never);
    vi.spyOn(
      processor as unknown as {
        assertOutputFormatSupported: (format: ImageFormat) => void;
      },
      'assertOutputFormatSupported'
    ).mockImplementation(() => undefined);
    vi.spyOn(
      processor as unknown as {
        loadImage: (source: ArrayBuffer, extension: string) => Promise<{ width: number; height: number }>;
      },
      'loadImage'
    ).mockResolvedValue({ width: 640, height: 480 });

    const result = await processor.convert({ extension: 'png' } as never, ImageFormat.WEBP);

    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/webp', 0.8);
    expect(result.byteLength).toBe(3);
  });

  it('crops the selected image rectangle into a new canvas output', async () => {
    const drawImage = vi.fn();
    const toBlob = vi.fn((callback: BlobCallback, mimeType?: string) => {
      callback(new Blob([new Uint8Array([5, 4, 3])], { type: mimeType }));
    });
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
      if (tagName === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: vi.fn(() => ({
            drawImage
          })),
          toBlob
        } as unknown as HTMLCanvasElement;
      }

      return originalCreateElement(tagName);
    }) as typeof document.createElement);

    const app = {
      vault: {
        readBinary: vi.fn(async () => new Uint8Array([9, 8, 7]).buffer)
      }
    };
    const processor = new ImageProcessor(app as never, () => ({
      defaultFormat: ImageFormat.PNG,
      defaultQuality: 90
    }) as never);
    vi.spyOn(
      processor as unknown as {
        assertOutputFormatSupported: (format: ImageFormat) => void;
      },
      'assertOutputFormatSupported'
    ).mockImplementation(() => undefined);
    vi.spyOn(
      processor as unknown as {
        loadImage: (source: ArrayBuffer, extension: string) => Promise<{ width: number; height: number }>;
      },
      'loadImage'
    ).mockResolvedValue({ width: 640, height: 480 });

    const result = await processor.crop(
      {
        extension: 'png'
      } as never,
      {
        x: 20,
        y: 30,
        width: 120,
        height: 80
      }
    );

    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 20, 30, 120, 80, 0, 0, 120, 80);
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png', 0.9);
    expect(result.byteLength).toBe(3);
  });

  it('fills the selected watermark region using surrounding pixels before encoding', async () => {
    const pixels = new Uint8ClampedArray([
      10, 10, 10, 255,
      99, 99, 99, 255,
      20, 20, 20, 255,
      30, 30, 30, 255,
      99, 99, 99, 255,
      40, 40, 40, 255,
      50, 50, 50, 255,
      99, 99, 99, 255,
      60, 60, 60, 255
    ]);
    const getImageData = vi.fn(() => ({
      data: pixels,
      width: 3,
      height: 3
    }));
    const putImageData = vi.fn();
    const drawImage = vi.fn();
    const toBlob = vi.fn((callback: BlobCallback, mimeType?: string) => {
      callback(new Blob([new Uint8Array([7, 7, 7])], { type: mimeType }));
    });
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
      if (tagName === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: vi.fn(() => ({
            drawImage,
            getImageData,
            putImageData
          })),
          toBlob
        } as unknown as HTMLCanvasElement;
      }

      return originalCreateElement(tagName);
    }) as typeof document.createElement);

    const app = {
      vault: {
        readBinary: vi.fn(async () => new Uint8Array([1, 1, 1]).buffer)
      }
    };
    const processor = new ImageProcessor(app as never, () => ({
      defaultFormat: ImageFormat.PNG,
      defaultQuality: 90
    }) as never);
    vi.spyOn(
      processor as unknown as {
        assertOutputFormatSupported: (format: ImageFormat) => void;
      },
      'assertOutputFormatSupported'
    ).mockImplementation(() => undefined);
    vi.spyOn(
      processor as unknown as {
        loadImage: (source: ArrayBuffer, extension: string) => Promise<{ width: number; height: number }>;
      },
      'loadImage'
    ).mockResolvedValue({ width: 3, height: 3 });

    await processor.removeWatermark(
      {
        extension: 'png'
      } as never,
      {
        x: 1,
        y: 0,
        width: 1,
        height: 3
      }
    );

    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 3, 3);
    expect(getImageData).toHaveBeenCalledWith(0, 0, 3, 3);
    expect(putImageData).toHaveBeenCalledWith(expect.objectContaining({ data: pixels }), 0, 0);
    expect([...pixels.slice(4, 8)]).not.toEqual([99, 99, 99, 255]);
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png', 0.9);
  });
});
