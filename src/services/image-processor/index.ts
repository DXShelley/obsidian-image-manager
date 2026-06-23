import type { App, TFile } from 'obsidian';
import { ImageFormat, type ImageInfo, type ImageManagerSettings, type ProcessOptions } from '@/types/index';
import { MIME_BY_FORMAT } from './format-support';
import { canEncodeCanvasOutputFormat, getSupportedCanvasOutputFormats } from '@/utils/compatibility';

export class ImageProcessor {
  constructor(
    private readonly app: App,
    private readonly getSettings: () => ImageManagerSettings
  ) {}

  isSupportedImage(file: TFile): boolean {
    return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'tif', 'tiff', 'heic'].includes(
      file.extension.toLowerCase()
    );
  }

  async getImageInfo(file: TFile): Promise<ImageInfo> {
    const dimensions = await this.tryReadDimensions(file);
    return {
      path: file.path,
      name: file.name,
      extension: file.extension,
      size: file.stat.size,
      mtime: file.stat.mtime,
      resourcePath: this.app.vault.getResourcePath(file),
      width: dimensions?.width,
      height: dimensions?.height
    };
  }

  async compress(file: TFile, quality = this.getSettings().compressionQuality): Promise<ArrayBuffer> {
    this.assertOutputFormatSupported(this.extensionToFormat(file.extension));
    return this.process(file, {
      format: this.extensionToFormat(file.extension),
      quality
    });
  }

  async convert(file: TFile, format = this.getSettings().defaultFormat): Promise<ArrayBuffer> {
    this.assertOutputFormatSupported(format);
    return this.process(file, {
      format,
      quality: this.getSettings().defaultQuality
    });
  }

  async resize(file: TFile, maxWidth?: number, maxHeight?: number): Promise<ArrayBuffer> {
    this.assertOutputFormatSupported(this.extensionToFormat(file.extension));
    return this.process(file, {
      format: this.extensionToFormat(file.extension),
      quality: this.getSettings().defaultQuality,
      maxWidth,
      maxHeight
    });
  }

  async rotate(file: TFile, degrees: 90 | 180 | 270): Promise<ArrayBuffer> {
    this.assertOutputFormatSupported(this.extensionToFormat(file.extension));
    const source = await this.app.vault.readBinary(file);
    const image = await this.loadImage(source, file.extension);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context is unavailable');
    }

    const quarterTurn = degrees === 90 || degrees === 270;
    canvas.width = quarterTurn ? image.height : image.width;
    canvas.height = quarterTurn ? image.width : image.height;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((degrees * Math.PI) / 180);
    ctx.drawImage(image, -image.width / 2, -image.height / 2);

    return this.canvasToArrayBuffer(canvas, this.extensionToFormat(file.extension), this.getSettings().defaultQuality);
  }

  async flip(file: TFile, direction: 'horizontal' | 'vertical'): Promise<ArrayBuffer> {
    this.assertOutputFormatSupported(this.extensionToFormat(file.extension));
    const source = await this.app.vault.readBinary(file);
    const image = await this.loadImage(source, file.extension);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context is unavailable');
    }

    canvas.width = image.width;
    canvas.height = image.height;
    ctx.save();
    if (direction === 'horizontal') {
      ctx.scale(-1, 1);
      ctx.drawImage(image, -image.width, 0);
    } else {
      ctx.scale(1, -1);
      ctx.drawImage(image, 0, -image.height);
    }
    ctx.restore();

    return this.canvasToArrayBuffer(canvas, this.extensionToFormat(file.extension), this.getSettings().defaultQuality);
  }

  private async process(file: TFile, options: ProcessOptions): Promise<ArrayBuffer> {
    const source = await this.app.vault.readBinary(file);
    const image = await this.loadImage(source, file.extension);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context is unavailable');
    }

    const dimensions = this.fitDimensions(image.width, image.height, options.maxWidth, options.maxHeight);
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    ctx.drawImage(image, 0, 0, dimensions.width, dimensions.height);

    return this.canvasToArrayBuffer(
      canvas,
      options.format ?? this.getSettings().defaultFormat,
      options.quality ?? this.getSettings().defaultQuality
    );
  }

  private fitDimensions(width: number, height: number, maxWidth?: number, maxHeight?: number): { width: number; height: number } {
    if (!maxWidth && !maxHeight) {
      return { width, height };
    }

    const widthRatio = maxWidth ? maxWidth / width : Number.POSITIVE_INFINITY;
    const heightRatio = maxHeight ? maxHeight / height : Number.POSITIVE_INFINITY;
    const ratio = Math.min(widthRatio, heightRatio, 1);
    return {
      width: Math.max(1, Math.round(width * ratio)),
      height: Math.max(1, Math.round(height * ratio))
    };
  }

  private async tryReadDimensions(file: TFile): Promise<{ width: number; height: number } | null> {
    try {
      const source = await this.app.vault.readBinary(file);
      const image = await this.loadImage(source, file.extension);
      return { width: image.width, height: image.height };
    } catch {
      return null;
    }
  }

  private loadImage(source: ArrayBuffer, extension: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const blob = new Blob([source], { type: this.extensionToMime(extension) });
      const url = URL.createObjectURL(blob);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      image.src = url;
    });
  }

  private canvasToArrayBuffer(canvas: HTMLCanvasElement, format: ImageFormat, quality: number): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to encode image'));
            return;
          }

          void blob.arrayBuffer().then(resolve, reject);
        },
        MIME_BY_FORMAT[format] ?? MIME_BY_FORMAT[ImageFormat.WEBP],
        quality / 100
      );
    });
  }

  private extensionToFormat(extension: string): ImageFormat {
    const normalized = extension.toLowerCase();
    if (normalized === 'jpg') {
      return ImageFormat.JPEG;
    }
    if (Object.values(ImageFormat).includes(normalized as ImageFormat)) {
      return normalized as ImageFormat;
    }
    return this.getSettings().defaultFormat;
  }

  private extensionToMime(extension: string): string {
    return MIME_BY_FORMAT[this.extensionToFormat(extension)] ?? `image/${extension}`;
  }

  private assertOutputFormatSupported(format: ImageFormat): void {
    if (canEncodeCanvasOutputFormat(format)) {
      return;
    }

    const supportedFormats = getSupportedCanvasOutputFormats()
      .map((item) => item.toUpperCase())
      .join(', ');
    throw new Error(`Current platform cannot encode ${format.toUpperCase()} images. Supported outputs: ${supportedFormats}`);
  }
}
