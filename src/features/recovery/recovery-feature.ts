import { getDefaultCommandName, getNoticeCopy } from '@/i18n';
import { Notice } from 'obsidian';
import type { ImageManagerFeature, ImageManagerFeatureContext } from '@/types/index';
import { showOperationNotice } from '@/utils/operation-feedback';

export class RecoveryFeature implements ImageManagerFeature {
  readonly id = 'recovery';
  readonly name = 'Recovery';
  readonly summary = 'Undo or redo the most recent Note Image Manager transaction from persisted snapshots.';
  readonly state = 'implemented' as const;

  async register(context: ImageManagerFeatureContext): Promise<void> {
    context.plugin.addCommand({
      id: 'd1-undo-last-image-manager-transaction',
      name: getDefaultCommandName('d1-undo-last-image-manager-transaction'),
      callback: () => {
        void this.undoLastTransaction(context);
      }
    });

    context.plugin.addCommand({
      id: 'd2-redo-last-image-manager-transaction',
      name: getDefaultCommandName('d2-redo-last-image-manager-transaction'),
      callback: () => {
        void this.redoLastTransaction(context);
      }
    });
  }

  private async undoLastTransaction(context: ImageManagerFeatureContext): Promise<void> {
    try {
      const settings = context.services.settings.getSettings();
      const notices = getNoticeCopy(settings.uiLanguage);
      const restored = await context.services.recovery.undoLastTransaction();
      if (!restored) {
        showOperationNotice(settings, notices.noUndoTransaction);
        return;
      }

      showOperationNotice(settings, notices.undoCompleted(restored.label));
    } catch (error) {
      console.error('Note Image Manager failed to undo the last transaction', error);
      context.services.logger.error('Recovery undo failed', error);
      new Notice(error instanceof Error ? error.message : getNoticeCopy(context.services.settings.getSettings().uiLanguage).undoFailed);
    }
  }

  private async redoLastTransaction(context: ImageManagerFeatureContext): Promise<void> {
    try {
      const settings = context.services.settings.getSettings();
      const notices = getNoticeCopy(settings.uiLanguage);
      const restored = await context.services.recovery.redoLastUndoneTransaction();
      if (!restored) {
        showOperationNotice(settings, notices.noRedoTransaction);
        return;
      }

      showOperationNotice(settings, notices.redoCompleted(restored.label));
    } catch (error) {
      console.error('Note Image Manager failed to redo the last transaction', error);
      context.services.logger.error('Recovery redo failed', error);
      new Notice(error instanceof Error ? error.message : getNoticeCopy(context.services.settings.getSettings().uiLanguage).redoFailed);
    }
  }
}
