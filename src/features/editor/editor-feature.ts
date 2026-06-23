import { TFile } from 'obsidian';
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
      commandName: '图片：顺时针旋转 90°'
    } as const;
    context.plugin.addCommand({
      id: rotateCommand.commandId,
      name: rotateCommand.commandName,
      callback: () => {
        void executeLoggedCommand(context, rotateCommand, async () => {
          await context.services.recovery.runTransaction(
            {
              label: '旋转当前图片 90 度',
              trigger: 'rotate',
              scope: 'single-file'
            },
            async () => {
              await this.withActiveImageFile(context, rotateCommand, async (file) => {
                await this.replaceImage(context, file, () => context.services.imageProcessor.rotate(file, 90), 'Image rotated');
              });
            }
          );
        });
      }
    });

    const flipCommand = {
      commandId: 'flip-active-image-horizontal',
      commandName: '图片：水平翻转'
    } as const;
    context.plugin.addCommand({
      id: flipCommand.commandId,
      name: flipCommand.commandName,
      callback: () => {
        void executeLoggedCommand(context, flipCommand, async () => {
          await context.services.recovery.runTransaction(
            {
              label: '水平翻转当前图片',
              trigger: 'flip',
              scope: 'single-file'
            },
            async () => {
              await this.withActiveImageFile(context, flipCommand, async (file) => {
                await this.replaceImage(context, file, () => context.services.imageProcessor.flip(file, 'horizontal'), 'Image flipped horizontally');
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
      showOperationNotice(context.services.settings.getSettings(), 'Open an image file first');
      return;
    }

    await callback(file);
  }
}
