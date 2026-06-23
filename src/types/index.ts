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
  defaultFormat: ImageFormat;
  defaultQuality: number;
  defaultLinkFormat: LinkFormat;
  defaultPathFormat: PathFormat;
  renamePattern: string;
  outputFolder: string;
  enableAutoConvert: boolean;
  enableAutoRename: boolean;
  enableGallery: boolean;
  enableContextMenu: boolean;
  enableDragResize: boolean;
  enableImageAlign: boolean;
  imageAlignmentDefaultAlignment: Alignment;
  disableObsidianImageSelectionOnClick: boolean;
  dropPasteCursorLocation: 'front' | 'back';
  showSpaceSavedNotification: boolean;
  galleryGridSize: GalleryGridSize;
  gallerySortBy: GallerySortBy;
  compressionQuality: number;
  compressionThresholdKB: number;
}

export const DEFAULT_SETTINGS: Readonly<ImageManagerSettings> = {
  defaultFormat: ImageFormat.WEBP,
  defaultQuality: 80,
  defaultLinkFormat: LinkFormat.WIKI,
  defaultPathFormat: PathFormat.SHORTEST,
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

export interface ImageInfo {
  readonly path: string;
  readonly name: string;
  readonly extension: string;
  readonly size: number;
  readonly mtime: number;
  readonly width?: number;
  readonly height?: number;
}

export interface ProcessOptions {
  readonly format?: ImageFormat;
  readonly quality?: number;
  readonly maxWidth?: number;
  readonly maxHeight?: number;
}

export interface RenameMoveResult {
  readonly oldPath: string;
  readonly newPath: string;
}

export enum BatchScope {
  CURRENT_NOTE = 'current-note',
  FOLDER = 'folder',
  VAULT = 'vault'
}

export enum BatchOperation {
  COMPRESS = 'compress',
  CONVERT = 'convert',
  RENAME = 'rename'
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
