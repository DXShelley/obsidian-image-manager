import { Notice, TFile } from 'obsidian';
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
          label: `同步笔记迁移图片 ${noteFile.basename}`,
          trigger: 'note-rename-sync',
          scope: 'auto'
        },
        async () => context.services.fileManager.syncManagedImagesForNote(noteFile, oldPath)
      );
      if (movedCount > 0) {
        showOperationNotice(context.services.settings.getSettings(), `Synced ${movedCount} managed image${movedCount === 1 ? '' : 's'}`);
      }
      context.services.logger.debug('Completed note rename sync', {
        notePath: noteFile.path,
        oldPath,
        movedCount
      });
    } catch (error) {
      console.error('Image Manager failed to sync managed images after note rename/move', error);
      context.services.logger.error('Note rename sync failed', error, {
        notePath: noteFile.path,
        oldPath
      });
      new Notice('Failed to sync managed images for the renamed or moved note');
    }
  }
}
