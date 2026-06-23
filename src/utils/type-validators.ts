import {
  err,
  GalleryGridSize,
  GallerySortBy,
  ImageFormat,
  isGalleryGridSize,
  isGallerySortBy,
  isImageFormat,
  isValidQuality,
  ok,
  type Result
} from '@/types/index';

export function validateQuality(quality: unknown): Result<number, Error> {
  return isValidQuality(quality)
    ? ok(quality)
    : err(new Error('Quality must be an integer between 1 and 100'));
}

export function validateImageFormat(format: unknown): Result<ImageFormat, Error> {
  return isImageFormat(format)
    ? ok(format)
    : err(new Error(`Invalid image format. Must be one of: ${Object.values(ImageFormat).join(', ')}`));
}

export function validateGalleryGridSize(size: unknown): Result<GalleryGridSize, Error> {
  return isGalleryGridSize(size)
    ? ok(size)
    : err(new Error(`Invalid gallery grid size. Must be one of: ${Object.values(GalleryGridSize).join(', ')}`));
}

export function validateGallerySortBy(sortBy: unknown): Result<GallerySortBy, Error> {
  return isGallerySortBy(sortBy)
    ? ok(sortBy)
    : err(new Error(`Invalid gallery sort. Must be one of: ${Object.values(GallerySortBy).join(', ')}`));
}
