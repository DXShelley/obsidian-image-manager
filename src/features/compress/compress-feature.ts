import { MarkdownView, TFile } from 'obsidian';
import type { TFolder } from 'obsidian';
import { getDefaultCommandName, getNoticeCopy, getUiCopy } from '@/i18n';
import type { ImageManagerFeature, ImageManagerFeatureContext } from '@/types/index';
import { formatBatchCompressionNotice } from '@/utils/batch-operation-feedback';
import { executeLoggedCommand, logSkippedCommand } from '@/utils/command-logging';
import {
  formatCompressionBelowThresholdNotice,
  formatCompressionIgnoredNotice,
  formatCompressionNoGainNotice,
  formatCompressionProcessedNotice,
  formatCompressionSummary,
  showOperationNotice
} from '@/utils/operation-feedback';
import { matchRegexIgnorePattern } from '@/utils/regex-ignore';
import { confirmVaultScopeOperation } from '@/utils/vault-operation';

interface CompressionSkipState {
  readonly message: string;
}

export class CompressFeature implements ImageManagerFeature {
  readonly id = 'compress';
  readonly name = 'Compression';
  readonly summary = 'Compress note or single image assets using the centralized image processor.';
  readonly state = 'implemented' as const;

  async register(context: ImageManagerFeatureContext): Promise<void> {
    const activeCommand = {
      commandId: 'a4-compress-active-image',
      commandName: getDefaultCommandName('a4-compress-active-image')
    } as const;
    context.plugin.addCommand({
      id: activeCommand.commandId,
      name: activeCommand.commandName,
      callback: () => {
        void executeLoggedCommand(context, activeCommand, async () => {
          await context.services.recovery.runTransaction(
            {
              label: getUiCopy(context.services.settings.getSettings().uiLanguage).transactions.compressCurrentNoteImages,
              trigger: 'compress',
              scope: 'single-note'
            },
            async () => {
              await this.withActiveNoteFile(context, activeCommand, async (file) => {
                await this.compressImagesInNote(context, file);
              });
            }
          );
        });
      }
    });

    const folderCommand = {
      commandId: 'b4-compress-current-folder-images',
      commandName: getDefaultCommandName('b4-compress-current-folder-images')
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
            const settings = context.services.settings.getSettings();
            showOperationNotice(settings, getNoticeCopy(settings.uiLanguage).noActiveFolder);
            return;
          }

          await context.services.recovery.runTransaction(
            {
              label: getUiCopy(context.services.settings.getSettings().uiLanguage).transactions.compressFolderImages(
                folder.path || getUiCopy(context.services.settings.getSettings().uiLanguage).common.vaultRoot
              ),
              trigger: 'compress',
              scope: 'folder'
            },
            async () => {
              await this.compressImagesInFolder(context, folder);
            }
          );
        });
      }
    });

    const vaultCommand = {
      commandId: 'c4-compress-vault-images',
      commandName: getDefaultCommandName('c4-compress-vault-images')
    } as const;
    context.plugin.addCommand({
      id: vaultCommand.commandId,
      name: vaultCommand.commandName,
      callback: () => {
        void executeLoggedCommand(context, vaultCommand, async () => {
          const ui = getUiCopy(context.services.settings.getSettings().uiLanguage);
          if (!(await confirmVaultScopeOperation(context.app, context.services.settings.getSettings().uiLanguage, ui.vaultOperation.actionNames.compression))) {
            return;
          }

          await context.services.recovery.runTransaction(
            {
              label: ui.transactions.compressVaultImages,
              trigger: 'compress',
              scope: 'vault'
            },
            async () => {
              await this.compressImagesInVault(context);
            }
          );
        });
      }
    });
  }

  async compressImagesInFolder(context: ImageManagerFeatureContext, folder: TFolder): Promise<void> {
    await this.compressFiles(context, context.services.fileManager.getImagesInFolder(folder));
  }

  async compressImagesInNote(context: ImageManagerFeatureContext, noteFile: TFile): Promise<void> {
    await this.compressFiles(context, await context.services.fileManager.getImagesInNote(noteFile));
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

    const runWithDeferredLeafRefresh =
      typeof context.services.fileManager.runWithDeferredLeafRefresh === 'function'
        ? context.services.fileManager.runWithDeferredLeafRefresh.bind(context.services.fileManager)
        : async <T>(operation: () => Promise<T>) => operation();
    await runWithDeferredLeafRefresh(async () => {
      for (const file of files) {
        const skipped = await this.getCompressionSkipState(context, file);
        if (skipped) {
          continue;
        }

        const result = await this.compressAndReplace(context, file);
        if (!result) {
          continue;
        }

        beforeTotal += result.before;
        afterTotal += result.after;
        compressedCount += 1;
      }
    });

    showOperationNotice(
      context.services.settings.getSettings(),
      formatBatchCompressionNotice({
        fileCount: compressedCount,
        beforeBytes: beforeTotal,
        afterBytes: afterTotal,
        showSpaceSaved: context.services.settings.getSettings().showSpaceSavedNotification,
        language: context.services.settings.getSettings().uiLanguage
      })
    );
  }

  async compressImage(context: ImageManagerFeatureContext, file: TFile): Promise<void> {
    const skipped = await this.getCompressionSkipState(context, file);
    if (skipped) {
      showOperationNotice(context.services.settings.getSettings(), skipped.message);
      return;
    }

    const result = await this.compressAndReplace(context, file);
    if (!result) {
      const settings = context.services.settings.getSettings();
      showOperationNotice(settings, formatCompressionNoGainNotice(file.name, settings));
      return;
    }

    const settings = context.services.settings.getSettings();
    if (settings.showSpaceSavedNotification) {
      showOperationNotice(settings, formatCompressionSummary(result.before, result.after, settings));
      return;
    }

    showOperationNotice(settings, getNoticeCopy(settings.uiLanguage).imageCompressed);
  }

  private async withActiveNoteFile(
    context: ImageManagerFeatureContext,
    command: {
      commandId: string;
      commandName: string;
    },
    callback: (file: TFile) => Promise<void>
  ): Promise<void> {
    const view = context.app.workspace.getActiveViewOfType(MarkdownView);
    const file = view?.file;
    if (!(file instanceof TFile) || file.extension.toLowerCase() !== 'md') {
      logSkippedCommand(context, {
        ...command,
        reason: 'No active note file'
      });
      const settings = context.services.settings.getSettings();
      showOperationNotice(settings, getNoticeCopy(settings.uiLanguage).noActiveNoteFile);
      return;
    }

    await callback(file);
  }

  private async getCompressionSkipState(
    context: ImageManagerFeatureContext,
    file: TFile
  ): Promise<CompressionSkipState | null> {
    const settings = context.services.settings.getSettings();
    const restriction = context.services.imageProcessor.getInPlaceModificationRestriction(file);
    if (restriction) {
      context.services.logger.debug('Skipping compression because the format requires conversion before in-place edits', {
        filePath: file.path,
        reason: restriction
      });
      return {
        message: restriction
      };
    }
    const thresholdBytes = settings.compressionThresholdKB * 1024;
    if (thresholdBytes > 0 && file.stat.size < thresholdBytes) {
      context.services.logger.debug('Skipping compression because file is below threshold', {
        filePath: file.path,
        fileSize: file.stat.size,
        thresholdBytes
      });
      return {
        message: formatCompressionBelowThresholdNotice(file.name, settings)
      };
    }

    const ignored = matchRegexIgnorePattern(settings.compressionIgnorePattern, file.path);
    if (ignored) {
      context.services.logger.debug('Skipping compression because file matches ignore pattern', {
        filePath: file.path,
        pattern: ignored.source
      });
      return {
        message: formatCompressionIgnoredNotice(file.name, ignored.source, settings)
      };
    }

    const processedStatus = await context.services.compressionTracker.getCurrentStatus(file);
    if (processedStatus) {
      context.services.logger.debug('Skipping compression because current file version was already processed', {
        filePath: file.path,
        status: processedStatus
      });
      return {
        message: formatCompressionProcessedNotice(file.name, processedStatus, settings)
      };
    }

    return null;
  }

  private async compressAndReplace(
    context: ImageManagerFeatureContext,
    file: TFile
  ): Promise<{
    before: number;
    after: number;
  } | null> {
    const before = file.stat.size;
    const buffer = await context.services.imageProcessor.compress(file);
    const after = buffer.byteLength;
    if (after >= before) {
      context.services.logger.debug('Skipping compression because encoded output is not smaller', {
        filePath: file.path,
        beforeBytes: before,
        afterBytes: after
      });
      await context.services.compressionTracker.markNotBeneficial(file);
      return null;
    }

    const modifiedAt = Date.now();
    await context.services.fileManager.replaceFile(file, buffer, file.path, modifiedAt);
    await context.services.compressionTracker.markCompressed(file.path, after, modifiedAt);
    return {
      before,
      after
    };
  }
}
