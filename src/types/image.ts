import type { ImageFormat, LinkFormat, MarkdownPathEncodingStrategy, PathFormat } from './settings';

export interface VariableContext {
  readonly noteName: string;
  readonly noteFileName: string;
  readonly fileName: string;
  readonly date: string;
  readonly time: string;
  readonly random: string;
  readonly [key: string]: string;
}

export interface ImageInfo {
  readonly path: string;
  readonly name: string;
  readonly extension: string;
  readonly size: number;
  readonly mtime: number;
  readonly resourcePath?: string;
  readonly width?: number;
  readonly height?: number;
}

export interface ProcessOptions {
  readonly format?: ImageFormat;
  readonly quality?: number;
  readonly maxWidth?: number;
  readonly maxHeight?: number;
}

export interface RenameMoveResult {
  readonly oldPath: string;
  readonly newPath: string;
}

export interface LinkFormatOptions {
  readonly format: LinkFormat;
  readonly pathFormat: PathFormat;
  readonly markdownPathEncodingStrategy?: MarkdownPathEncodingStrategy;
  readonly markdownPathPresentation?: 'encoded' | 'wrapped' | 'plain' | 'auto';
  readonly altText?: string;
  readonly width?: number;
  readonly height?: number;
  readonly title?: string;
  readonly wikiParams?: readonly string[];
}

export interface ParsedLink {
  readonly path: string;
  readonly rawPath: string;
  readonly format: LinkFormat;
  readonly markdownPathPresentation?: 'encoded' | 'wrapped' | 'plain';
  readonly altText?: string;
  readonly width?: number;
  readonly height?: number;
  readonly title?: string;
  readonly wikiParams?: readonly string[];
}
