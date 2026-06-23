import { TFile } from 'obsidian';
import type { Menu, TAbstractFile } from 'obsidian';
import type { ImageManagerFeature, ImageManagerFeatureContext } from '@/types/index';
import type { ImageFormat } from '@/types/index';
import { canWriteImageToClipboard } from '@/utils/compatibility';
import { getConvertedTargetPath } from '@/utils/image-manager';
import { formatCompressionSummary, showOperationNotice } from '@/utils/operation-feedback';
import { matchRegexIgnorePattern } from '@/utils/regex-ignore';

export class ContextMenuFeature implements ImageManagerFeature {
  readonly id = 'context-menu';
  readonly name = 'Context Menu';
  readonly summary = 'Expose image actions from the Obsidian file menu.';
  readonly state = 'implemented' as const;

  async register(context: ImageManagerFeatureContext): Promise<void> {
    context.plugin.registerEvent(
      context.app.workspace.on('file-menu', (menu: Menu, file: TAbstractFile) => {
        if (!context.services.settings.getSettings().enableContextMenu || !(file instanceof TFile) || !context.services.fileManager.isImageFile(file)) {
          return;
        }

        this.addImageMenuItems(context, menu, file);
      })
    );
  }

  private addImageMenuItems(context: ImageManagerFeatureContext, menu: Menu, file: TFile): void {
    menu.addSeparator();
    if (canWriteImageToClipboard()) {
      menu.addItem((item) => {
        item.setTitle('复制图片到剪贴板').setIcon('copy').onClick(() => {
          context.services.logger.refreshMode('context-menu-copy');
          void this.copyImageToClipboard(context, file);
        });
      });
    }
    menu.addItem((item) => {
      item.setTitle('压缩图片').setIcon('archive').onClick(() => {
        context.services.logger.refreshMode('context-menu-compress');
        void this.compressImage(context, file);
      });
    });
    menu.addItem((item) => {
      item.setTitle('转换为默认格式').setIcon('image').onClick(() => {
        context.services.logger.refreshMode('context-menu-convert');
        void this.convertImage(context, file, context.services.settings.getSettings().defaultFormat);
      });
    });
    menu.addItem((item) => {
      item.setTitle('顺时针旋转 90°').setIcon('rotate-cw').onClick(() => {
        context.services.logger.refreshMode('context-menu-rotate');
        void this.replaceImage(context, file, () => context.services.imageProcessor.rotate(file, 90), 'Image rotated');
      });
    });
    menu.addItem((item) => {
      item.setTitle('水平翻转').setIcon('flip-horizontal').onClick(() => {
        context.services.logger.refreshMode('context-menu-flip');
        void this.replaceImage(context, file, () => context.services.imageProcessor.flip(file, 'horizontal'), 'Image flipped horizontally');
      });
    });
    menu.addItem((item) => {
      item.setTitle('垂直翻转').setIcon('flip-vertical').onClick(() => {
        context.services.logger.refreshMode('context-menu-flip');
        void this.replaceImage(context, file, () => context.services.imageProcessor.flip(file, 'vertical'), 'Image flipped vertically');
      });
    });
  }

  private async convertImage(context: ImageManagerFeatureContext, file: TFile, format: ImageFormat): Promise<void> {
    context.services.logger.debug('Converting image from context menu', {
      filePath: file.path,
      targetFormat: format
    });
    const ignored = matchRegexIgnorePattern(context.services.settings.getSettings().conversionIgnorePattern, file.path);
    if (ignored) {
      context.services.logger.debug('Skipping context menu conversion because file matches ignore pattern', {
        filePath: file.path,
        pattern: ignored.source
      });
      showOperationNotice(context.services.settings.getSettings(), `Skipped conversion for ${file.name}`);
      return;
    }

    const buffer = await context.services.imageProcessor.convert(file, format);
    const targetPath = getConvertedTargetPath(
      file.path,
      format,
      (candidate) => context.app.vault.getAbstractFileByPath(candidate) !== null
    );
    await context.services.fileManager.replaceFile(file, buffer, targetPath);
    context.services.logger.debug('Completed context menu conversion', {
      filePath: file.path,
      targetPath
    });
    showOperationNotice(context.services.settings.getSettings(), `Converted to ${format}`);
  }

  private async replaceImage(
    context: ImageManagerFeatureContext,
    file: TFile,
    processor: () => Promise<ArrayBuffer>,
    message: string
  ): Promise<void> {
    context.services.logger.debug('Applying context menu image operation', {
      filePath: file.path,
      message
    });
    const buffer = await processor();
    await context.services.fileManager.replaceFile(file, buffer);
    context.services.logger.debug('Completed context menu image operation', {
      filePath: file.path,
      message
    });
    showOperationNotice(context.services.settings.getSettings(), message);
  }

  private async compressImage(context: ImageManagerFeatureContext, file: TFile): Promise<void> {
    const thresholdBytes = context.services.settings.getSettings().compressionThresholdKB * 1024;
    if (thresholdBytes > 0 && file.stat.size < thresholdBytes) {
      showOperationNotice(context.services.settings.getSettings(), `Skipped compression for ${file.name}`);
      return;
    }

    const ignored = matchRegexIgnorePattern(context.services.settings.getSettings().compressionIgnorePattern, file.path);
    if (ignored) {
      context.services.logger.debug('Skipping context menu compression because file matches ignore pattern', {
        filePath: file.path,
        pattern: ignored.source
      });
      showOperationNotice(context.services.settings.getSettings(), `Skipped compression for ${file.name}`);
      return;
    }

    const before = file.stat.size;
    const buffer = await context.services.imageProcessor.compress(file);
    await context.services.fileManager.replaceFile(file, buffer);
    if (context.services.settings.getSettings().showSpaceSavedNotification) {
      showOperationNotice(context.services.settings.getSettings(), formatCompressionSummary(before, buffer.byteLength));
      return;
    }

    showOperationNotice(context.services.settings.getSettings(), 'Image compressed');
  }

  private async copyImageToClipboard(context: ImageManagerFeatureContext, file: TFile): Promise<void> {
    if (!canWriteImageToClipboard()) {
      context.services.logger.warn('Clipboard image copy is unavailable on this platform', {
        filePath: file.path
      });
      showOperationNotice(context.services.settings.getSettings(), 'Copy image is not available on this platform');
      return;
    }

    const buffer = await context.app.vault.readBinary(file);
    const blob = new Blob([buffer], { type: `image/${file.extension}` });
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    context.services.logger.debug('Copied image to clipboard', {
      filePath: file.path,
      mimeType: blob.type
    });
    showOperationNotice(context.services.settings.getSettings(), 'Image copied');
  }
}
