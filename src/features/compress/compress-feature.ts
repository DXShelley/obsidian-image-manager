import { TFile } from 'obsidian';
import type { TFolder } from 'obsidian';
import type { ImageManagerFeature, ImageManagerFeatureContext } from '@/types/index';
import { executeLoggedCommand, logSkippedCommand } from '@/utils/command-logging';
import { formatCompressionSummary, showOperationNotice } from '@/utils/operation-feedback';
import { matchRegexIgnorePattern } from '@/utils/regex-ignore';

export class CompressFeature implements ImageManagerFeature {
  readonly id = 'compress';
  readonly name = 'Compression';
  readonly summary = 'Compress note or single image assets using the centralized image processor.';
  readonly state = 'implemented' as const;

  async register(context: ImageManagerFeatureContext): Promise<void> {
    const activeCommand = {
      commandId: 'compress-active-image',
      commandName: '当前文件：压缩图片'
    } as const;
    context.plugin.addCommand({
      id: activeCommand.commandId,
      name: activeCommand.commandName,
      callback: () => {
        void executeLoggedCommand(context, activeCommand, async () => {
          await this.withActiveImageFile(context, activeCommand, async (file) => {
            await this.compressImage(context, file);
          });
        });
      }
    });

    const folderCommand = {
      commandId: 'compress-current-folder-images',
      commandName: '当前文件夹：压缩图片'
    } as const;
    context.plugin.addCommand({
      id: folderCommand.commandId,
      name: folderCommand.commandName,
      callback: () => {
        void executeLoggedCommand(context, folderCommand, async () => {
          const folder = context.app.workspace.getActiveFile()?.parent;
          if (!folder) {
            logSkippedCommand(context, {
              ...folderCommand,
              reason: 'No active folder'
            });
            showOperationNotice(context.services.settings.getSettings(), 'No active folder');
            return;
          }

          await this.compressImagesInFolder(context, folder);
        });
      }
    });

    const vaultCommand = {
      commandId: 'compress-vault-images',
      commandName: '整个仓库：压缩图片'
    } as const;
    context.plugin.addCommand({
      id: vaultCommand.commandId,
      name: vaultCommand.commandName,
      callback: () => {
        void executeLoggedCommand(context, vaultCommand, async () => {
          await this.compressImagesInVault(context);
        });
      }
    });
  }

  async compressImagesInFolder(context: ImageManagerFeatureContext, folder: TFolder): Promise<void> {
    await this.compressFiles(context, context.services.fileManager.getImagesInFolder(folder));
  }

  async compressImagesInVault(context: ImageManagerFeatureContext): Promise<void> {
    await this.compressFiles(
      context,
      context.app.vault.getFiles().filter((file) => context.services.fileManager.isImageFile(file))
    );
  }

  private async compressFiles(context: ImageManagerFeatureContext, files: TFile[]): Promise<void> {
    let beforeTotal = 0;
    let afterTotal = 0;
    let compressedCount = 0;

    for (const file of files) {
      if (this.shouldSkipCompression(context, file)) {
        continue;
      }

      const before = file.stat.size;
      const buffer = await context.services.imageProcessor.compress(file);
      await context.services.fileManager.replaceFile(file, buffer);
      beforeTotal += before;
      afterTotal += buffer.byteLength;
      compressedCount += 1;
    }

    if (files.length === 0 || compressedCount === 0) {
      showOperationNotice(context.services.settings.getSettings(), 'No images found');
      return;
    }

    if (context.services.settings.getSettings().showSpaceSavedNotification) {
      showOperationNotice(context.services.settings.getSettings(), formatCompressionSummary(beforeTotal, afterTotal));
      return;
    }

    showOperationNotice(context.services.settings.getSettings(), `Compressed ${compressedCount} image(s)`);
  }

  async compressImage(context: ImageManagerFeatureContext, file: TFile): Promise<void> {
    if (this.shouldSkipCompression(context, file)) {
      showOperationNotice(context.services.settings.getSettings(), `Skipped compression for ${file.name}`);
      return;
    }

    const before = file.stat.size;
    const buffer = await context.services.imageProcessor.compress(file);
    const after = buffer.byteLength;
    await context.services.fileManager.replaceFile(file, buffer);
    if (context.services.settings.getSettings().showSpaceSavedNotification) {
      showOperationNotice(context.services.settings.getSettings(), formatCompressionSummary(before, after));
      return;
    }

    showOperationNotice(context.services.settings.getSettings(), 'Image compressed');
  }

  private async withActiveImageFile(
    context: ImageManagerFeatureContext,
    command: {
      commandId: string;
      commandName: string;
    },
    callback: (file: TFile) => Promise<void>
  ): Promise<void> {
    const file = context.app.workspace.getActiveFile();
    if (!(file instanceof TFile) || !context.services.fileManager.isImageFile(file)) {
      logSkippedCommand(context, {
        ...command,
        reason: 'No active image file'
      });
      showOperationNotice(context.services.settings.getSettings(), 'Open an image file first');
      return;
    }

    await callback(file);
  }

  private shouldSkipCompression(context: ImageManagerFeatureContext, file: TFile): boolean {
    const settings = context.services.settings.getSettings();
    const thresholdBytes = settings.compressionThresholdKB * 1024;
    if (thresholdBytes > 0 && file.stat.size < thresholdBytes) {
      context.services.logger.debug('Skipping compression because file is below threshold', {
        filePath: file.path,
        fileSize: file.stat.size,
        thresholdBytes
      });
      return true;
    }

    const ignored = matchRegexIgnorePattern(settings.compressionIgnorePattern, file.path);
    if (ignored) {
      context.services.logger.debug('Skipping compression because file matches ignore pattern', {
        filePath: file.path,
        pattern: ignored.source
      });
      return true;
    }

    return false;
  }
}
