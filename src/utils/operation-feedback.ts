import { Notice } from 'obsidian';
import type { ImageManagerSettings } from '@/types/index';
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

export function formatCompressionSummary(before: number, after: number, label = 'Image compressed'): string {
  const ratio = before > 0 ? (Math.abs(before - after) / before) * 100 : 0;
  const direction = after <= before ? 'reduction' : 'increase';
  return `${label}: ${formatBytes(before)} -> ${formatBytes(after)} (${ratio.toFixed(1)}% ${direction})`;
}

export function formatSavedLocationNotice(paths: string[]): string {
  if (paths.length === 0) {
    return 'No images were saved';
  }

  if (paths.length === 1) {
    return `Saved image to ${paths[0]}`;
  }

  const folders = [...new Set(paths.map((path) => getParentPath(path) || 'vault root'))];
  if (folders.length === 1) {
    return `Saved ${paths.length} images to ${folders[0]}`;
  }

  return `Saved ${paths.length} images across ${folders.length} folders`;
}

export function formatConversionIgnoredNotice(fileName: string, pattern: string): string {
  return `Skipped conversion for ${fileName}: matched ignore rule "${pattern}"`;
}

export function formatCompressionIgnoredNotice(fileName: string, pattern: string): string {
  return `Skipped compression for ${fileName}: matched ignore rule "${pattern}"`;
}

export function formatCompressionBelowThresholdNotice(fileName: string): string {
  return `Skipped compression for ${fileName}: below size threshold`;
}

export function formatCompressionProcessedNotice(fileName: string, status: CompressionRecordStatus): string {
  if (status === 'compressed') {
    return `Skipped compression for ${fileName}: current file version was already compressed`;
  }

  return `Skipped compression for ${fileName}: current file version should not be recompressed`;
}

export function formatCompressionNoGainNotice(fileName: string): string {
  return `Skipped compression for ${fileName}: no smaller output was produced`;
}

export function formatAutoConvertFallbackNotice(ignoredCount: number, failedCount: number): string {
  const total = ignoredCount + failedCount;
  if (total === 0) {
    return 'No pasted images fell back to their original format';
  }

  if (ignoredCount > 0 && failedCount > 0) {
    return `Pasted ${total} image(s) without conversion: ${ignoredCount} matched ignore rules, ${failedCount} failed to convert`;
  }

  if (ignoredCount > 0) {
    return `Pasted ${ignoredCount} image(s) without conversion: matched conversion ignore rules`;
  }

  return `Pasted ${failedCount} image(s) without conversion: failed to convert to the requested format`;
}

export function showOperationNotice(settings: ImageManagerSettings, message: string): void {
  if (!settings.showOperationNotifications) {
    return;
  }

  new Notice(message);
}
