import type { App, TFile } from 'obsidian';
import { LinkFormat, type LinkFormatOptions, type ParsedLink, PathFormat } from '@/types/index';

export class LinkFormatter {
  constructor(private readonly app: App) {}

  formatLink(imagePath: string, noteFile: TFile, options: LinkFormatOptions): string {
    const path = this.resolvePath(imagePath, noteFile, options.pathFormat);
    return options.format === LinkFormat.WIKI
      ? this.formatWikiLink(path, options)
      : this.formatMarkdownLink(path, options);
  }

  parseLink(link: string): ParsedLink | null {
    const wikiMatch = link.match(/!\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/);
    if (wikiMatch?.[1]) {
      const params = wikiMatch[2];
      const sizeMatch = params?.match(/^(\d+)(?:x(\d+))?$/);
      return {
        path: wikiMatch[1],
        format: LinkFormat.WIKI,
        altText: params && !sizeMatch ? params : undefined,
        width: sizeMatch?.[1] ? Number.parseInt(sizeMatch[1], 10) : undefined,
        height: sizeMatch?.[2] ? Number.parseInt(sizeMatch[2], 10) : undefined
      };
    }

    const markdownMatch = link.match(/!\[([^\]]*)\]\(([^)]+)\)/);
    if (markdownMatch?.[2]) {
      return {
        path: decodeURI(markdownMatch[2]),
        format: LinkFormat.MARKDOWN,
        altText: markdownMatch[1] || undefined
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

    return [...Array(fromParts.length - commonIndex).fill('..'), ...toParts.slice(commonIndex)].join('/');
  }

  private formatWikiLink(path: string, options: LinkFormatOptions): string {
    const parts = [path];
    if (options.altText) {
      parts.push(options.altText);
    }
    if (options.width) {
      parts.push(options.height ? `${options.width}x${options.height}` : `${options.width}`);
    }
    return `![[${parts.join('|')}]]`;
  }

  private formatMarkdownLink(path: string, options: LinkFormatOptions): string {
    return `![${options.altText ?? ''}](${encodeURI(path)})`;
  }
}
