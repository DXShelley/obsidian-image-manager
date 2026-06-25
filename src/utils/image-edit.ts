import type { ImageSelection } from '@/types/index';

export function normalizeImageSelection(
  selection: ImageSelection,
  imageWidth: number,
  imageHeight: number
): ImageSelection | null {
  if (imageWidth <= 0 || imageHeight <= 0) {
    return null;
  }

  const x = clamp(Math.round(selection.x), 0, imageWidth);
  const y = clamp(Math.round(selection.y), 0, imageHeight);
  const right = clamp(Math.round(selection.x + selection.width), 0, imageWidth);
  const bottom = clamp(Math.round(selection.y + selection.height), 0, imageHeight);
  const width = Math.max(0, right - x);
  const height = Math.max(0, bottom - y);

  if (width <= 0 || height <= 0) {
    return null;
  }

  return { x, y, width, height };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
