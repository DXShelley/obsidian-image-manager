import { describe, expect, it } from 'vitest';
import {
  formatBatchCompressionSummary,
  formatCompressionSummary,
  formatSavedLocationNotice
} from '@/utils/operation-feedback';

describe('operation feedback utilities', () => {
  it('formats compression summaries with before and after sizes', () => {
    expect(formatCompressionSummary(2048, 1024)).toBe('Image compressed: 2.0 KB -> 1.0 KB (50.0% reduction)');
  });

  it('formats batch compression summaries with aggregate totals', () => {
    expect(formatBatchCompressionSummary(3, 4096, 2048)).toBe('Compressed 3 images: 4.0 KB -> 2.0 KB (50.0% reduction)');
  });

  it('describes the saved file location for single and multiple outputs', () => {
    expect(formatSavedLocationNotice(['notes/assets/image.webp'])).toBe('Saved image to notes/assets/image.webp');
    expect(formatSavedLocationNotice(['notes/assets/a.webp', 'notes/assets/b.webp'])).toBe('Saved 2 images to notes/assets');
  });
});
