import { TFile } from 'obsidian';
import { getDefaultCommandName, getNoticeCopy, getUiCopy } from '@/i18n';
import type { ImageManagerFeature, ImageManagerFeatureContext } from '@/types/index';
import { executeLoggedCommand, logSkippedCommand } from '@/utils/command-logging';
import { showOperationNotice } from '@/utils/operation-feedback';

export class EditorFeature implements ImageManagerFeature {
  readonly id = 'editor';
  readonly name = 'Image Editor';
  readonly summary = 'Provide quick rotate and flip commands for active image files.';
  readonly state = 'implemented' as const;

  async register(context: ImageManagerFeatureContext): Promise<void> {
    const rotateCommand = {
      commandId: 'rotate-active-image-90',
      commandName: getDefaultCommandName('rotate-active-image-90')
    } as const;
    context.plugin.addCommand({
      id: rotateCommand.commandId,
      name: rotateCommand.commandName,
      callback: () => {
        void executeLoggedCommand(context, rotateCommand, async () => {
          await context.services.recovery.runTransaction(
            {
              label: getUiCopy(context.services.settings.getSettings().uiLanguage).transactions.rotateActiveImage,
              trigger: 'rotate',
              scope: 'single-file'
            },
            async () => {
              await this.withActiveImageFile(context, rotateCommand, async (file) => {
                await this.replaceImage(context, file, () => context.services.imageProcessor.rotate(file, 90), getNoticeCopy(context.services.settings.getSettings().uiLanguage).imageRotated);
              });
            }
          );
        });
      }
    });

    const flipCommand = {
      commandId: 'flip-active-image-horizontal',
      commandName: getDefaultCommandName('flip-active-image-horizontal')
    } as const;
    context.plugin.addCommand({
      id: flipCommand.commandId,
      name: flipCommand.commandName,
      callback: () => {
        void executeLoggedCommand(context, flipCommand, async () => {
          await context.services.recovery.runTransaction(
            {
              label: getUiCopy(context.services.settings.getSettings().uiLanguage).transactions.flipActiveImageHorizontal,
              trigger: 'flip',
              scope: 'single-file'
            },
            async () => {
              await this.withActiveImageFile(context, flipCommand, async (file) => {
                await this.replaceImage(context, file, () => context.services.imageProcessor.flip(file, 'horizontal'), getNoticeCopy(context.services.settings.getSettings().uiLanguage).imageFlippedHorizontal);
              });
            }
          );
        });
      }
    });
  }

  private async replaceImage(
    context: ImageManagerFeatureContext,
    file: TFile,
    processor: () => Promise<ArrayBuffer>,
    message: string
  ): Promise<void> {
    const buffer = await processor();
    await context.services.fileManager.replaceFile(file, buffer);
    showOperationNotice(context.services.settings.getSettings(), message);
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
      const settings = context.services.settings.getSettings();
      showOperationNotice(settings, getNoticeCopy(settings.uiLanguage).noActiveImageFile);
      return;
    }
    const restriction = context.services.imageProcessor.getInPlaceModificationRestriction(file);
    if (restriction) {
      logSkippedCommand(context, {
        ...command,
        reason: restriction
      });
      showOperationNotice(context.services.settings.getSettings(), restriction);
      return;
    }

    await callback(file);
  }
}
