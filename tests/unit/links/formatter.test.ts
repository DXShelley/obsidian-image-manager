import { describe, expect, it } from 'vitest';
import { LinkFormatter } from '@/services/link-formatter';
import { LinkFormat, MarkdownPathEncodingStrategy, PathFormat } from '@/types/index';
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

  it('formats readable markdown image links without URL encoding', () => {
    const formatter = new LinkFormatter(mockApp() as never);
    const link = formatter.formatLink('assets/扯皮留痕/图片 01.png', mockFile() as never, {
      format: LinkFormat.MARKDOWN,
      pathFormat: PathFormat.SHORTEST,
      markdownPathEncodingStrategy: MarkdownPathEncodingStrategy.READABLE,
      altText: '预览'
    });

    expect(link).toBe('![预览](<assets/扯皮留痕/图片 01.png>)');
  });

  it('formats auto markdown image links with raw readable paths when needed', () => {
    const formatter = new LinkFormatter(mockApp() as never);
    const link = formatter.formatLink('assets/扯皮留痕/图片(01).png', mockFile() as never, {
      format: LinkFormat.MARKDOWN,
      pathFormat: PathFormat.SHORTEST,
      markdownPathEncodingStrategy: MarkdownPathEncodingStrategy.AUTO,
      altText: '预览'
    });

    expect(link).toBe('![预览](<assets/扯皮留痕/图片(01).png>)');
  });

  it('parses markdown image links with titles', () => {
    const formatter = new LinkFormatter(mockApp() as never);

    expect(formatter.parseLink('![Preview](<assets/my image.png> "Caption")')).toEqual({
      path: 'assets/my image.png',
      rawPath: 'assets/my image.png',
      format: LinkFormat.MARKDOWN,
      markdownPathPresentation: 'wrapped',
      altText: 'Preview',
      title: '"Caption"'
    });
  });

  it('preserves raw markdown paths while exposing a decoded path for resolution', () => {
    const formatter = new LinkFormatter(mockApp() as never);

    expect(formatter.parseLink('![Preview](assets/%E6%89%AF%E7%9A%AE.png)')).toEqual({
      path: 'assets/扯皮.png',
      rawPath: 'assets/%E6%89%AF%E7%9A%AE.png',
      format: LinkFormat.MARKDOWN,
      markdownPathPresentation: 'encoded',
      altText: 'Preview'
    });
  });

  it('parses plain markdown paths as plain presentation', () => {
    const formatter = new LinkFormatter(mockApp() as never);

    expect(formatter.parseLink('![Preview](assets/扯皮留痕/test.png)')).toEqual({
      path: 'assets/扯皮留痕/test.png',
      rawPath: 'assets/扯皮留痕/test.png',
      format: LinkFormat.MARKDOWN,
      markdownPathPresentation: 'plain',
      altText: 'Preview'
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
