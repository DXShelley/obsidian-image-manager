import { Platform, type App } from 'obsidian';
import { getUiCopy } from '@/i18n';
import { ImageFormat, type UiLanguage } from '@/types/index';

const DESKTOP_OUTPUT_FORMATS = [ImageFormat.PNG, ImageFormat.JPEG, ImageFormat.WEBP] as const;

const OUTPUT_MIME_BY_FORMAT: Readonly<Record<ImageFormat, string>> = {
  [ImageFormat.WEBP]: 'image/webp',
  [ImageFormat.JPEG]: 'image/jpeg',
  [ImageFormat.PNG]: 'image/png',
  [ImageFormat.BMP]: 'image/bmp',
  [ImageFormat.GIF]: 'image/gif',
  [ImageFormat.HEIC]: 'image/heic',
  [ImageFormat.SVG]: 'image/svg+xml',
  [ImageFormat.TIFF]: 'image/tiff'
} as const;

const outputFormatSupportCache = new Map<ImageFormat, boolean>();

export function getSupportedCanvasOutputFormats(): readonly ImageFormat[] {
  return DESKTOP_OUTPUT_FORMATS.filter((format) => canEncodeCanvasOutputFormat(format));
}

export function canEncodeCanvasOutputFormat(format: ImageFormat): boolean {
  const cached = outputFormatSupportCache.get(format);
  if (cached !== undefined) {
    return cached;
  }

  const supported = detectCanvasOutputSupport(format);
  outputFormatSupportCache.set(format, supported);
  return supported;
}

export function canWriteImageToClipboard(): boolean {
  return (
    !Platform.isMobileApp &&
    typeof navigator !== 'undefined' &&
    typeof navigator.clipboard?.write === 'function' &&
    typeof ClipboardItem !== 'undefined'
  );
}

export function getAttachmentFolderSetting(app: App): string | null {
  const vaultWithConfig = app.vault as App['vault'] & {
    getConfig?: (key: string) => unknown;
  };
  const configured = vaultWithConfig.getConfig?.('attachmentFolderPath');
  return typeof configured === 'string' ? configured : null;
}

export function describeCurrentPlatform(language: UiLanguage = 'zh-CN'): string {
  const platforms = getUiCopy(language).common.platforms;
  if (Platform.isIosApp) {
    return 'iOS';
  }
  if (Platform.isAndroidApp) {
    return 'Android';
  }
  if (Platform.isMobileApp) {
    return platforms.mobile;
  }
  if (Platform.isDesktopApp) {
    return platforms.desktop;
  }
  if (Platform.isMobile) {
    return platforms.mobileMode;
  }

  return platforms.desktopMode;
}

function detectCanvasOutputSupport(format: ImageFormat): boolean {
  const canvas = activeDocument.createElement('canvas');
  if (typeof canvas.toDataURL !== 'function') {
    return false;
  }

  const mime = OUTPUT_MIME_BY_FORMAT[format];
  try {
    const dataUrl = canvas.toDataURL(mime);
    return dataUrl.startsWith(`data:${mime}`);
  } catch {
    return false;
  }
}
