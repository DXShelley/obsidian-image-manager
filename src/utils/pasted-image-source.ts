import { readFile } from 'fs/promises';
import { requestUrl } from 'obsidian';
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

export interface ParseTextImageSourceOptions {
  readonly allowExtensionlessRemote?: boolean;
}

const IMAGE_FILE_EXTENSION_REGEX = /\.(png|jpe?g|gif|webp|bmp|svg|tiff?|heic|avif)$/i;
const DATA_IMAGE_URL_REGEX = /^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\s]+)$/i;

export function parseTextImageSources(text: string, options: ParseTextImageSourceOptions = {}): TextImageSource[] {
  const candidates = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (candidates.length === 0) {
    return [];
  }

  const sources = candidates.map((line) => parseSingleTextImageSource(line, options));
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

function parseSingleTextImageSource(value: string, options: ParseTextImageSourceOptions): TextImageSource | null {
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
      const name = getRemoteSourceFileName(url);
      if (name && IMAGE_FILE_EXTENSION_REGEX.test(name)) {
        return {
          kind: 'remote',
          value,
          originalName: name
        };
      }

      if (!options.allowExtensionlessRemote) {
        return null;
      }

      return {
        kind: 'remote',
        value,
        originalName: name || 'downloaded-image'
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
  if (!extension) {
    return null;
  }
  return {
    kind: 'data',
    value,
    originalName: `pasted-image.${extension}`,
    mimeType
  };
}

async function resolveRemoteImageSource(source: TextImageSource): Promise<ResolvedTextImageSource> {
  const response = await requestUrl({ url: source.value, throw: false });
  if (response.status >= 400) {
    throw new Error(`Failed to download image: ${response.status}`);
  }

  const mimeType = findHeaderValue(response.headers, 'content-type').toLowerCase();
  if (!mimeType.startsWith('image/')) {
    throw new Error(`Remote URL is not an image: ${mimeType || 'unknown content-type'}`);
  }

  return {
    data: response.arrayBuffer,
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
  if (IMAGE_FILE_EXTENSION_REGEX.test(fileName)) {
    return fileName;
  }

  const extension = mimeTypeToExtension(mimeType);
  if (!extension) {
    throw new Error(`Unsupported remote image format: ${mimeType}`);
  }

  const normalizedBaseName = extname(fileName) ? fileName.slice(0, -extname(fileName).length) : fileName;
  return `${normalizedBaseName || 'downloaded-image'}.${extension}`;
}

function mimeTypeToExtension(mimeType: string): string | null {
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
    case 'image/avif':
      return 'avif';
    default:
      return null;
  }
}

function getRemoteSourceFileName(url: URL): string {
  const pathName = decodeURIComponent(basename(url.pathname));
  if (pathName === '' || pathName === '/' || pathName === '.') {
    return '';
  }

  return pathName;
}

function decodeBase64ToArrayBuffer(value: string): ArrayBuffer {
  const sanitized = value.replace(/\s+/g, '');
  const decoded = Buffer.from(sanitized, 'base64');
  return toArrayBuffer(decoded);
}

function toArrayBuffer(buffer: Uint8Array): ArrayBuffer {
  const arrayBuffer = new ArrayBuffer(buffer.byteLength);
  new Uint8Array(arrayBuffer).set(buffer);
  return arrayBuffer;
}

function findHeaderValue(headers: Readonly<Record<string, string>>, targetName: string): string {
  const target = targetName.toLowerCase();
  for (const [name, value] of Object.entries(headers)) {
    if (name.toLowerCase() === target) {
      return value;
    }
  }
  return '';
}
