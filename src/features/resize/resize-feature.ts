import { TFile } from 'obsidian';
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
      commandName: '图片：缩放到 1920px 边界'
    } as const;
    context.plugin.addCommand({
      id: resizeCommand.commandId,
      name: resizeCommand.commandName,
      callback: () => {
        void executeLoggedCommand(context, resizeCommand, async () => {
          await context.services.recovery.runTransaction(
            {
              label: '缩放当前图片到 1920px',
              trigger: 'resize',
              scope: 'single-file'
            },
            async () => {
              await this.withActiveImageFile(context, resizeCommand, async (file) => {
                const buffer = await context.services.imageProcessor.resize(file, 1920, 1920);
                await context.services.fileManager.replaceFile(file, buffer);
                showOperationNotice(context.services.settings.getSettings(), 'Image resized');
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
      showOperationNotice(context.services.settings.getSettings(), 'Open an image file first');
      return;
    }

    await callback(file);
  }
}
