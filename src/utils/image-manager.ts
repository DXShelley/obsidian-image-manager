import { GallerySortBy, PathFormat, type ImageFormat, type ImageInfo } from '@/types/index';

export function normalizeVaultPath(path: string): string {
  const segments = path.replace(/\\/g, '/').split('/');
  const normalized: string[] = [];

  for (const segment of segments) {
    if (!segment || segment === '.') {
      continue;
    }

    if (segment === '..') {
      normalized.pop();
      continue;
    }

    normalized.push(segment);
  }

  return normalized.join('/');
}

export function getParentPath(path: string): string {
  const normalized = normalizeVaultPath(path);
  const index = normalized.lastIndexOf('/');
  return index >= 0 ? normalized.slice(0, index) : '';
}

export function getFileStem(path: string): string {
  const normalized = normalizeVaultPath(path);
  const fileName = normalized.split('/').pop() ?? normalized;
  return fileName.replace(/\.[^/.]+$/, '');
}

export function resolveNoteScopedPath(template: string, notePath: string): string {
  const noteFolder = getParentPath(notePath);
  const isRelative = isRelativePathTemplate(template);
  return normalizeVaultPath(isRelative && noteFolder ? `${noteFolder}/${template}` : isRelative ? template : template.replace(/^\//, ''));
}

export function isRelativePathTemplate(template: string): boolean {
  return template.startsWith('./') || template.startsWith('../');
}

export function isNoteScopedPathTemplate(template: string): boolean {
  return /(?:\{noteName\}|\$\{noteName\}|\{noteFileName\}|\$\{noteFileName\})/.test(template);
}

export function isRelocatableOutputFolderTemplate(template: string): boolean {
  const trimmed = template.trim();
  if (!trimmed) {
    return false;
  }

  return isRelativePathTemplate(trimmed) || isNoteScopedPathTemplate(trimmed);
}

export function inferPathFormat(target: string): PathFormat {
  if (target.startsWith('/')) {
    return PathFormat.ABSOLUTE;
  }

  if (isRelativePathTemplate(target) || target.includes('/')) {
    return PathFormat.RELATIVE;
  }

  return PathFormat.SHORTEST;
}

export interface NextAvailablePathOptions {
  readonly minDigits?: number;
}

export function nextAvailablePath(
  path: string,
  exists: (candidate: string) => boolean,
  options: NextAvailablePathOptions = {}
): string {
  if (!exists(path)) {
    return path;
  }

  const extensionIndex = path.lastIndexOf('.');
  const base = extensionIndex >= 0 ? path.slice(0, extensionIndex) : path;
  const extension = extensionIndex >= 0 ? path.slice(extensionIndex) : '';
  const minDigits = Math.max(1, options.minDigits ?? 1);

  let counter = 1;
  let candidate = `${base}-${counter.toString().padStart(minDigits, '0')}${extension}`;
  while (exists(candidate)) {
    counter += 1;
    candidate = `${base}-${counter.toString().padStart(minDigits, '0')}${extension}`;
  }

  return candidate;
}

export function getConvertedTargetPath(
  sourcePath: string,
  format: ImageFormat,
  exists: (candidate: string) => boolean
): string {
  const targetPath = sourcePath.replace(/\.[^/.]+$/, `.${format}`);
  if (targetPath === sourcePath) {
    return sourcePath;
  }

  return nextAvailablePath(targetPath, exists);
}

export function sortImages(images: ImageInfo[], sortBy: GallerySortBy): ImageInfo[] {
  const sorted = [...images];

  sorted.sort((left, right) => {
    switch (sortBy) {
      case GallerySortBy.NAME:
        return left.name.localeCompare(right.name);
      case GallerySortBy.SIZE:
        return right.size - left.size;
      case GallerySortBy.DATE:
      default:
        return right.mtime - left.mtime;
    }
  });

  return sorted;
}
