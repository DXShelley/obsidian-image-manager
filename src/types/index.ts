export enum ImageFormat {
  WEBP = 'webp',
  JPEG = 'jpeg',
  PNG = 'png',
  GIF = 'gif',
  HEIC = 'heic',
  TIFF = 'tiff'
}

export enum Alignment {
  LEFT = 'left',
  CENTER = 'center',
  RIGHT = 'right',
  NONE = 'none'
}

export enum GalleryGridSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large'
}

export enum GallerySortBy {
  NAME = 'name',
  DATE = 'date',
  SIZE = 'size'
}

export enum LinkFormat {
  WIKI = 'wiki',
  MARKDOWN = 'markdown'
}

export enum PathFormat {
  ABSOLUTE = 'absolute',
  RELATIVE = 'relative',
  SHORTEST = 'shortest'
}

export interface ImageManagerSettings {
  readonly defaultFormat: ImageFormat;
  readonly defaultQuality: number;
  readonly renamePattern: string;
  readonly outputFolder: string;
  readonly enableAutoConvert: boolean;
  readonly enableAutoRename: boolean;
  readonly enableGallery: boolean;
  readonly enableContextMenu: boolean;
  readonly enableDragResize: boolean;
  readonly enableImageAlign: boolean;
  readonly imageAlignmentDefaultAlignment: Alignment;
  readonly disableObsidianImageSelectionOnClick: boolean;
  readonly dropPasteCursorLocation: 'front' | 'back';
  readonly showSpaceSavedNotification: boolean;
  readonly galleryGridSize: GalleryGridSize;
  readonly gallerySortBy: GallerySortBy;
  readonly compressionQuality: number;
  readonly compressionThresholdKB: number;
}

export const DEFAULT_SETTINGS: Readonly<ImageManagerSettings> = {
  defaultFormat: ImageFormat.WEBP,
  defaultQuality: 80,
  renamePattern: '{noteName}-{date}-{random}',
  outputFolder: '',
  enableAutoConvert: true,
  enableAutoRename: true,
  enableGallery: true,
  enableContextMenu: true,
  enableDragResize: true,
  enableImageAlign: true,
  imageAlignmentDefaultAlignment: Alignment.NONE,
  disableObsidianImageSelectionOnClick: false,
  dropPasteCursorLocation: 'back',
  showSpaceSavedNotification: true,
  galleryGridSize: GalleryGridSize.MEDIUM,
  gallerySortBy: GallerySortBy.DATE,
  compressionQuality: 80,
  compressionThresholdKB: 100
} as const;

export interface VariableContext {
  readonly noteName: string;
  readonly fileName: string;
  readonly date: string;
  readonly time: string;
  readonly random: string;
  readonly [key: string]: string;
}

export interface LinkFormatOptions {
  readonly format: LinkFormat;
  readonly pathFormat: PathFormat;
  readonly altText?: string;
  readonly width?: number;
  readonly height?: number;
}

export interface ParsedLink {
  readonly path: string;
  readonly format: LinkFormat;
  readonly altText?: string;
  readonly width?: number;
  readonly height?: number;
}

export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E extends Error>(error: E): Result<never, E> {
  return { ok: false, error };
}

export function isImageFormat(value: unknown): value is ImageFormat {
  return Object.values(ImageFormat).includes(value as ImageFormat);
}

export function isGalleryGridSize(value: unknown): value is GalleryGridSize {
  return Object.values(GalleryGridSize).includes(value as GalleryGridSize);
}

export function isGallerySortBy(value: unknown): value is GallerySortBy {
  return Object.values(GallerySortBy).includes(value as GallerySortBy);
}

export function isValidQuality(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 100;
}
