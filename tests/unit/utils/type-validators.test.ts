import { describe, expect, it } from 'vitest';
import { validateImageFormat, validateQuality } from '@/utils/type-validators';
import { ImageFormat } from '@/types/index';

describe('type validators', () => {
  it('accepts supported image formats', () => {
    expect(validateImageFormat(ImageFormat.WEBP)).toEqual({ ok: true, value: ImageFormat.WEBP });
  });

  it('rejects invalid quality values', () => {
    expect(validateQuality(101).ok).toBe(false);
  });
});
