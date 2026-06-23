import { describe, expect, it } from 'vitest';
import { extractImageLinks } from '@/utils/image-links';

describe('extractImageLinks', () => {
  it('extracts wiki and markdown image links', () => {
    expect(
      extractImageLinks([
        '![[photo.png]]',
        '![[folder/image.webp|320]]',
        '![alt](assets/diagram.jpg)',
        '![caption](<assets/space image.png> "Title")'
      ].join('\n'))
    ).toEqual(['photo.png', 'folder/image.webp', 'assets/diagram.jpg', 'assets/space image.png']);
  });
});
