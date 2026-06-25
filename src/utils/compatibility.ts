import { Platform, type App } from 'obsidian';
import { getUiCopy } from '@/i18n';
import { ImageFormat, type UiLanguage } from '@/types/index';

const DESKTOP_OUTPUT_FORMATS = [ImageFormat.PNG, ImageFormat.JPEG, ImageFormat.WEBP] as const;
const DEBUG_MODE_STORAGE_KEYS = [
  'debug-mode',
  'debugMode',
  'debug-plugin',
  'debug-plugins',
  'developer-mode',
  'developerMode',
  'dev-mode',
  'devMode',
  'debug',
  'developer'
] as const;

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

export function detectObsidianDebugMode(app: App): boolean {
  const appWithDebugMode = app as App & {
    debugMode?: () => boolean;
    isDebugMode?: () => boolean;
    isDebug?: boolean | (() => boolean);
    developerMode?: () => boolean;
    isDeveloperMode?: () => boolean;
  };

  const directDebugMode =
    callBooleanGetter(appWithDebugMode.debugMode) ??
    callBooleanGetter(appWithDebugMode.isDebugMode) ??
    callBooleanGetter(appWithDebugMode.developerMode) ??
    callBooleanGetter(appWithDebugMode.isDeveloperMode) ??
    normalizeBoolean(appWithDebugMode.isDebug);
  if (directDebugMode !== null) {
    return directDebugMode;
  }

  for (const key of DEBUG_MODE_STORAGE_KEYS) {
    const stored = normalizeBoolean(app.loadLocalStorage(key));
    if (stored !== null) {
      return stored;
    }
  }

  if (typeof window !== 'undefined' && 'localStorage' in window) {
    for (const key of DEBUG_MODE_STORAGE_KEYS) {
      const stored = normalizeBoolean(window.localStorage.getItem(key));
      if (stored !== null) {
        return stored;
      }
    }

    if (scanStorageForDebugFlag(window.localStorage)) {
      return true;
    }
  }

  if (typeof document !== 'undefined' && /(debug|developer)/i.test(document.body?.className ?? '')) {
    return true;
  }

  return false;
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
  if (typeof document === 'undefined') {
    return false;
  }

  const canvas = document.createElement('canvas');
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

function callBooleanGetter(getter: (() => boolean) | undefined): boolean | null {
  if (typeof getter !== 'function') {
    return null;
  }

  try {
    return getter();
  } catch {
    return null;
  }
}

function normalizeBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') {
      return true;
    }
    if (normalized === 'false' || normalized === '0') {
      return false;
    }
  }

  if (typeof value === 'number') {
    if (value === 1) {
      return true;
    }
    if (value === 0) {
      return false;
    }
  }

  return null;
}

function scanStorageForDebugFlag(storage: Storage): boolean {
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key || !/(debug|developer)/i.test(key)) {
      continue;
    }

    const stored = normalizeBoolean(storage.getItem(key));
    if (stored === true) {
      return true;
    }
  }

  return false;
}
