import type { App, TFile } from 'obsidian';
import type { ImageProcessor } from '@/services/image-processor';
import { MIME_BY_FORMAT } from '@/services/image-processor/format-support';
import { ImageFormat } from '@/types/index';
import { canWriteImageToClipboard } from '@/utils/compatibility';

const SOURCE_MIME_BY_EXTENSION: Readonly<Record<string, string>> = {
  bmp: 'image/bmp',
  gif: 'image/gif',
  heic: 'image/heic',
  jpeg: MIME_BY_FORMAT[ImageFormat.JPEG],
  jpg: MIME_BY_FORMAT[ImageFormat.JPEG],
  png: MIME_BY_FORMAT[ImageFormat.PNG],
  svg: 'image/svg+xml',
  tif: MIME_BY_FORMAT[ImageFormat.TIFF],
  tiff: MIME_BY_FORMAT[ImageFormat.TIFF],
  webp: MIME_BY_FORMAT[ImageFormat.WEBP]
};

const CLIPBOARD_FALLBACK_FORMATS = [ImageFormat.PNG, ImageFormat.JPEG] as const;
const DEFAULT_CLIPBOARD_MIME_TYPES = new Set<string>([MIME_BY_FORMAT[ImageFormat.PNG]]);

interface ClipboardWriteCandidate {
  readonly mimeType: string;
  readonly getBlob: () => Promise<Blob>;
}

export async function writeImageFileToClipboard(
  app: App,
  imageProcessor: Pick<ImageProcessor, 'convert'>,
  file: TFile
): Promise<string> {
  if (!canWriteImageToClipboard()) {
    throw new Error('Copy image is not available on this platform');
  }

  const candidates = buildClipboardWriteCandidates(app, imageProcessor, file);
  if (candidates.length === 0) {
    throw new Error('No clipboard-compatible image format is available');
  }

  let lastError: unknown;
  for (const candidate of candidates) {
    try {
      const blob = await candidate.getBlob();
      await navigator.clipboard.write([new ClipboardItem({ [candidate.mimeType]: blob })]);
      return candidate.mimeType;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Failed to copy image to clipboard');
}

function buildClipboardWriteCandidates(
  app: App,
  imageProcessor: Pick<ImageProcessor, 'convert'>,
  file: TFile
): ClipboardWriteCandidate[] {
  const candidates: ClipboardWriteCandidate[] = [];
  const attemptedMimeTypes = new Set<string>();
  const sourceMimeType = resolveSourceMimeType(file.extension);

  const addCandidate = (mimeType: string, getBlob: () => Promise<Blob>): void => {
    if (attemptedMimeTypes.has(mimeType) || !shouldAttemptClipboardMimeType(mimeType)) {
      return;
    }

    attemptedMimeTypes.add(mimeType);
    candidates.push({ mimeType, getBlob });
  };

  addCandidate(sourceMimeType, async () => {
    const buffer = await app.vault.readBinary(file);
    return new Blob([buffer], { type: sourceMimeType });
  });

  for (const format of CLIPBOARD_FALLBACK_FORMATS) {
    const mimeType = MIME_BY_FORMAT[format];
    addCandidate(mimeType, async () => {
      const buffer = await imageProcessor.convert(file, format);
      return new Blob([buffer], { type: mimeType });
    });
  }

  return candidates;
}

function resolveSourceMimeType(extension: string): string {
  const normalized = extension.toLowerCase();
  return SOURCE_MIME_BY_EXTENSION[normalized] ?? `image/${normalized}`;
}

function shouldAttemptClipboardMimeType(mimeType: string): boolean {
  const clipboardItemWithSupports = ClipboardItem as typeof ClipboardItem & {
    supports?: (type: string) => boolean;
  };
  if (typeof clipboardItemWithSupports.supports === 'function') {
    return clipboardItemWithSupports.supports(mimeType);
  }

  return DEFAULT_CLIPBOARD_MIME_TYPES.has(mimeType);
}
