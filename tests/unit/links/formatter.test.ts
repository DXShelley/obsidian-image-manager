import { describe, expect, it } from 'vitest';
import { LinkFormatter } from '@/services/link-formatter';
import { LinkFormat, PathFormat } from '@/types/index';
import { mockApp, mockFile } from '../../helpers/test-setup';

describe('LinkFormatter', () => {
  it('formats wiki image links', () => {
    const formatter = new LinkFormatter(mockApp() as never);
    const link = formatter.formatLink('assets/image.png', mockFile() as never, {
      format: LinkFormat.WIKI,
      pathFormat: PathFormat.SHORTEST,
      width: 320
    });

    expect(link).toBe('![[assets/image.png|320]]');
  });

  it('formats markdown image links', () => {
    const formatter = new LinkFormatter(mockApp() as never);
    const link = formatter.formatLink('assets/image.png', mockFile() as never, {
      format: LinkFormat.MARKDOWN,
      pathFormat: PathFormat.RELATIVE,
      altText: 'Preview'
    });

    expect(link).toBe('![Preview](../assets/image.png)');
  });

  it('parses markdown image links with titles', () => {
    const formatter = new LinkFormatter(mockApp() as never);

    expect(formatter.parseLink('![Preview](<assets/my image.png> "Caption")')).toEqual({
      path: 'assets/my image.png',
      format: LinkFormat.MARKDOWN,
      altText: 'Preview',
      title: '"Caption"'
    });
  });

  it('preserves wiki params when reformatting existing wiki links', () => {
    const formatter = new LinkFormatter(mockApp() as never);
    const parsed = formatter.parseLink('![[assets/image.png|封面|320x200]]');

    const link = formatter.formatLink('assets/image.png', mockFile() as never, {
      format: LinkFormat.WIKI,
      pathFormat: PathFormat.SHORTEST,
      wikiParams: parsed?.wikiParams
    });

    expect(link).toBe('![[assets/image.png|封面|320x200]]');
  });
});
