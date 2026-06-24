import { describe, expect, it } from 'vitest';
import {
  formatAutoConvertFallbackNotice,
  formatCompressionSummary,
  formatConversionIgnoredNotice,
  formatSavedLocationNotice
} from '@/utils/operation-feedback';

describe('operation feedback utilities', () => {
  it('formats compression summaries with before and after sizes', () => {
    expect(formatCompressionSummary(2048, 1024)).toBe('Image compressed: 2.0 KB -> 1.0 KB (50.0% reduction)');
  });

  it('describes the saved file location for single and multiple outputs', () => {
    expect(formatSavedLocationNotice(['notes/assets/image.webp'])).toBe('Saved image to notes/assets/image.webp');
    expect(formatSavedLocationNotice(['notes/assets/a.webp', 'notes/assets/b.webp'])).toBe('Saved 2 images to notes/assets');
  });

  it('formats conversion skip notices with the matched ignore rule', () => {
    expect(formatConversionIgnoredNotice('photo.png', '\\.png$')).toBe(
      'Skipped conversion for photo.png: matched ignore rule "\\.png$"'
    );
  });

  it('distinguishes ignored and failed auto-convert fallbacks', () => {
    expect(formatAutoConvertFallbackNotice(1, 0)).toBe(
      'Pasted 1 image(s) without conversion: matched conversion ignore rules'
    );
    expect(formatAutoConvertFallbackNotice(0, 2)).toBe(
      'Pasted 2 image(s) without conversion: failed to convert to the requested format'
    );
    expect(formatAutoConvertFallbackNotice(1, 2)).toBe(
      'Pasted 3 image(s) without conversion: 1 matched ignore rules, 2 failed to convert'
    );
  });
});
