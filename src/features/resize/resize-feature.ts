import { TFile } from 'obsidian';
import { getDefaultCommandName, getNoticeCopy, getUiCopy } from '@/i18n';
import type { ImageManagerFeature, ImageManagerFeatureContext } from '@/types/index';
import { executeLoggedCommand, logSkippedCommand } from '@/utils/command-logging';
import { showOperationNotice } from '@/utils/operation-feedback';

export class ResizeFeature implements ImageManagerFeature {
  readonly id = 'resize';
  readonly name = 'Resize';
  readonly summary = 'Resize active image files with a safe preset for large assets.';
  readonly state = 'implemented' as const;

  async register(context: ImageManagerFeatureContext): Promise<void> {
    const resizeCommand = {
      commandId: 'resize-active-image-to-1920px',
      commandName: getDefaultCommandName('resize-active-image-to-1920px')
    } as const;
    context.plugin.addCommand({
      id: resizeCommand.commandId,
      name: resizeCommand.commandName,
      callback: () => {
        void executeLoggedCommand(context, resizeCommand, async () => {
          await context.services.recovery.runTransaction(
            {
              label: getUiCopy(context.services.settings.getSettings().uiLanguage).transactions.resizeActiveImage,
              trigger: 'resize',
              scope: 'single-file'
            },
            async () => {
              await this.withActiveImageFile(context, resizeCommand, async (file) => {
                const buffer = await context.services.imageProcessor.resize(file, 1920, 1920);
                await context.services.fileManager.replaceFile(file, buffer);
                const settings = context.services.settings.getSettings();
                showOperationNotice(settings, getNoticeCopy(settings.uiLanguage).imageResized);
              });
            }
          );
        });
      }
    });
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
