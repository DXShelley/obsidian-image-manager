import { formatBytes } from '@/utils/operation-feedback';

export interface BatchLinkRewriteNoticeItem {
  readonly notePath: string;
  readonly replaced: number;
}

export interface BatchLinkRewriteNoticeOptions {
  readonly items: readonly BatchLinkRewriteNoticeItem[];
  readonly rewrittenLinks: number;
  readonly movedImages: number;
  readonly downloadedImages: number;
  readonly deletedImages: number;
  readonly deletedFolders: number;
  readonly failedCount: number;
}

export interface BatchCompressionNoticeOptions {
  readonly fileCount: number;
  readonly beforeBytes: number;
  readonly afterBytes: number;
  readonly showSpaceSaved: boolean;
}

export interface BatchConversionNoticeOptions {
  readonly imageCount: number;
  readonly targetFormat: string;
}

export interface BatchOrphanCleanupNoticeOptions {
  readonly deletedImages: number;
  readonly deletedFolders: number;
  readonly relocatedImages: number;
  readonly preservedImages: number;
  readonly failedCount: number;
}

export function formatBatchLinkRewriteNotice(options: BatchLinkRewriteNoticeOptions): string {
  const { items, rewrittenLinks, movedImages, downloadedImages, deletedImages, deletedFolders, failedCount } = options;
  if (items.length === 0) {
    if (deletedImages > 0) {
      const extras: string[] = [`deleted ${deletedImages} image(s)`];
      if (deletedFolders > 0) {
        extras.push(`removed ${deletedFolders} empty folder(s)`);
      }
      if (failedCount > 0) {
        extras.push(`${failedCount} failed`);
      }
      return `Batch link update finished: 0 file(s), 0 link(s) updated; ${extras.join(', ')}`;
    }
    return failedCount > 0 ? `Batch link update finished: 0 file(s) updated, ${failedCount} failed` : 'No image links needed updating';
  }

  const previews = items
    .slice(0, 3)
    .map((item) => `${item.notePath} (${item.replaced} link${item.replaced === 1 ? '' : 's'})`);
  if (items.length > 3) {
    previews.push(`+${items.length - 3} more`);
  }

  const extras: string[] = [];
  if (movedImages > 0) {
    extras.push(`moved ${movedImages} image(s)`);
  }
  if (downloadedImages > 0) {
    extras.push(`downloaded ${downloadedImages} image(s)`);
  }
  if (deletedImages > 0) {
    extras.push(`deleted ${deletedImages} image(s)`);
  }
  if (deletedFolders > 0) {
    extras.push(`removed ${deletedFolders} empty folder(s)`);
  }
  if (failedCount > 0) {
    extras.push(`${failedCount} failed`);
  }

  const suffix = extras.length > 0 ? `; ${extras.join(', ')}` : '';
  return `Batch link update finished: ${items.length} file(s), ${rewrittenLinks} link(s) updated: ${previews.join(', ')}${suffix}`;
}

export function formatBatchCompressionNotice(options: BatchCompressionNoticeOptions): string {
  const { fileCount, beforeBytes, afterBytes, showSpaceSaved } = options;
  if (fileCount === 0) {
    return 'No images required compression';
  }

  if (!showSpaceSaved) {
    return `Batch compression finished: ${fileCount} image(s)`;
  }

  const ratio = beforeBytes > 0 ? (Math.abs(beforeBytes - afterBytes) / beforeBytes) * 100 : 0;
  const direction = afterBytes <= beforeBytes ? 'reduction' : 'increase';
  return `Batch compression finished: ${fileCount} image(s), ${formatBytes(beforeBytes)} -> ${formatBytes(afterBytes)} (${ratio.toFixed(1)}% ${direction})`;
}

export function formatBatchConversionNotice(options: BatchConversionNoticeOptions): string {
  return `Batch conversion finished: ${options.imageCount} image(s) -> ${options.targetFormat}`;
}

export function formatBatchOrphanCleanupNotice(options: BatchOrphanCleanupNoticeOptions): string {
  const { deletedImages, deletedFolders, relocatedImages, preservedImages, failedCount } = options;
  if (deletedImages === 0 && relocatedImages === 0 && preservedImages === 0) {
    return failedCount > 0 ? `Extra image cleanup finished: 0 image(s) removed, ${failedCount} failed` : 'No extra image files found';
  }

  const segments: string[] = [];
  if (deletedImages > 0) {
    segments.push(`removed ${deletedImages} image(s)`);
  }
  if (relocatedImages > 0) {
    segments.push(`moved ${relocatedImages} image(s) to referenced note folder(s)`);
  }
  if (preservedImages > 0) {
    segments.push(`kept ${preservedImages} image(s) still referenced by other notes`);
  }
  if (deletedFolders > 0) {
    segments.push(`removed ${deletedFolders} empty folder(s)`);
  }
  if (failedCount > 0) {
    segments.push(`${failedCount} failed`);
  }
  return `Extra image cleanup finished: ${segments.join('; ')}`;
}
