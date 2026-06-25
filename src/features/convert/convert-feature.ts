import { MarkdownView, TFile } from 'obsidian';
import type { TFolder } from 'obsidian';
import type { ImageManagerFeature, ImageManagerFeatureContext } from '@/types/index';
import type { ImageFormat } from '@/types/index';
import { formatBatchConversionNotice } from '@/utils/batch-operation-feedback';
import { executeLoggedCommand, logSkippedCommand } from '@/utils/command-logging';
import { formatConversionIgnoredNotice, showOperationNotice } from '@/utils/operation-feedback';
import { getConvertedTargetPath } from '@/utils/image-manager';
import { matchRegexIgnorePattern, type RegexIgnoreMatch } from '@/utils/regex-ignore';
import { confirmVaultScopeOperation } from '@/utils/vault-operation';

export class ConvertFeature implements ImageManagerFeature {
  readonly id = 'convert';
  readonly name = 'Format Conversion';
  readonly summary = 'Convert active image files into the configured output format.';
  readonly state = 'implemented' as const;

  async register(context: ImageManagerFeatureContext): Promise<void> {
    const activeCommand = {
      commandId: 'a3-convert-active-image-to-default-format',
      commandName: '转换图片为默认格式'
    } as const;
    context.plugin.addCommand({
      id: activeCommand.commandId,
      name: activeCommand.commandName,
      callback: () => {
        void executeLoggedCommand(context, activeCommand, async () => {
          await context.services.recovery.runTransaction(
            {
              label: '转换当前文件引用图片',
              trigger: 'convert',
              scope: 'single-note'
            },
            async () => {
              await this.withActiveNoteFile(context, activeCommand, async (file) => {
                await this.convertImagesInNote(context, file, context.services.settings.getSettings().defaultFormat);
              });
            }
          );
        });
      }
    });

    const folderCommand = {
      commandId: 'b3-convert-current-folder-images-to-default-format',
      commandName: '转换图片为默认格式'
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

          await context.services.recovery.runTransaction(
            {
              label: `转换文件夹图片 ${folder.path || 'vault root'}`,
              trigger: 'convert',
              scope: 'folder'
            },
            async () => {
              await this.convertImagesInFolder(context, folder, context.services.settings.getSettings().defaultFormat);
            }
          );
        });
      }
    });

    const vaultCommand = {
      commandId: 'c3-convert-vault-images-to-default-format',
      commandName: '转换图片为默认格式'
    } as const;
    context.plugin.addCommand({
      id: vaultCommand.commandId,
      name: vaultCommand.commandName,
      callback: () => {
        void executeLoggedCommand(context, vaultCommand, async () => {
          if (!(await confirmVaultScopeOperation(context.app, '整库格式转换'))) {
            return;
          }

          await context.services.recovery.runTransaction(
            {
              label: '转换整个仓库图片',
              trigger: 'convert',
              scope: 'vault'
            },
            async () => {
              await this.convertImagesInVault(context, context.services.settings.getSettings().defaultFormat);
            }
          );
        });
      }
    });
  }

  async convertImage(
    context: ImageManagerFeatureContext,
    file: TFile,
    format: ImageFormat,
    options: {
      notify?: boolean;
      notifySkip?: boolean;
    } = {}
  ): Promise<TFile> {
    const ignored = this.getConversionIgnoreMatch(context, file);
    if (ignored) {
      this.logConversionIgnored(context, file, ignored);
      if (options.notifySkip !== false) {
        showOperationNotice(
          context.services.settings.getSettings(),
          formatConversionIgnoredNotice(file.name, ignored.source)
        );
      }
      return file;
    }

    const buffer = await context.services.imageProcessor.convert(file, format);
    const targetPath = getConvertedTargetPath(
      file.path,
      format,
      (candidate) => context.app.vault.getAbstractFileByPath(candidate) !== null
    );
    const created = await context.services.fileManager.replaceFile(file, buffer, targetPath);
    if (options.notify !== false) {
      showOperationNotice(context.services.settings.getSettings(), `Converted to ${format}`);
    }
    return created;
  }

  async convertImagesInFolder(context: ImageManagerFeatureContext, folder: TFolder, format: ImageFormat): Promise<void> {
    await this.convertFiles(context, context.services.fileManager.getImagesInFolder(folder), format);
  }

  async convertImagesInNote(context: ImageManagerFeatureContext, noteFile: TFile, format: ImageFormat): Promise<void> {
    await this.convertFiles(context, await context.services.fileManager.getImagesInNote(noteFile), format);
  }

  async convertImagesInVault(context: ImageManagerFeatureContext, format: ImageFormat): Promise<void> {
    await this.convertFiles(
      context,
      context.app.vault.getFiles().filter((file) => context.services.fileManager.isImageFile(file)),
      format
    );
  }

  private async convertFiles(context: ImageManagerFeatureContext, files: TFile[], format: ImageFormat): Promise<void> {
    let convertedCount = 0;
    const runWithDeferredLeafRefresh =
      typeof context.services.fileManager.runWithDeferredLeafRefresh === 'function'
        ? context.services.fileManager.runWithDeferredLeafRefresh.bind(context.services.fileManager)
        : async <T>(operation: () => Promise<T>) => operation();
    await runWithDeferredLeafRefresh(async () => {
      for (const file of files) {
        const ignored = this.getConversionIgnoreMatch(context, file);
        if (ignored) {
          this.logConversionIgnored(context, file, ignored);
          continue;
        }

        await this.convertImage(context, file, format, { notify: false, notifySkip: false });
        convertedCount += 1;
      }
    });

    if (files.length === 0 || convertedCount === 0) {
      showOperationNotice(context.services.settings.getSettings(), 'No images found');
      return;
    }

    showOperationNotice(
      context.services.settings.getSettings(),
      formatBatchConversionNotice({
        imageCount: convertedCount,
        targetFormat: format
      })
    );
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
      showOperationNotice(context.services.settings.getSettings(), 'Open a note file first');
      return;
    }

    await callback(file);
  }

  private getConversionIgnoreMatch(context: ImageManagerFeatureContext, file: TFile): RegexIgnoreMatch | null {
    return matchRegexIgnorePattern(context.services.settings.getSettings().conversionIgnorePattern, file.path);
  }

  private logConversionIgnored(
    context: ImageManagerFeatureContext,
    file: TFile,
    ignored: RegexIgnoreMatch
  ): void {
    context.services.logger.debug('Skipping conversion because file matches ignore pattern', {
      filePath: file.path,
      pattern: ignored.source
    });
  }
}
