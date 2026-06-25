import { Notice, TFile } from 'obsidian';
import { getNoticeCopy, getUiCopy } from '@/i18n';
import type { ImageManagerFeature, ImageManagerFeatureContext } from '@/types/index';
import { showOperationNotice } from '@/utils/operation-feedback';

export class RenameFeature implements ImageManagerFeature {
  readonly id = 'rename';
  readonly name = 'Rename and Relocation';
  readonly summary = 'Name pasted images from variables and sync managed folders when notes move or rename.';
  readonly state = 'implemented' as const;

  async register(context: ImageManagerFeatureContext): Promise<void> {
    context.plugin.registerEvent(
      context.app.vault.on('rename', (file, oldPath) => {
        if (!(file instanceof TFile) || file.extension !== 'md') {
          return;
        }

        void this.syncManagedImagesForNote(context, file, oldPath);
      })
    );
  }

  private async syncManagedImagesForNote(
    context: ImageManagerFeatureContext,
    noteFile: TFile,
    oldPath: string
  ): Promise<void> {
    context.services.logger.refreshMode('note-rename-sync');
    if (!context.services.settings.getSettings().enableNoteRenameSync) {
      context.services.logger.debug('Skipped note rename sync because the feature is disabled', {
        notePath: noteFile.path,
        oldPath
      });
      return;
    }

    try {
      context.services.logger.debug('Starting note rename sync', {
        notePath: noteFile.path,
        oldPath
      });
      const movedCount = await context.services.recovery.runTransaction(
        {
          label: getUiCopy(context.services.settings.getSettings().uiLanguage).transactions.syncManagedImages(
            noteFile.basename
          ),
          trigger: 'note-rename-sync',
          scope: 'auto'
        },
        async () => context.services.fileManager.syncManagedImagesForNote(noteFile, oldPath)
      );
      if (movedCount > 0) {
        const settings = context.services.settings.getSettings();
        showOperationNotice(settings, getNoticeCopy(settings.uiLanguage).managedImagesSynced(movedCount));
      }
      context.services.logger.debug('Completed note rename sync', {
        notePath: noteFile.path,
        oldPath,
        movedCount
      });
    } catch (error) {
      console.error('Note Image Manager failed to sync managed images after note rename/move', error);
      context.services.logger.error('Note rename sync failed', error, {
        notePath: noteFile.path,
        oldPath
      });
      new Notice(getNoticeCopy(context.services.settings.getSettings().uiLanguage).failedToSyncManagedImages);
    }
  }
}
