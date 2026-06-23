import { describe, expect, it } from 'vitest';
import { GallerySortBy, ImageFormat, PathFormat, type ImageInfo } from '@/types/index';
import {
  getConvertedTargetPath,
  inferPathFormat,
  isRelocatableOutputFolderTemplate,
  nextAvailablePath,
  resolveNoteScopedPath,
  sortImages
} from '@/utils/image-manager';

const images: ImageInfo[] = [
  {
    path: 'assets/c.png',
    name: 'c.png',
    extension: 'png',
    size: 200,
    mtime: 20
  },
  {
    path: 'assets/a.png',
    name: 'a.png',
    extension: 'png',
    size: 300,
    mtime: 10
  },
  {
    path: 'assets/b.png',
    name: 'b.png',
    extension: 'png',
    size: 100,
    mtime: 30
  }
];

describe('image manager utilities', () => {
  it('finds the next available path without overwriting existing files', () => {
    const existing = new Set(['assets/photo.webp', 'assets/photo-1.webp']);

    expect(nextAvailablePath('assets/photo.webp', (candidate) => existing.has(candidate))).toBe('assets/photo-2.webp');
  });

  it('keeps the original path when converting to the same format', () => {
    expect(getConvertedTargetPath('assets/photo.webp', ImageFormat.WEBP, () => false)).toBe('assets/photo.webp');
  });

  it('creates a unique converted target path when the destination exists', () => {
    const existing = new Set(['assets/photo.webp']);

    expect(getConvertedTargetPath('assets/photo.png', ImageFormat.WEBP, (candidate) => existing.has(candidate))).toBe(
      'assets/photo-1.webp'
    );
  });

  it('resolves relative note-scoped folders and infers stored link path formats', () => {
    expect(resolveNoteScopedPath('./assets/Daily_Note', 'projects/alpha/Daily Note.md')).toBe('projects/alpha/assets/Daily_Note');
    expect(inferPathFormat('/assets/photo.png')).toBe(PathFormat.ABSOLUTE);
    expect(inferPathFormat('assets/photo.png')).toBe(PathFormat.RELATIVE);
    expect(inferPathFormat('photo.png')).toBe(PathFormat.SHORTEST);
  });

  it('only treats explicit managed folder templates as safe to relocate', () => {
    expect(isRelocatableOutputFolderTemplate('')).toBe(false);
    expect(isRelocatableOutputFolderTemplate('./assets')).toBe(true);
    expect(isRelocatableOutputFolderTemplate('Attachments/Images')).toBe(false);
    expect(isRelocatableOutputFolderTemplate('./assets/${noteFileName}')).toBe(true);
  });

  it('sorts gallery images by name, date, and size', () => {
    expect(sortImages(images, GallerySortBy.NAME).map((image) => image.name)).toEqual(['a.png', 'b.png', 'c.png']);
    expect(sortImages(images, GallerySortBy.DATE).map((image) => image.name)).toEqual(['b.png', 'c.png', 'a.png']);
    expect(sortImages(images, GallerySortBy.SIZE).map((image) => image.name)).toEqual(['a.png', 'c.png', 'b.png']);
  });
});
