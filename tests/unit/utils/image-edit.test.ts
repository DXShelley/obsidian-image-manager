import { describe, expect, it } from 'vitest';
import { normalizeImageSelection } from '@/utils/image-edit';

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

});
