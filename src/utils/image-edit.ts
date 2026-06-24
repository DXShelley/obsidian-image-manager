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

export function fillWatermarkSelection(
  data: Uint8ClampedArray,
  imageWidth: number,
  imageHeight: number,
  selection: ImageSelection
): void {
  const region = normalizeImageSelection(selection, imageWidth, imageHeight);
  if (!region) {
    return;
  }

  for (let offsetY = 0; offsetY < region.height; offsetY += 1) {
    const y = region.y + offsetY;
    const rowRatio = region.height <= 1 ? 0.5 : offsetY / (region.height - 1);
    for (let offsetX = 0; offsetX < region.width; offsetX += 1) {
      const x = region.x + offsetX;
      const colRatio = region.width <= 1 ? 0.5 : offsetX / (region.width - 1);
      const horizontal = sampleHorizontalBlend(data, imageWidth, imageHeight, region, y, colRatio);
      const vertical = sampleVerticalBlend(data, imageWidth, imageHeight, region, x, rowRatio);
      const blended = blendColors(horizontal, vertical);
      if (!blended) {
        continue;
      }

      writePixel(data, imageWidth, x, y, blended);
    }
  }
}

interface RgbaColor {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}

function sampleHorizontalBlend(
  data: Uint8ClampedArray,
  imageWidth: number,
  imageHeight: number,
  selection: ImageSelection,
  y: number,
  ratio: number
): RgbaColor | null {
  const left = findNearestPixel(data, imageWidth, imageHeight, selection.x - 1, y, -1, 0);
  const right = findNearestPixel(data, imageWidth, imageHeight, selection.x + selection.width, y, 1, 0);
  return interpolateColors(left, right, ratio);
}

function sampleVerticalBlend(
  data: Uint8ClampedArray,
  imageWidth: number,
  imageHeight: number,
  selection: ImageSelection,
  x: number,
  ratio: number
): RgbaColor | null {
  const top = findNearestPixel(data, imageWidth, imageHeight, x, selection.y - 1, 0, -1);
  const bottom = findNearestPixel(data, imageWidth, imageHeight, x, selection.y + selection.height, 0, 1);
  return interpolateColors(top, bottom, ratio);
}

function interpolateColors(left: RgbaColor | null, right: RgbaColor | null, ratio: number): RgbaColor | null {
  if (left && right) {
    return {
      r: Math.round(left.r + (right.r - left.r) * ratio),
      g: Math.round(left.g + (right.g - left.g) * ratio),
      b: Math.round(left.b + (right.b - left.b) * ratio),
      a: Math.round(left.a + (right.a - left.a) * ratio)
    };
  }

  return left ?? right;
}

function blendColors(first: RgbaColor | null, second: RgbaColor | null): RgbaColor | null {
  if (first && second) {
    return {
      r: Math.round((first.r + second.r) / 2),
      g: Math.round((first.g + second.g) / 2),
      b: Math.round((first.b + second.b) / 2),
      a: Math.round((first.a + second.a) / 2)
    };
  }

  return first ?? second;
}

function findNearestPixel(
  data: Uint8ClampedArray,
  imageWidth: number,
  imageHeight: number,
  startX: number,
  startY: number,
  stepX: number,
  stepY: number
): RgbaColor | null {
  let x = startX;
  let y = startY;

  while (x >= 0 && x < imageWidth && y >= 0 && y < imageHeight) {
    return readPixel(data, imageWidth, x, y);
  }

  x += stepX;
  y += stepY;
  while (x >= 0 && x < imageWidth && y >= 0 && y < imageHeight) {
    return readPixel(data, imageWidth, x, y);
  }

  return null;
}

function readPixel(data: Uint8ClampedArray, imageWidth: number, x: number, y: number): RgbaColor {
  const index = (y * imageWidth + x) * 4;
  return {
    r: data[index] ?? 0,
    g: data[index + 1] ?? 0,
    b: data[index + 2] ?? 0,
    a: data[index + 3] ?? 255
  };
}

function writePixel(data: Uint8ClampedArray, imageWidth: number, x: number, y: number, color: RgbaColor): void {
  const index = (y * imageWidth + x) * 4;
  data[index] = color.r;
  data[index + 1] = color.g;
  data[index + 2] = color.b;
  data[index + 3] = color.a;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
