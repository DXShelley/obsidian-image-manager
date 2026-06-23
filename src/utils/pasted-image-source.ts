import { readFile } from 'fs/promises';
import { basename, extname } from 'path';
import { fileURLToPath } from 'url';

export type TextImageSourceKind = 'remote' | 'file' | 'data';

export interface TextImageSource {
  readonly kind: TextImageSourceKind;
  readonly value: string;
  readonly originalName: string;
  readonly mimeType?: string;
}

export interface ResolvedTextImageSource {
  readonly data: ArrayBuffer;
  readonly originalName: string;
}

const IMAGE_FILE_EXTENSION_REGEX = /\.(png|jpe?g|gif|webp|bmp|svg|tiff?|heic)$/i;
const DATA_IMAGE_URL_REGEX = /^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\s]+)$/i;

export function parseTextImageSources(text: string): TextImageSource[] {
  const candidates = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (candidates.length === 0) {
    return [];
  }

  const sources = candidates.map((line) => parseSingleTextImageSource(line));
  if (sources.some((source) => source === null)) {
    return [];
  }

  return sources.filter((source): source is TextImageSource => source !== null);
}

export async function resolveTextImageSource(source: TextImageSource): Promise<ResolvedTextImageSource> {
  switch (source.kind) {
    case 'remote':
      return resolveRemoteImageSource(source);
    case 'file':
      return resolveFileImageSource(source);
    case 'data':
      return resolveDataImageSource(source);
  }
}

function parseSingleTextImageSource(value: string): TextImageSource | null {
  const dataSource = parseDataImageSource(value);
  if (dataSource !== null) {
    return dataSource;
  }

  if (/^file:\/\//i.test(value)) {
    try {
      const filePath = fileURLToPath(value);
      const name = basename(filePath);
      if (!IMAGE_FILE_EXTENSION_REGEX.test(name)) {
        return null;
      }

      return {
        kind: 'file',
        value,
        originalName: name
      };
    } catch {
      return null;
    }
  }

  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      const name = decodeURIComponent(basename(url.pathname));
      if (!name || !IMAGE_FILE_EXTENSION_REGEX.test(name)) {
        return null;
      }

      return {
        kind: 'remote',
        value,
        originalName: name
      };
    } catch {
      return null;
    }
  }

  return null;
}

function parseDataImageSource(value: string): TextImageSource | null {
  const matched = value.match(DATA_IMAGE_URL_REGEX);
  if (!matched) {
    return null;
  }

  const mimeType = matched[1]?.toLowerCase();
  if (!mimeType) {
    return null;
  }
  const extension = mimeTypeToExtension(mimeType);
  return {
    kind: 'data',
    value,
    originalName: `pasted-image.${extension}`,
    mimeType
  };
}

async function resolveRemoteImageSource(source: TextImageSource): Promise<ResolvedTextImageSource> {
  const response = await fetch(source.value);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }

  const mimeType = (response.headers.get('content-type') ?? '').toLowerCase();
  if (!mimeType.startsWith('image/')) {
    throw new Error(`Remote URL is not an image: ${mimeType || 'unknown content-type'}`);
  }

  return {
    data: await response.arrayBuffer(),
    originalName: ensureFileNameExtension(source.originalName, mimeType)
  };
}

async function resolveFileImageSource(source: TextImageSource): Promise<ResolvedTextImageSource> {
  const buffer = await readFile(fileURLToPath(source.value));
  return {
    data: toArrayBuffer(buffer),
    originalName: source.originalName
  };
}

async function resolveDataImageSource(source: TextImageSource): Promise<ResolvedTextImageSource> {
  const matched = source.value.match(DATA_IMAGE_URL_REGEX);
  if (!matched) {
    throw new Error('Invalid base64 image data URL');
  }

  return {
    data: decodeBase64ToArrayBuffer(matched[2] ?? ''),
    originalName: source.originalName
  };
}

function ensureFileNameExtension(fileName: string, mimeType: string): string {
  if (extname(fileName)) {
    return fileName;
  }

  return `${fileName}.${mimeTypeToExtension(mimeType)}`;
}

function mimeTypeToExtension(mimeType: string): string {
  switch (mimeType.toLowerCase()) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    case 'image/bmp':
      return 'bmp';
    case 'image/svg+xml':
      return 'svg';
    case 'image/tif':
    case 'image/tiff':
      return 'tiff';
    case 'image/heic':
      return 'heic';
    default:
      return 'png';
  }
}

function decodeBase64ToArrayBuffer(value: string): ArrayBuffer {
  const sanitized = value.replace(/\s+/g, '');
  const decoded = Buffer.from(sanitized, 'base64');
  return toArrayBuffer(decoded);
}

function toArrayBuffer(buffer: Uint8Array): ArrayBuffer {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
}
