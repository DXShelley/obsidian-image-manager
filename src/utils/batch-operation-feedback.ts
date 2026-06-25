import { getNoticeCopy } from '@/i18n';
import { DEFAULT_UI_LANGUAGE, type UiLanguage } from '@/types/index';
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

export interface BatchExternalImageImportNoticeItem {
  readonly notePath: string;
  readonly replaced: number;
}

export interface BatchExternalImageImportNoticeOptions {
  readonly items: readonly BatchExternalImageImportNoticeItem[];
  readonly importedLinks: number;
  readonly downloadedImages: number;
  readonly failedCount: number;
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
  readonly language?: UiLanguage;
}

function getNotices(language?: UiLanguage) {
  return getNoticeCopy(language ?? DEFAULT_UI_LANGUAGE);
}

export function formatBatchLinkRewriteNotice(options: BatchLinkRewriteNoticeOptions & { readonly language?: UiLanguage }): string {
  const notices = getNotices(options.language);
  const { items, rewrittenLinks, movedImages, downloadedImages, deletedImages, deletedFolders, failedCount } = options;
  if (items.length === 0) {
    if (deletedImages > 0) {
      return notices.batchLinkUpdateEmptyWithDeletes(deletedImages, deletedFolders, failedCount);
    }
    return failedCount > 0 ? notices.batchLinkUpdateEmptyFailed(failedCount) : notices.noImageLinksUpdated;
  }

  const previews = items.slice(0, 3).map((item) => notices.batchLinkPreviewItem(item.notePath, item.replaced));
  if (items.length > 3) {
    previews.push(notices.batchLinkMore(items.length - 3));
  }

  const extras: string[] = [];
  if (movedImages > 0) {
    extras.push(notices.batchLinkMoved(movedImages));
  }
  if (downloadedImages > 0) {
    extras.push(notices.batchLinkDownloaded(downloadedImages));
  }
  if (deletedImages > 0) {
    extras.push(notices.batchLinkDeleted(deletedImages));
  }
  if (deletedFolders > 0) {
    extras.push(notices.batchLinkRemovedFolders(deletedFolders));
  }
  if (failedCount > 0) {
    extras.push(notices.batchFailedCount(failedCount));
  }

  const suffix = extras.length > 0 ? `; ${extras.join(', ')}` : '';
  return notices.batchLinkUpdateFinished(items.length, rewrittenLinks, previews.join(', '), suffix);
}

export function formatBatchCompressionNotice(options: BatchCompressionNoticeOptions & { readonly language?: UiLanguage }): string {
  const notices = getNotices(options.language);
  const { fileCount, beforeBytes, afterBytes, showSpaceSaved } = options;
  if (fileCount === 0) {
    return notices.batchCompressionNone;
  }

  if (!showSpaceSaved) {
    return notices.batchCompressionFinished(fileCount);
  }

  const ratio = beforeBytes > 0 ? (Math.abs(beforeBytes - afterBytes) / beforeBytes) * 100 : 0;
  const direction = afterBytes <= beforeBytes ? notices.compressionDirectionReduction : notices.compressionDirectionIncrease;
  return notices.batchCompressionFinishedWithDelta(
    fileCount,
    formatBytes(beforeBytes),
    formatBytes(afterBytes),
    `${ratio.toFixed(1)}%`,
    direction
  );
}

export function formatBatchExternalImageImportNotice(
  options: BatchExternalImageImportNoticeOptions & { readonly language?: UiLanguage }
): string {
  const notices = getNotices(options.language);
  const { items, importedLinks, downloadedImages, failedCount } = options;
  if (items.length === 0) {
    if (failedCount > 0) {
      return notices.externalImportEmptyFailed(failedCount);
    }
    return notices.noExternalImageLinksFound;
  }

  const previews = items.slice(0, 3).map((item) => notices.batchLinkPreviewItem(item.notePath, item.replaced));
  if (items.length > 3) {
    previews.push(notices.batchLinkMore(items.length - 3));
  }

  const extras: string[] = [];
  if (downloadedImages > 0) {
    extras.push(notices.externalImportDownloaded(downloadedImages));
  }
  if (failedCount > 0) {
    extras.push(notices.batchFailedCount(failedCount));
  }

  const suffix = extras.length > 0 ? `; ${extras.join(', ')}` : '';
  return notices.externalImportFinished(items.length, importedLinks, previews.join(', '), suffix);
}

export function formatBatchConversionNotice(options: BatchConversionNoticeOptions & { readonly language?: UiLanguage }): string {
  return getNotices(options.language).batchConversionFinished(options.imageCount, options.targetFormat);
}

export function formatBatchOrphanCleanupNotice(options: BatchOrphanCleanupNoticeOptions): string {
  const notices = getNotices(options.language);
  const { deletedImages, deletedFolders, relocatedImages, preservedImages, failedCount } = options;
  if (deletedImages === 0 && relocatedImages === 0 && preservedImages === 0) {
    return failedCount > 0 ? notices.orphanCleanupEmptyFailed(failedCount) : notices.noExtraImagesFound;
  }

  const segments: string[] = [];
  if (deletedImages > 0) {
    segments.push(notices.orphanCleanupRemovedImages(deletedImages));
  }
  if (relocatedImages > 0) {
    segments.push(notices.orphanCleanupRelocatedImages(relocatedImages));
  }
  if (preservedImages > 0) {
    segments.push(notices.orphanCleanupPreservedImages(preservedImages));
  }
  if (deletedFolders > 0) {
    segments.push(notices.orphanCleanupRemovedFolders(deletedFolders));
  }
  if (failedCount > 0) {
    segments.push(notices.batchFailedCount(failedCount));
  }
  return notices.orphanCleanupFinished(segments.join('; '));
}
