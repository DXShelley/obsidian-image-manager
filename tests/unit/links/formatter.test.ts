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
});
