import type { App, TFile } from 'obsidian';
import { LinkFormat, MarkdownPathEncodingStrategy, type LinkFormatOptions, type ParsedLink, PathFormat } from '@/types/index';

const MARKDOWN_IMAGE_LINK_REGEX = /!\[([^\]]*)\]\(((?:<[^>]+>|[^)])+)\)/;

export class LinkFormatter {
  constructor(private readonly app: App) {}

  formatLink(imagePath: string, noteFile: TFile, options: LinkFormatOptions): string {
    const path = this.resolvePath(imagePath, noteFile, options.pathFormat);
    return options.format === LinkFormat.WIKI
      ? this.formatWikiLink(path, options)
      : this.formatMarkdownLink(path, options);
  }

  parseLink(link: string): ParsedLink | null {
    const wikiMatch = link.match(/!\[\[([^\]]+)\]\]/);
    if (wikiMatch?.[1]) {
      const [path = '', ...wikiParams] = wikiMatch[1].split('|');
      const sizeToken = [...wikiParams].reverse().find((part) => /^(\d+)(?:x(\d+))?$/.test(part));
      const sizeMatch = sizeToken?.match(/^(\d+)(?:x(\d+))?$/);
      return {
        path: this.decodePathSafely(path),
        rawPath: path,
        format: LinkFormat.WIKI,
        altText: wikiParams.find((part) => !/^(\d+)(?:x(\d+))?$/.test(part)),
        width: sizeMatch?.[1] ? Number.parseInt(sizeMatch[1], 10) : undefined,
        height: sizeMatch?.[2] ? Number.parseInt(sizeMatch[2], 10) : undefined,
        wikiParams
      };
    }

    const markdownMatch = link.match(MARKDOWN_IMAGE_LINK_REGEX);
    if (markdownMatch?.[2]) {
      const { path, title, wrapped } = this.parseMarkdownTarget(markdownMatch[2]);
      return {
        path: this.decodePathSafely(path),
        rawPath: path,
        format: LinkFormat.MARKDOWN,
        markdownPathPresentation: this.classifyMarkdownPathPresentation(path, wrapped),
        altText: markdownMatch[1] || undefined,
        title
      };
    }

    return null;
  }

  private resolvePath(imagePath: string, noteFile: TFile, pathFormat: PathFormat): string {
    if (pathFormat === PathFormat.ABSOLUTE) {
      return imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    }

    if (pathFormat === PathFormat.RELATIVE) {
      return this.getRelativePath(noteFile.path, imagePath);
    }

    const fileName = imagePath.split('/').pop() ?? imagePath;
    const files = this.app.vault.getFiles().filter((file) => file.name === fileName);
    return files.length === 1 ? fileName : imagePath;
  }

  private getRelativePath(fromPath: string, toPath: string): string {
    const fromParts = fromPath.split('/');
    const toParts = toPath.split('/');
    fromParts.pop();

    let commonIndex = 0;
    while (
      commonIndex < fromParts.length &&
      commonIndex < toParts.length &&
      fromParts[commonIndex] === toParts[commonIndex]
    ) {
      commonIndex += 1;
    }

    return [...new Array<string>(fromParts.length - commonIndex).fill('..'), ...toParts.slice(commonIndex)].join('/');
  }

  private formatWikiLink(path: string, options: LinkFormatOptions): string {
    const parts = [path];
    if (options.wikiParams && options.wikiParams.length > 0) {
      parts.push(...options.wikiParams);
      return `![[${parts.join('|')}]]`;
    }

    if (options.altText) {
      parts.push(options.altText);
    }
    if (options.width) {
      parts.push(options.height ? `${options.width}x${options.height}` : `${options.width}`);
    }

    return `![[${parts.join('|')}]]`;
  }

  private formatMarkdownLink(path: string, options: LinkFormatOptions): string {
    const title = options.title ? ` ${options.title}` : '';
    const presentation = options.markdownPathPresentation ?? this.strategyToPresentation(
      options.markdownPathEncodingStrategy ?? MarkdownPathEncodingStrategy.ENCODED
    );
    switch (presentation) {
      case 'wrapped':
        return `![${options.altText ?? ''}](${this.wrapMarkdownPath(path)}${title})`;
      case 'plain':
        return `![${options.altText ?? ''}](${path}${title})`;
      case 'auto':
        return `![${options.altText ?? ''}](${this.formatAutoMarkdownPath(path)}${title})`;
      case 'encoded':
      default:
        return `![${options.altText ?? ''}](${encodeURI(path)}${title})`;
    }
  }

  private parseMarkdownTarget(value: string): { path: string; title?: string; wrapped: boolean } {
    const trimmed = value.trim();
    if (!trimmed) {
      return { path: '', wrapped: false };
    }

    if (trimmed.startsWith('<')) {
      const closingIndex = trimmed.indexOf('>');
      if (closingIndex >= 0) {
        const path = trimmed.slice(1, closingIndex);
        const remainder = trimmed.slice(closingIndex + 1).trim();
        return {
          path,
          title: remainder || undefined,
          wrapped: true
        };
      }
    }

    const titleMatch = trimmed.match(/^(.*?)(\s+(".*?"|'.*?'|\(.*?\)))$/);
    if (titleMatch?.[1] && titleMatch[2]) {
      return {
        path: titleMatch[1].trim(),
        title: titleMatch[2].trim(),
        wrapped: false
      };
    }

    return { path: trimmed, wrapped: false };
  }

  private decodePathSafely(path: string): string {
    try {
      return decodeURI(path);
    } catch {
      return path;
    }
  }

  private formatAutoMarkdownPath(path: string): string {
    if (/^[A-Za-z0-9._/-]+$/.test(path)) {
      return path;
    }

    return this.wrapMarkdownPath(path);
  }

  private wrapMarkdownPath(path: string): string {
    return `<${path}>`;
  }

  private strategyToPresentation(strategy: MarkdownPathEncodingStrategy): 'encoded' | 'wrapped' | 'auto' {
    switch (strategy) {
      case MarkdownPathEncodingStrategy.READABLE:
        return 'wrapped';
      case MarkdownPathEncodingStrategy.AUTO:
        return 'auto';
      case MarkdownPathEncodingStrategy.ENCODED:
      default:
        return 'encoded';
    }
  }

  private classifyMarkdownPathPresentation(path: string, wrapped: boolean): 'encoded' | 'wrapped' | 'plain' {
    if (wrapped) {
      return 'wrapped';
    }

    return path !== this.decodePathSafely(path) ? 'encoded' : 'plain';
  }
}
