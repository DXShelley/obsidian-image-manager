import { ImageFormat } from '@/types/index';

export const MIME_BY_FORMAT: Record<ImageFormat, string> = {
  [ImageFormat.WEBP]: 'image/webp',
  [ImageFormat.JPEG]: 'image/jpeg',
  [ImageFormat.PNG]: 'image/png',
  [ImageFormat.GIF]: 'image/gif',
  [ImageFormat.HEIC]: 'image/heic',
  [ImageFormat.TIFF]: 'image/tiff'
};
