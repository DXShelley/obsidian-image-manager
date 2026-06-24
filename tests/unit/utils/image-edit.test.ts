import { describe, expect, it } from 'vitest';
import { fillWatermarkSelection, normalizeImageSelection } from '@/utils/image-edit';

describe('image-edit utilities', () => {
  it('normalizes selections into image bounds', () => {
    expect(
      normalizeImageSelection(
        {
          x: -12,
          y: 10,
          width: 40,
          height: 25
        },
        20,
        20
      )
    ).toEqual({
      x: 0,
      y: 10,
      width: 20,
      height: 10
    });
  });

  it('fills a watermark region from surrounding pixels', () => {
    const pixels = new Uint8ClampedArray([
      10, 10, 10, 255,
      90, 90, 90, 255,
      20, 20, 20, 255,
      30, 30, 30, 255,
      90, 90, 90, 255,
      40, 40, 40, 255,
      50, 50, 50, 255,
      90, 90, 90, 255,
      60, 60, 60, 255
    ]);

    fillWatermarkSelection(
      pixels,
      3,
      3,
      {
        x: 1,
        y: 0,
        width: 1,
        height: 3
      }
    );

    expect([...pixels.slice(4, 8)]).not.toEqual([90, 90, 90, 255]);
    expect([...pixels.slice(16, 20)]).not.toEqual([90, 90, 90, 255]);
    expect(pixels[4]).toBeLessThan(90);
    expect(pixels[4]).toBeGreaterThan(10);
  });
});
