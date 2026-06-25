import { getNoticeCopy, getUiCopy } from '@/i18n';
import { Notice } from 'obsidian';
import { resolveUiLanguage, type ImageManagerSettings } from '@/types/index';
import type { CompressionRecordStatus } from '@/core/compression/compression-tracker';
import { getParentPath } from '@/utils/image-manager';

export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function formatCompressionSummary(
  before: number,
  after: number,
  settings: Pick<ImageManagerSettings, 'uiLanguage'>,
  label?: string
): string {
  const notices = getNoticeCopy(resolveUiLanguage(settings.uiLanguage));
  const ratio = before > 0 ? (Math.abs(before - after) / before) * 100 : 0;
  const direction = after <= before ? notices.compressionDirectionReduction : notices.compressionDirectionIncrease;
  return notices.compressionSummary(
    formatBytes(before),
    formatBytes(after),
    `${ratio.toFixed(1)}%`,
    direction,
    label ?? notices.imageCompressed
  );
}

export function formatSavedLocationNotice(paths: string[], settings: Pick<ImageManagerSettings, 'uiLanguage'>): string {
  const language = resolveUiLanguage(settings.uiLanguage);
  const notices = getNoticeCopy(language);
  const ui = getUiCopy(language);
  if (paths.length === 0) {
    return notices.noImagesSaved;
  }

  if (paths.length === 1) {
    return notices.savedSingleImage(paths[0] ?? '');
  }

  const folders = [...new Set(paths.map((path) => getParentPath(path) || ui.common.vaultRoot))];
  if (folders.length === 1) {
    return notices.savedImagesToFolder(paths.length, folders[0] ?? '');
  }

  return notices.savedImagesAcrossFolders(paths.length, folders.length);
}

export function formatConversionIgnoredNotice(
  fileName: string,
  pattern: string,
  settings: Pick<ImageManagerSettings, 'uiLanguage'>
): string {
  return getNoticeCopy(resolveUiLanguage(settings.uiLanguage)).conversionIgnored(fileName, pattern);
}

export function formatCompressionIgnoredNotice(
  fileName: string,
  pattern: string,
  settings: Pick<ImageManagerSettings, 'uiLanguage'>
): string {
  return getNoticeCopy(resolveUiLanguage(settings.uiLanguage)).compressionIgnored(fileName, pattern);
}

export function formatCompressionBelowThresholdNotice(
  fileName: string,
  settings: Pick<ImageManagerSettings, 'uiLanguage'>
): string {
  return getNoticeCopy(resolveUiLanguage(settings.uiLanguage)).compressionBelowThreshold(fileName);
}

export function formatCompressionProcessedNotice(
  fileName: string,
  status: CompressionRecordStatus,
  settings: Pick<ImageManagerSettings, 'uiLanguage'>
): string {
  const notices = getNoticeCopy(resolveUiLanguage(settings.uiLanguage));
  if (status === 'compressed') {
    return notices.compressionAlreadyProcessed(fileName);
  }

  return notices.compressionShouldNotRecompress(fileName);
}

export function formatCompressionNoGainNotice(fileName: string, settings: Pick<ImageManagerSettings, 'uiLanguage'>): string {
  return getNoticeCopy(resolveUiLanguage(settings.uiLanguage)).compressionNoGain(fileName);
}

export function formatAutoConvertFallbackNotice(
  ignoredCount: number,
  failedCount: number,
  settings: Pick<ImageManagerSettings, 'uiLanguage'>
): string {
  const notices = getNoticeCopy(resolveUiLanguage(settings.uiLanguage));
  const total = ignoredCount + failedCount;
  if (total === 0) {
    return notices.noAutoConvertFallback;
  }

  if (ignoredCount > 0 && failedCount > 0) {
    return notices.autoConvertFallbackMixed(total, ignoredCount, failedCount);
  }

  if (ignoredCount > 0) {
    return notices.autoConvertFallbackIgnored(ignoredCount);
  }

  return notices.autoConvertFallbackFailed(failedCount);
}

export function showOperationNotice(settings: ImageManagerSettings, message: string): void {
  if (!settings.showOperationNotifications) {
    return;
  }

  new Notice(message);
}
