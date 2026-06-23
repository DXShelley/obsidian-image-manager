import { Notice } from 'obsidian';
import type { ImageManagerSettings } from '@/types/index';
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

export function formatBatchCompressionSummary(fileCount: number, before: number, after: number): string {
  const ratio = before > 0 ? (Math.abs(before - after) / before) * 100 : 0;
  const direction = after <= before ? 'reduction' : 'increase';
  return `Compressed ${fileCount} image${fileCount === 1 ? '' : 's'}: ${formatBytes(before)} -> ${formatBytes(after)} (${ratio.toFixed(1)}% ${direction})`;
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

export function showOperationNotice(settings: ImageManagerSettings, message: string): void {
  if (!settings.showOperationNotifications) {
    return;
  }

  new Notice(message);
}
