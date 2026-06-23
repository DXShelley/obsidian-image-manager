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
  enablePasteHandler: boolean;
  enableAutoDownloadImagesFromText: boolean;
  enableAutoConvert: boolean;
  enableAutoRename: boolean;
  enableGallery: boolean;
  enableContextMenu: boolean;
  enableDragResize: boolean;
  enableImageAlign: boolean;
  imageAlignmentDefaultAlignment: Alignment;
  disableObsidianImageSelectionOnClick: boolean;
  dropPasteCursorLocation: 'front' | 'back';
  showOperationNotifications: boolean;
  showSpaceSavedNotification: boolean;
  enableNoteRenameSync: boolean;
  renameImagesOnNoteRelocate: boolean;
  galleryGridSize: GalleryGridSize;
  gallerySortBy: GallerySortBy;
  compressionQuality: number;
  compressionIgnorePattern: string;
  conversionIgnorePattern: string;
  compressionThresholdKB: number;
}

export const DEFAULT_SETTINGS: Readonly<ImageManagerSettings> = {
  defaultFormat: ImageFormat.WEBP,
  defaultQuality: 80,
  defaultLinkFormat: LinkFormat.WIKI,
  defaultPathFormat: PathFormat.SHORTEST,
  renamePattern: '{noteName}-{date}-{random}',
  outputFolder: '',
  enablePasteHandler: true,
  enableAutoDownloadImagesFromText: true,
  enableAutoConvert: true,
  enableAutoRename: true,
  enableGallery: true,
  enableContextMenu: true,
  enableDragResize: true,
  enableImageAlign: true,
  imageAlignmentDefaultAlignment: Alignment.NONE,
  disableObsidianImageSelectionOnClick: false,
  dropPasteCursorLocation: 'back',
  showOperationNotifications: true,
  showSpaceSavedNotification: true,
  enableNoteRenameSync: true,
  renameImagesOnNoteRelocate: false,
  galleryGridSize: GalleryGridSize.MEDIUM,
  gallerySortBy: GallerySortBy.DATE,
  compressionQuality: 80,
  compressionIgnorePattern: '',
  conversionIgnorePattern: '',
  compressionThresholdKB: 100
} as const;

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
