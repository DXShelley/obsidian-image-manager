import { TFile } from 'obsidian';
import type { Menu, TAbstractFile } from 'obsidian';
import { openSingleImageGallery } from '@/features/gallery/gallery-actions';
import type { ImageManagerFeature, ImageManagerFeatureContext } from '@/types/index';
import type { ImageFormat, ImageSelection } from '@/types/index';
import { pickImageSelection } from '@/ui/modals/image-selection-modal';
import { writeImageFileToClipboard } from '@/utils/clipboard';
import { canWriteImageToClipboard } from '@/utils/compatibility';
import { getConvertedTargetPath } from '@/utils/image-manager';
import {
  formatCompressionBelowThresholdNotice,
  formatCompressionIgnoredNotice,
  formatCompressionNoGainNotice,
  formatCompressionProcessedNotice,
  formatCompressionSummary,
  formatConversionIgnoredNotice,
  showOperationNotice
} from '@/utils/operation-feedback';
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
    menu.addItem((item) => {
      item.setTitle('在画廊中打开').setIcon('images').onClick(() => {
        context.services.logger.refreshMode('context-menu-gallery');
        void this.openImageGallery(context, file);
      });
    });
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
        void context.services.recovery.runTransaction(
          {
            label: `右键压缩图片 ${file.name}`,
            trigger: 'context-menu',
            scope: 'single-file'
          },
          async () => {
            await this.compressImage(context, file);
          }
        );
      });
    });
    menu.addItem((item) => {
      item.setTitle('转换为默认格式').setIcon('image').onClick(() => {
        context.services.logger.refreshMode('context-menu-convert');
        void context.services.recovery.runTransaction(
          {
            label: `右键转换图片 ${file.name}`,
            trigger: 'context-menu',
            scope: 'single-file'
          },
          async () => {
            await this.convertImage(context, file, context.services.settings.getSettings().defaultFormat);
          }
        );
      });
    });
    menu.addItem((item) => {
      item.setTitle('拖拽裁剪').setIcon('scissors').onClick(() => {
        context.services.logger.refreshMode('context-menu-crop');
        void this.cropImage(context, file);
      });
    });
    menu.addItem((item) => {
      item.setTitle('框选去水印').setIcon('wand').onClick(() => {
        context.services.logger.refreshMode('context-menu-watermark');
        void this.removeWatermark(context, file);
      });
    });
    menu.addItem((item) => {
      item.setTitle('顺时针旋转 90°').setIcon('rotate-cw').onClick(() => {
        context.services.logger.refreshMode('context-menu-rotate');
        void context.services.recovery.runTransaction(
          {
            label: `右键旋转图片 ${file.name}`,
            trigger: 'context-menu',
            scope: 'single-file'
          },
          async () => {
            await this.replaceImage(context, file, () => context.services.imageProcessor.rotate(file, 90), 'Image rotated');
          }
        );
      });
    });
    menu.addItem((item) => {
      item.setTitle('水平翻转').setIcon('flip-horizontal').onClick(() => {
        context.services.logger.refreshMode('context-menu-flip');
        void context.services.recovery.runTransaction(
          {
            label: `右键水平翻转图片 ${file.name}`,
            trigger: 'context-menu',
            scope: 'single-file'
          },
          async () => {
            await this.replaceImage(context, file, () => context.services.imageProcessor.flip(file, 'horizontal'), 'Image flipped horizontally');
          }
        );
      });
    });
    menu.addItem((item) => {
      item.setTitle('垂直翻转').setIcon('flip-vertical').onClick(() => {
        context.services.logger.refreshMode('context-menu-flip');
        void context.services.recovery.runTransaction(
          {
            label: `右键垂直翻转图片 ${file.name}`,
            trigger: 'context-menu',
            scope: 'single-file'
          },
          async () => {
            await this.replaceImage(context, file, () => context.services.imageProcessor.flip(file, 'vertical'), 'Image flipped vertically');
          }
        );
      });
    });
  }

  private async openImageGallery(context: ImageManagerFeatureContext, file: TFile): Promise<void> {
    if (!context.services.settings.getSettings().enableGallery) {
      showOperationNotice(context.services.settings.getSettings(), 'Gallery is disabled in settings');
      return;
    }

    await openSingleImageGallery(context, file);
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
      showOperationNotice(
        context.services.settings.getSettings(),
        formatConversionIgnoredNotice(file.name, ignored.source)
      );
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

  private async cropImage(context: ImageManagerFeatureContext, file: TFile): Promise<void> {
    const selection = await this.pickSelection(context, file, {
      title: `裁剪图片：${file.name}`,
      description: '拖拽选择要保留的区域，确认后会按选区裁剪当前图片。',
      confirmLabel: '裁剪'
    });
    if (!selection) {
      return;
    }

    await context.services.recovery.runTransaction(
      {
        label: `右键裁剪图片 ${file.name}`,
        trigger: 'context-menu',
        scope: 'single-file'
      },
      async () => {
        await this.replaceImage(context, file, () => context.services.imageProcessor.crop(file, selection), 'Image cropped');
      }
    );
  }

  private async removeWatermark(context: ImageManagerFeatureContext, file: TFile): Promise<void> {
    const selection = await this.pickSelection(context, file, {
      title: `框选去水印：${file.name}`,
      description: '拖拽框出水印区域，确认后会使用周边像素对选区进行修补。',
      confirmLabel: '去水印'
    });
    if (!selection) {
      return;
    }

    await context.services.recovery.runTransaction(
      {
        label: `右键去水印 ${file.name}`,
        trigger: 'context-menu',
        scope: 'single-file'
      },
      async () => {
        await this.replaceImage(
          context,
          file,
          () => context.services.imageProcessor.removeWatermark(file, selection),
          'Watermark removed'
        );
      }
    );
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
    const settings = context.services.settings.getSettings();
    const thresholdBytes = settings.compressionThresholdKB * 1024;
    if (thresholdBytes > 0 && file.stat.size < thresholdBytes) {
      showOperationNotice(settings, formatCompressionBelowThresholdNotice(file.name));
      return;
    }

    const ignored = matchRegexIgnorePattern(settings.compressionIgnorePattern, file.path);
    if (ignored) {
      context.services.logger.debug('Skipping context menu compression because file matches ignore pattern', {
        filePath: file.path,
        pattern: ignored.source
      });
      showOperationNotice(settings, formatCompressionIgnoredNotice(file.name, ignored.source));
      return;
    }

    const processedStatus = await context.services.compressionTracker.getCurrentStatus(file);
    if (processedStatus) {
      context.services.logger.debug('Skipping context menu compression because current file version was already processed', {
        filePath: file.path,
        status: processedStatus
      });
      showOperationNotice(settings, formatCompressionProcessedNotice(file.name, processedStatus));
      return;
    }

    const before = file.stat.size;
    const buffer = await context.services.imageProcessor.compress(file);
    if (buffer.byteLength >= before) {
      context.services.logger.debug('Skipping context menu compression because encoded output is not smaller', {
        filePath: file.path,
        beforeBytes: before,
        afterBytes: buffer.byteLength
      });
      await context.services.compressionTracker.markNotBeneficial(file);
      showOperationNotice(settings, formatCompressionNoGainNotice(file.name));
      return;
    }

    const modifiedAt = Date.now();
    await context.services.fileManager.replaceFile(file, buffer, file.path, modifiedAt);
    await context.services.compressionTracker.markCompressed(file.path, buffer.byteLength, modifiedAt);
    if (settings.showSpaceSavedNotification) {
      showOperationNotice(settings, formatCompressionSummary(before, buffer.byteLength));
      return;
    }

    showOperationNotice(settings, 'Image compressed');
  }

  private async copyImageToClipboard(context: ImageManagerFeatureContext, file: TFile): Promise<void> {
    if (!canWriteImageToClipboard()) {
      context.services.logger.warn('Clipboard image copy is unavailable on this platform', {
        filePath: file.path
      });
      showOperationNotice(context.services.settings.getSettings(), 'Copy image is not available on this platform');
      return;
    }

    try {
      const mimeType = await writeImageFileToClipboard(context.app, context.services.imageProcessor, file);
      context.services.logger.debug('Copied image to clipboard', {
        filePath: file.path,
        mimeType
      });
      showOperationNotice(context.services.settings.getSettings(), 'Image copied');
    } catch (error) {
      context.services.logger.error('Failed to copy image to clipboard', error, {
        filePath: file.path
      });
      showOperationNotice(context.services.settings.getSettings(), 'Failed to copy image to clipboard');
    }
  }

  private async pickSelection(
    context: ImageManagerFeatureContext,
    file: TFile,
    options: {
      readonly title: string;
      readonly description: string;
      readonly confirmLabel: string;
    }
  ): Promise<ImageSelection | null> {
    return pickImageSelection(context.app, {
      file,
      title: options.title,
      description: options.description,
      confirmLabel: options.confirmLabel
    });
  }
}
