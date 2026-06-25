import { TFile } from 'obsidian';
import type { Menu, TAbstractFile } from 'obsidian';
import { getNoticeCopy, getUiCopy } from '@/i18n';
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
    const inPlaceRestriction = context.services.imageProcessor.getInPlaceModificationRestriction(file);
    const ui = getUiCopy(context.services.settings.getSettings().uiLanguage);
    menu.addSeparator();
    menu.addItem((item) => {
      item.setTitle(ui.contextMenu.openInGallery).setIcon('images').onClick(() => {
        context.services.logger.refreshMode('context-menu-gallery');
        void this.openImageGallery(context, file);
      });
    });
    if (canWriteImageToClipboard()) {
      menu.addItem((item) => {
        item.setTitle(ui.contextMenu.copyImageToClipboard).setIcon('copy').onClick(() => {
          context.services.logger.refreshMode('context-menu-copy');
          void this.copyImageToClipboard(context, file);
        });
      });
    }
    menu.addItem((item) => {
      item.setTitle(ui.contextMenu.convertToDefaultFormat).setIcon('image').onClick(() => {
        context.services.logger.refreshMode('context-menu-convert');
        void context.services.recovery.runTransaction(
          {
            label: ui.transactions.contextConvertImage(file.name),
            trigger: 'context-menu',
            scope: 'single-file'
          },
          async () => {
            await this.convertImage(context, file, context.services.settings.getSettings().defaultFormat);
          }
        );
      });
    });
    if (inPlaceRestriction) {
      return;
    }
    menu.addItem((item) => {
      item.setTitle(ui.contextMenu.compressImage).setIcon('archive').onClick(() => {
        context.services.logger.refreshMode('context-menu-compress');
        void context.services.recovery.runTransaction(
          {
            label: ui.transactions.contextCompressImage(file.name),
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
      item.setTitle(ui.contextMenu.cropBySelection).setIcon('scissors').onClick(() => {
        context.services.logger.refreshMode('context-menu-crop');
        void this.cropImage(context, file);
      });
    });
    menu.addItem((item) => {
      item.setTitle(ui.contextMenu.rotateClockwise90).setIcon('rotate-cw').onClick(() => {
        context.services.logger.refreshMode('context-menu-rotate');
        void context.services.recovery.runTransaction(
          {
            label: ui.transactions.contextRotateImage(file.name),
            trigger: 'context-menu',
            scope: 'single-file'
          },
          async () => {
            await this.replaceImage(
              context,
              file,
              () => context.services.imageProcessor.rotate(file, 90),
              getNoticeCopy(context.services.settings.getSettings().uiLanguage).imageRotated
            );
          }
        );
      });
    });
    menu.addItem((item) => {
      item.setTitle(ui.contextMenu.rotateCounterClockwise90).setIcon('rotate-ccw').onClick(() => {
        context.services.logger.refreshMode('context-menu-rotate');
        void context.services.recovery.runTransaction(
          {
            label: ui.transactions.contextRotateImage(file.name),
            trigger: 'context-menu',
            scope: 'single-file'
          },
          async () => {
            await this.replaceImage(
              context,
              file,
              () => context.services.imageProcessor.rotate(file, 270),
              getNoticeCopy(context.services.settings.getSettings().uiLanguage).imageRotated
            );
          }
        );
      });
    });
    menu.addItem((item) => {
      item.setTitle(ui.contextMenu.flipHorizontal).setIcon('flip-horizontal').onClick(() => {
        context.services.logger.refreshMode('context-menu-flip');
        void context.services.recovery.runTransaction(
          {
            label: ui.transactions.contextFlipHorizontalImage(file.name),
            trigger: 'context-menu',
            scope: 'single-file'
          },
          async () => {
            await this.replaceImage(
              context,
              file,
              () => context.services.imageProcessor.flip(file, 'horizontal'),
              getNoticeCopy(context.services.settings.getSettings().uiLanguage).imageFlippedHorizontal
            );
          }
        );
      });
    });
    menu.addItem((item) => {
      item.setTitle(ui.contextMenu.flipVertical).setIcon('flip-vertical').onClick(() => {
        context.services.logger.refreshMode('context-menu-flip');
        void context.services.recovery.runTransaction(
          {
            label: ui.transactions.contextFlipVerticalImage(file.name),
            trigger: 'context-menu',
            scope: 'single-file'
          },
          async () => {
            await this.replaceImage(
              context,
              file,
              () => context.services.imageProcessor.flip(file, 'vertical'),
              getNoticeCopy(context.services.settings.getSettings().uiLanguage).imageFlippedVertical
            );
          }
        );
      });
    });
  }

  private async openImageGallery(context: ImageManagerFeatureContext, file: TFile): Promise<void> {
    const settings = context.services.settings.getSettings();
    if (!settings.enableGallery) {
      showOperationNotice(settings, getNoticeCopy(settings.uiLanguage).galleryDisabled);
      return;
    }

    await openSingleImageGallery(context, file, undefined, {
      lightboxCloseBehavior: 'close-modal'
    });
  }

  private async convertImage(context: ImageManagerFeatureContext, file: TFile, format: ImageFormat): Promise<void> {
    const settings = context.services.settings.getSettings();
    const notices = getNoticeCopy(settings.uiLanguage);
    context.services.logger.debug('Converting image from context menu', {
      filePath: file.path,
      targetFormat: format
    });
    const ignored = matchRegexIgnorePattern(settings.conversionIgnorePattern, file.path);
    if (ignored) {
      context.services.logger.debug('Skipping context menu conversion because file matches ignore pattern', {
        filePath: file.path,
        pattern: ignored.source
      });
      showOperationNotice(settings, formatConversionIgnoredNotice(file.name, ignored.source, settings));
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
    showOperationNotice(settings, notices.convertedToFormat(format));
  }

  private async cropImage(context: ImageManagerFeatureContext, file: TFile): Promise<void> {
    const ui = getUiCopy(context.services.settings.getSettings().uiLanguage);
    const selection = await this.pickSelection(context, file, {
      title: ui.contextMenu.cropDialogTitle(file.name),
      description: ui.contextMenu.cropDialogDescription,
      confirmLabel: ui.contextMenu.cropConfirm,
      emptySelectionNotice: getNoticeCopy(context.services.settings.getSettings().uiLanguage).selectAreaFirst
    });
    if (!selection) {
      return;
    }

    await context.services.recovery.runTransaction(
      {
        label: ui.transactions.contextCropImage(file.name),
        trigger: 'context-menu',
        scope: 'single-file'
      },
      async () => {
        await this.replaceImage(context, file, () => context.services.imageProcessor.crop(file, selection), getNoticeCopy(context.services.settings.getSettings().uiLanguage).imageCropped);
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
      showOperationNotice(settings, formatCompressionBelowThresholdNotice(file.name, settings));
      return;
    }

    const ignored = matchRegexIgnorePattern(settings.compressionIgnorePattern, file.path);
    if (ignored) {
      context.services.logger.debug('Skipping context menu compression because file matches ignore pattern', {
        filePath: file.path,
        pattern: ignored.source
      });
      showOperationNotice(settings, formatCompressionIgnoredNotice(file.name, ignored.source, settings));
      return;
    }

    const processedStatus = await context.services.compressionTracker.getCurrentStatus(file);
    if (processedStatus) {
      context.services.logger.debug('Skipping context menu compression because current file version was already processed', {
        filePath: file.path,
        status: processedStatus
      });
      showOperationNotice(settings, formatCompressionProcessedNotice(file.name, processedStatus, settings));
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
      showOperationNotice(settings, formatCompressionNoGainNotice(file.name, settings));
      return;
    }

    const modifiedAt = Date.now();
    await context.services.fileManager.replaceFile(file, buffer, file.path, modifiedAt);
    await context.services.compressionTracker.markCompressed(file.path, buffer.byteLength, modifiedAt);
    if (settings.showSpaceSavedNotification) {
      showOperationNotice(settings, formatCompressionSummary(before, buffer.byteLength, settings));
      return;
    }

    showOperationNotice(settings, getNoticeCopy(settings.uiLanguage).imageCompressed);
  }

  private async copyImageToClipboard(context: ImageManagerFeatureContext, file: TFile): Promise<void> {
    const settings = context.services.settings.getSettings();
    const notices = getNoticeCopy(settings.uiLanguage);
    if (!canWriteImageToClipboard()) {
      context.services.logger.warn('Clipboard image copy is unavailable on this platform', {
        filePath: file.path
      });
      showOperationNotice(settings, notices.copyImageUnavailable);
      return;
    }

    try {
      const mimeType = await writeImageFileToClipboard(context.app, context.services.imageProcessor, file);
      context.services.logger.debug('Copied image to clipboard', {
        filePath: file.path,
        mimeType
      });
      showOperationNotice(settings, notices.imageCopied);
    } catch (error) {
      context.services.logger.error('Failed to copy image to clipboard', error, {
        filePath: file.path
      });
      showOperationNotice(settings, notices.failedToCopyImage);
    }
  }

  private async pickSelection(
    context: ImageManagerFeatureContext,
    file: TFile,
    options: {
      readonly title: string;
      readonly description: string;
      readonly confirmLabel: string;
      readonly emptySelectionNotice: string;
    }
  ): Promise<ImageSelection | null> {
    return pickImageSelection(context.app, {
      file,
      title: options.title,
      description: options.description,
      confirmLabel: options.confirmLabel,
      emptySelectionNotice: options.emptySelectionNotice,
      ui: getUiCopy(context.services.settings.getSettings().uiLanguage).imageSelection
    });
  }
}
