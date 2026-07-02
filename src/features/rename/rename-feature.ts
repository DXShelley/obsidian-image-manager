import { Notice, TFile, type EventRef } from 'obsidian';
import { getNoticeCopy, getUiCopy } from '@/i18n';
import type { ImageManagerFeature, ImageManagerFeatureContext } from '@/types/index';
import type { DeletedNoteManagedCleanupTarget } from '@/services/file-manager';
import { showOperationNotice } from '@/utils/operation-feedback';

const NOTE_DELETE_CLEANUP_DEBOUNCE_MS = 300;
const METADATA_RESOLVED_WAIT_TIMEOUT_MS = 1200;

export class RenameFeature implements ImageManagerFeature {
  readonly id = 'rename';
  readonly name = 'Rename and Relocation';
  readonly summary = 'Name pasted images from variables and sync managed folders when notes move or rename.';
  readonly state = 'implemented' as const;
  private readonly pendingDeletedNoteCleanups = new Map<string, DeletedNoteManagedCleanupTarget>();
  private cleanupTimer: number | null = null;
  private cleanupInProgress = false;

  async register(context: ImageManagerFeatureContext): Promise<void> {
    context.plugin.registerEvent(
      context.app.vault.on('rename', (file, oldPath) => {
        if (!(file instanceof TFile) || file.extension.toLowerCase() !== 'md') {
          return;
        }

        void this.syncManagedImagesForNote(context, file, oldPath);
      })
    );

    context.plugin.registerEvent(
      context.app.vault.on('delete', (file) => {
        if (!(file instanceof TFile) || file.extension.toLowerCase() !== 'md') {
          return;
        }

        const target = context.services.fileManager.getDeletedNoteManagedCleanupTarget(file.path);
        if (!target) {
          return;
        }

        this.scheduleDeletedNoteCleanup(context, target);
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

  private scheduleDeletedNoteCleanup(
    context: ImageManagerFeatureContext,
    target: DeletedNoteManagedCleanupTarget
  ): void {
    context.services.logger.refreshMode('note-delete-cleanup');
    const settings = context.services.settings.getSettings();
    if (!settings.deleteOrphanImages && !settings.deleteEmptyFolders) {
      context.services.logger.debug('Skipped deleted note image cleanup because orphan image and empty folder cleanup are disabled', {
        notePath: target.notePath,
        managedFolderPath: target.managedFolderPath
      });
      return;
    }

    this.pendingDeletedNoteCleanups.set(target.managedFolderPath, target);
    if (this.cleanupTimer !== null) {
      window.clearTimeout(this.cleanupTimer);
    }

    this.cleanupTimer = window.setTimeout(() => {
      this.cleanupTimer = null;
      void this.flushDeletedNoteCleanupQueue(context);
    }, NOTE_DELETE_CLEANUP_DEBOUNCE_MS);
  }

  private async flushDeletedNoteCleanupQueue(context: ImageManagerFeatureContext): Promise<void> {
    if (this.cleanupInProgress) {
      return;
    }

    const tasks = [...this.pendingDeletedNoteCleanups.values()];
    this.pendingDeletedNoteCleanups.clear();
    if (tasks.length === 0) {
      return;
    }

    this.cleanupInProgress = true;
    try {
      const metadataResolved = await this.waitForVaultCleanupSettle(context);
      const deletedNotePaths = new Set(tasks.map((task) => task.notePath));
      for (const task of tasks) {
        await this.cleanupManagedImagesForDeletedNote(context, task, deletedNotePaths, metadataResolved);
      }
    } catch (error) {
      console.error('Note Image Manager failed to cleanup managed images after note delete', error);
      context.services.logger.error('Deleted note image cleanup failed', error);
      new Notice(getNoticeCopy(context.services.settings.getSettings().uiLanguage).orphanCleanupFailed);
    } finally {
      this.cleanupInProgress = false;
      if (this.pendingDeletedNoteCleanups.size > 0) {
        this.scheduleFlushDeletedNoteCleanupQueue(context);
      }
    }
  }

  private scheduleFlushDeletedNoteCleanupQueue(context: ImageManagerFeatureContext): void {
    if (this.cleanupTimer !== null) {
      window.clearTimeout(this.cleanupTimer);
    }

    this.cleanupTimer = window.setTimeout(() => {
      this.cleanupTimer = null;
      void this.flushDeletedNoteCleanupQueue(context);
    }, NOTE_DELETE_CLEANUP_DEBOUNCE_MS);
  }

  private async cleanupManagedImagesForDeletedNote(
    context: ImageManagerFeatureContext,
    task: DeletedNoteManagedCleanupTarget,
    deletedNotePaths: ReadonlySet<string>,
    metadataResolved: boolean
  ): Promise<void> {
    try {
      context.services.logger.debug('Starting deleted note image cleanup', {
        notePath: task.notePath,
        managedFolderPath: task.managedFolderPath
      });
      const result = await context.services.recovery.runTransaction(
        {
          label: getUiCopy(context.services.settings.getSettings().uiLanguage).transactions.cleanupDeletedNoteImages(
            task.noteName
          ),
          trigger: 'note-delete-cleanup',
          scope: 'auto'
        },
        async () =>
          context.services.fileManager.cleanupManagedImagesForDeletedNotePath(task.notePath, deletedNotePaths, {
            allowImageDeletion: metadataResolved
          })
      );
      context.services.logger.debug('Completed deleted note image cleanup', {
        notePath: task.notePath,
        managedFolderPath: task.managedFolderPath,
        metadataResolved,
        deletedImages: result.deletedImages,
        deletedFolders: result.deletedFolders,
        relocatedImages: result.relocatedImages,
        preservedImages: result.preservedImages
      });
    } catch (error) {
      console.error('Note Image Manager failed to cleanup managed images after note delete', error);
      context.services.logger.error('Deleted note image cleanup failed', error, {
        notePath: task.notePath,
        managedFolderPath: task.managedFolderPath
      });
      new Notice(getNoticeCopy(context.services.settings.getSettings().uiLanguage).orphanCleanupFailed);
    }
  }

  private async waitForVaultCleanupSettle(context: ImageManagerFeatureContext): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      let resolved = false;
      let ref: EventRef | null = null;
      const complete = (metadataResolved: boolean) => {
        if (resolved) {
          return;
        }

        resolved = true;
        if (ref) {
          context.app.metadataCache.offref(ref);
        }
        window.clearTimeout(timeout);
        resolve(metadataResolved);
      };
      const timeout = window.setTimeout(() => complete(false), METADATA_RESOLVED_WAIT_TIMEOUT_MS);
      ref = context.app.metadataCache.on('resolved', () => complete(true));
    });
  }
}
