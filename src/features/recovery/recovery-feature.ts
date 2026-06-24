import { Notice } from 'obsidian';
import type { ImageManagerFeature, ImageManagerFeatureContext } from '@/types/index';
import { showOperationNotice } from '@/utils/operation-feedback';

export class RecoveryFeature implements ImageManagerFeature {
  readonly id = 'recovery';
  readonly name = 'Recovery';
  readonly summary = 'Undo or redo the most recent Image Manager transaction from persisted snapshots.';
  readonly state = 'implemented' as const;

  async register(context: ImageManagerFeatureContext): Promise<void> {
    context.plugin.addCommand({
      id: 'd1-undo-last-image-manager-transaction',
      name: '恢复：撤销上一步图片管理修改',
      callback: () => {
        void this.undoLastTransaction(context);
      }
    });

    context.plugin.addCommand({
      id: 'd2-redo-last-image-manager-transaction',
      name: '恢复：重做上一步图片管理修改',
      callback: () => {
        void this.redoLastTransaction(context);
      }
    });
  }

  private async undoLastTransaction(context: ImageManagerFeatureContext): Promise<void> {
    try {
      const restored = await context.services.recovery.undoLastTransaction();
      if (!restored) {
        showOperationNotice(context.services.settings.getSettings(), '没有可恢复的图片管理事务');
        return;
      }

      showOperationNotice(
        context.services.settings.getSettings(),
        `已恢复：${restored.label}`
      );
    } catch (error) {
      console.error('Image Manager failed to undo the last transaction', error);
      context.services.logger.error('Recovery undo failed', error);
      new Notice(error instanceof Error ? error.message : 'Failed to undo the last Image Manager transaction');
    }
  }

  private async redoLastTransaction(context: ImageManagerFeatureContext): Promise<void> {
    try {
      const restored = await context.services.recovery.redoLastUndoneTransaction();
      if (!restored) {
        showOperationNotice(context.services.settings.getSettings(), '没有可重做的图片管理事务');
        return;
      }

      showOperationNotice(
        context.services.settings.getSettings(),
        `已重做：${restored.label}`
      );
    } catch (error) {
      console.error('Image Manager failed to redo the last transaction', error);
      context.services.logger.error('Recovery redo failed', error);
      new Notice(error instanceof Error ? error.message : 'Failed to redo the last Image Manager transaction');
    }
  }
}
