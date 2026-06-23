import { Notice } from 'obsidian';
import type { ImageManagerFeature, ImageManagerFeatureContext } from '@/types/index';
import { showOperationNotice } from '@/utils/operation-feedback';

export class RecoveryFeature implements ImageManagerFeature {
  readonly id = 'recovery';
  readonly name = 'Recovery';
  readonly summary = 'Undo the most recent Image Manager transaction from persisted snapshots.';
  readonly state = 'implemented' as const;

  async register(context: ImageManagerFeatureContext): Promise<void> {
    context.plugin.addCommand({
      id: 'undo-last-image-manager-transaction',
      name: '恢复：撤销上一次图片管理修改',
      callback: () => {
        void this.undoLastTransaction(context);
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
}
