import { MarkdownView, Notice, TFile, TFolder } from 'obsidian';
import { getDefaultCommandName, getNoticeCopy, getUiCopy } from '@/i18n';
import type { ImageManagerFeature, ImageManagerFeatureContext } from '@/types/index';
import { BatchExecutionStatus, BatchOperation, BatchScope } from '@/types/index';
import { executeLoggedCommand, logSkippedCommand } from '@/utils/command-logging';
import {
  formatBatchExternalImageImportNotice,
  formatBatchLinkRewriteNotice,
  formatBatchOrphanCleanupNotice
} from '@/utils/batch-operation-feedback';
import { showOperationNotice } from '@/utils/operation-feedback';
import { confirmVaultScopeOperation } from '@/utils/vault-operation';

interface LinkRewriteSummaryItem {
  readonly notePath: string;
  readonly replaced: number;
  readonly moved: number;
  readonly downloaded: number;
  readonly deleted: number;
  readonly foldersDeleted: number;
}

interface ExternalImageImportSummaryItem {
  readonly notePath: string;
  readonly replaced: number;
  readonly downloaded: number;
}

export class BatchFeature implements ImageManagerFeature {
  readonly id = 'batch';
  readonly name = 'Batch Processor';
  readonly summary = 'Normalize image links and placement for the current note, folder, or entire vault.';
  readonly state = 'implemented' as const;

  async register(context: ImageManagerFeatureContext): Promise<void> {
    const noteCommand = {
      commandId: 'a1-update-current-note-image-links',
      commandName: getDefaultCommandName('a1-update-current-note-image-links')
    } as const;
    context.plugin.addCommand({
      id: noteCommand.commandId,
      name: noteCommand.commandName,
      editorCallback: (_editor, view) => {
        void executeLoggedCommand(context, noteCommand, async () => {
          if (!(view instanceof MarkdownView) || !view.file) {
            logSkippedCommand(context, {
              ...noteCommand,
              reason: 'No active note'
            });
            const settings = context.services.settings.getSettings();
            showOperationNotice(settings, getNoticeCopy(settings.uiLanguage).noActiveNote);
            return;
          }
          const noteFile = view.file;

          await context.services.recovery.runTransaction(
            {
              label: getUiCopy(context.services.settings.getSettings().uiLanguage).transactions.batchUpdateNoteImageLinks(
                noteFile.basename
              ),
              trigger: 'batch',
              scope: 'single-note'
            },
            async () => {
              await this.runLinkRewriteBatch(context, BatchScope.CURRENT_NOTE, noteFile);
            }
          );
        });
      }
    });

    const noteImportCommand = {
      commandId: 'a2-import-current-note-external-images',
      commandName: getDefaultCommandName('a2-import-current-note-external-images')
    } as const;
    context.plugin.addCommand({
      id: noteImportCommand.commandId,
      name: noteImportCommand.commandName,
      callback: () => {
        void executeLoggedCommand(context, noteImportCommand, async () => {
          await context.services.recovery.runTransaction(
            {
              label: getUiCopy(context.services.settings.getSettings().uiLanguage).transactions
                .importCurrentNoteExternalImages,
              trigger: 'batch',
              scope: 'single-note'
            },
            async () => {
              await this.withActiveNoteFile(context, noteImportCommand, async (file) => {
                await this.runExternalImageImportBatch(context, BatchScope.CURRENT_NOTE, file);
              });
            }
          );
        });
      }
    });

    const noteCleanupCommand = {
      commandId: 'a5-delete-current-note-extra-images',
      commandName: getDefaultCommandName('a5-delete-current-note-extra-images')
    } as const;
    context.plugin.addCommand({
      id: noteCleanupCommand.commandId,
      name: noteCleanupCommand.commandName,
      editorCallback: (_editor, view) => {
        void executeLoggedCommand(context, noteCleanupCommand, async () => {
          if (!(view instanceof MarkdownView) || !view.file) {
            logSkippedCommand(context, {
              ...noteCleanupCommand,
              reason: 'No active note'
            });
            const settings = context.services.settings.getSettings();
            showOperationNotice(settings, getNoticeCopy(settings.uiLanguage).noActiveNote);
            return;
          }
          const noteFile = view.file;

          await context.services.recovery.runTransaction(
            {
              label: getUiCopy(context.services.settings.getSettings().uiLanguage).transactions
                .deleteCurrentNoteExtraImages(noteFile.basename),
              trigger: 'batch',
              scope: 'single-note'
            },
            async () => {
              await this.runOrphanCleanupBatch(context, BatchScope.CURRENT_NOTE, noteFile);
            }
          );
        });
      }
    });

    const folderCommand = {
      commandId: 'b1-update-current-folder-image-links',
      commandName: getDefaultCommandName('b1-update-current-folder-image-links')
    } as const;
    context.plugin.addCommand({
      id: folderCommand.commandId,
      name: folderCommand.commandName,
      callback: () => {
        void executeLoggedCommand(context, folderCommand, async () => {
          const folder = context.app.workspace.getActiveFile()?.parent;
          if (!folder) {
            logSkippedCommand(context, {
              ...folderCommand,
              reason: 'No active folder'
            });
            const settings = context.services.settings.getSettings();
            showOperationNotice(settings, getNoticeCopy(settings.uiLanguage).noActiveFolder);
            return;
          }

          await context.services.recovery.runTransaction(
            {
              label: getUiCopy(context.services.settings.getSettings().uiLanguage).transactions
                .batchUpdateFolderImageLinks(
                  folder.path || getUiCopy(context.services.settings.getSettings().uiLanguage).common.vaultRoot
                ),
              trigger: 'batch',
              scope: 'folder'
            },
            async () => {
              await this.runLinkRewriteBatch(context, BatchScope.FOLDER, folder);
            }
          );
        });
      }
    });

    const folderImportCommand = {
      commandId: 'b2-import-current-folder-external-images',
      commandName: getDefaultCommandName('b2-import-current-folder-external-images')
    } as const;
    context.plugin.addCommand({
      id: folderImportCommand.commandId,
      name: folderImportCommand.commandName,
      callback: () => {
        void executeLoggedCommand(context, folderImportCommand, async () => {
          const folder = context.app.workspace.getActiveFile()?.parent;
          if (!folder) {
            logSkippedCommand(context, {
              ...folderImportCommand,
              reason: 'No active folder'
            });
            const settings = context.services.settings.getSettings();
            showOperationNotice(settings, getNoticeCopy(settings.uiLanguage).noActiveFolder);
            return;
          }

          await context.services.recovery.runTransaction(
            {
              label: getUiCopy(context.services.settings.getSettings().uiLanguage).transactions.importFolderExternalImages(
                folder.path || getUiCopy(context.services.settings.getSettings().uiLanguage).common.vaultRoot
              ),
              trigger: 'batch',
              scope: 'folder'
            },
            async () => {
              await this.runExternalImageImportBatch(context, BatchScope.FOLDER, folder);
            }
          );
        });
      }
    });

    const folderCleanupCommand = {
      commandId: 'b5-delete-current-folder-extra-images',
      commandName: getDefaultCommandName('b5-delete-current-folder-extra-images')
    } as const;
    context.plugin.addCommand({
      id: folderCleanupCommand.commandId,
      name: folderCleanupCommand.commandName,
      callback: () => {
        void executeLoggedCommand(context, folderCleanupCommand, async () => {
          const folder = context.app.workspace.getActiveFile()?.parent;
          if (!folder) {
            logSkippedCommand(context, {
              ...folderCleanupCommand,
              reason: 'No active folder'
            });
            const settings = context.services.settings.getSettings();
            showOperationNotice(settings, getNoticeCopy(settings.uiLanguage).noActiveFolder);
            return;
          }

          await context.services.recovery.runTransaction(
            {
              label: getUiCopy(context.services.settings.getSettings().uiLanguage).transactions.deleteFolderExtraImages(
                folder.path || getUiCopy(context.services.settings.getSettings().uiLanguage).common.vaultRoot
              ),
              trigger: 'batch',
              scope: 'folder'
            },
            async () => {
              await this.runOrphanCleanupBatch(context, BatchScope.FOLDER, folder);
            }
          );
        });
      }
    });

    const vaultCommand = {
      commandId: 'c1-update-vault-image-links',
      commandName: getDefaultCommandName('c1-update-vault-image-links')
    } as const;
    context.plugin.addCommand({
      id: vaultCommand.commandId,
      name: vaultCommand.commandName,
      callback: () => {
        void executeLoggedCommand(context, vaultCommand, async () => {
          const ui = getUiCopy(context.services.settings.getSettings().uiLanguage);
          if (!(await confirmVaultScopeOperation(context.app, context.services.settings.getSettings().uiLanguage, ui.vaultOperation.actionNames.linkRewrite))) {
            return;
          }

          await context.services.recovery.runTransaction(
            {
              label: ui.transactions.batchUpdateVaultImageLinks,
              trigger: 'batch',
              scope: 'vault'
            },
            async () => {
              await this.runLinkRewriteBatch(context, BatchScope.VAULT);
            }
          );
        });
      }
    });

    const vaultImportCommand = {
      commandId: 'c2-import-vault-external-images',
      commandName: getDefaultCommandName('c2-import-vault-external-images')
    } as const;
    context.plugin.addCommand({
      id: vaultImportCommand.commandId,
      name: vaultImportCommand.commandName,
      callback: () => {
        void executeLoggedCommand(context, vaultImportCommand, async () => {
          const ui = getUiCopy(context.services.settings.getSettings().uiLanguage);
          if (!(await confirmVaultScopeOperation(context.app, context.services.settings.getSettings().uiLanguage, ui.vaultOperation.actionNames.externalImport))) {
            return;
          }

          await context.services.recovery.runTransaction(
            {
              label: ui.transactions.importVaultExternalImages,
              trigger: 'batch',
              scope: 'vault'
            },
            async () => {
              await this.runExternalImageImportBatch(context, BatchScope.VAULT);
            }
          );
        });
      }
    });

    const vaultCleanupCommand = {
      commandId: 'c5-delete-vault-extra-images',
      commandName: getDefaultCommandName('c5-delete-vault-extra-images')
    } as const;
    context.plugin.addCommand({
      id: vaultCleanupCommand.commandId,
      name: vaultCleanupCommand.commandName,
      callback: () => {
        void executeLoggedCommand(context, vaultCleanupCommand, async () => {
          const ui = getUiCopy(context.services.settings.getSettings().uiLanguage);
          if (!(await confirmVaultScopeOperation(context.app, context.services.settings.getSettings().uiLanguage, ui.vaultOperation.actionNames.orphanCleanup))) {
            return;
          }

          await context.services.recovery.runTransaction(
            {
              label: ui.transactions.deleteVaultExtraImages,
              trigger: 'batch',
              scope: 'vault'
            },
            async () => {
              await this.runOrphanCleanupBatch(context, BatchScope.VAULT);
            }
          );
        });
      }
    });

    const vaultEmptyFolderCleanupCommand = {
      commandId: 'c6-clean-vault-empty-managed-folders',
      commandName: getDefaultCommandName('c6-clean-vault-empty-managed-folders')
    } as const;
    context.plugin.addCommand({
      id: vaultEmptyFolderCleanupCommand.commandId,
      name: vaultEmptyFolderCleanupCommand.commandName,
      callback: () => {
        void executeLoggedCommand(context, vaultEmptyFolderCleanupCommand, async () => {
          const ui = getUiCopy(context.services.settings.getSettings().uiLanguage);
          if (!(await confirmVaultScopeOperation(context.app, context.services.settings.getSettings().uiLanguage, ui.vaultOperation.actionNames.emptyFolderCleanup))) {
            return;
          }

          await context.services.recovery.runTransaction(
            {
              label: ui.transactions.cleanupVaultEmptyManagedFolders,
              trigger: 'batch',
              scope: 'vault'
            },
            async () => {
              await this.runEmptyManagedFolderCleanup(context, BatchScope.VAULT);
            }
          );
        });
      }
    });
  }

  private async runLinkRewriteBatch(
    context: ImageManagerFeatureContext,
    scope: BatchScope,
    source?: TFile | TFolder
  ): Promise<void> {
    context.services.logger.refreshMode('batch-update-links');
    if (this.hasActiveBatch(context)) {
      const settings = context.services.settings.getSettings();
      showOperationNotice(settings, getNoticeCopy(settings.uiLanguage).batchJobAlreadyActive);
      return;
    }

    try {
      const notes = this.resolveNotes(context, scope, source);
      const allowedNotePaths = new Set(notes.map((note) => note.path));
      context.services.logger.debug('Starting batch link rewrite', {
        scope,
        sourcePath: source?.path,
        noteCount: notes.length
      });
      let rewrittenNotes = 0;
      let rewrittenLinks = 0;
      let movedImages = 0;
      let downloadedImages = 0;
      let deletedImages = 0;
      let deletedFolders = 0;
      const rewrittenSummaries: LinkRewriteSummaryItem[] = [];
      const runWithDeferredLeafRefresh =
        typeof context.services.fileManager.runWithDeferredLeafRefresh === 'function'
          ? context.services.fileManager.runWithDeferredLeafRefresh.bind(context.services.fileManager)
          : async <T>(operation: () => Promise<T>) => operation();
      const report = await runWithDeferredLeafRefresh(async () =>
        context.services.batchProcessor.run({
          id: `${scope}-update-links-${Date.now()}`,
          scope,
          operation: BatchOperation.UPDATE_LINKS,
          tasks: notes.map((note) => ({
            id: note.path,
            label: note.path,
            run: async () => {
              const result = await context.services.fileManager.rewriteImageLinksInNote(note, allowedNotePaths);
              if (result.replaced > 0 || result.moved > 0 || result.downloaded > 0 || result.deleted > 0) {
                rewrittenNotes += 1;
                rewrittenLinks += result.replaced;
                movedImages += result.moved;
                downloadedImages += result.downloaded;
                deletedImages += result.deleted;
                deletedFolders += result.foldersDeleted;
                rewrittenSummaries.push({
                  notePath: note.path,
                  replaced: result.replaced,
                  moved: result.moved,
                  downloaded: result.downloaded,
                  deleted: result.deleted,
                  foldersDeleted: result.foldersDeleted
                });
              }
            }
          }))
        })
      );

      context.services.logger.debug('Completed batch link rewrite', {
        scope,
        sourcePath: source?.path,
        completed: report.completed,
        failed: report.failed,
        skipped: report.skipped,
        status: report.status,
        rewrittenNotes,
        rewrittenLinks,
        movedImages,
        downloadedImages,
        deletedImages,
        deletedFolders
      });
      showOperationNotice(
        context.services.settings.getSettings(),
        formatBatchLinkRewriteNotice({
          items: rewrittenSummaries.map((item) => ({
            notePath: item.notePath,
            replaced: item.replaced
          })),
          rewrittenLinks,
          movedImages,
          downloadedImages,
          deletedImages,
          deletedFolders,
          failedCount: report.failed,
          language: context.services.settings.getSettings().uiLanguage
        })
      );
    } catch (error) {
      console.error('Note Image Manager batch link rewrite failed', error);
      context.services.logger.error('Batch link rewrite failed', error, {
        scope,
        sourcePath: source?.path
      });
      new Notice(error instanceof Error ? error.message : getNoticeCopy(context.services.settings.getSettings().uiLanguage).batchLinkRewriteFailed);
    }
  }

  private async runExternalImageImportBatch(
    context: ImageManagerFeatureContext,
    scope: BatchScope,
    source?: TFile | TFolder
  ): Promise<void> {
    context.services.logger.refreshMode('batch-import-external-images');
    if (this.hasActiveBatch(context)) {
      const settings = context.services.settings.getSettings();
      showOperationNotice(settings, getNoticeCopy(settings.uiLanguage).batchJobAlreadyActive);
      return;
    }

    try {
      const notes = this.resolveNotes(context, scope, source);
      context.services.logger.debug('Starting external image import batch', {
        scope,
        sourcePath: source?.path,
        noteCount: notes.length
      });
      let importedLinks = 0;
      let downloadedImages = 0;
      const summaries: ExternalImageImportSummaryItem[] = [];
      const report = await context.services.batchProcessor.run({
        id: `${scope}-import-external-images-${Date.now()}`,
        scope,
        operation: BatchOperation.IMPORT_EXTERNAL_IMAGES,
        tasks: notes.map((note) => ({
          id: note.path,
          label: note.path,
          run: async () => {
            const result = await context.services.fileManager.importExternalImageLinksInNote(note);
            if (result.replaced > 0 || result.downloaded > 0) {
              importedLinks += result.replaced;
              downloadedImages += result.downloaded;
              summaries.push({
                notePath: note.path,
                replaced: result.replaced,
                downloaded: result.downloaded
              });
            }
          }
        }))
      });

      context.services.logger.debug('Completed external image import batch', {
        scope,
        sourcePath: source?.path,
        completed: report.completed,
        failed: report.failed,
        skipped: report.skipped,
        status: report.status,
        importedLinks,
        downloadedImages
      });
      showOperationNotice(
        context.services.settings.getSettings(),
        formatBatchExternalImageImportNotice({
          items: summaries.map((item) => ({
            notePath: item.notePath,
            replaced: item.replaced
          })),
          importedLinks,
          downloadedImages,
          failedCount: report.failed,
          language: context.services.settings.getSettings().uiLanguage
        })
      );
    } catch (error) {
      console.error('Note Image Manager batch external image import failed', error);
      context.services.logger.error('Batch external image import failed', error, {
        scope,
        sourcePath: source?.path
      });
      new Notice(error instanceof Error ? error.message : getNoticeCopy(context.services.settings.getSettings().uiLanguage).batchExternalImageImportFailed);
    }
  }

  private async runOrphanCleanupBatch(
    context: ImageManagerFeatureContext,
    scope: BatchScope,
    source?: TFile | TFolder
  ): Promise<void> {
    context.services.logger.refreshMode('batch-delete-extra-images');
    if (this.hasActiveBatch(context)) {
      const settings = context.services.settings.getSettings();
      showOperationNotice(settings, getNoticeCopy(settings.uiLanguage).batchJobAlreadyActive);
      return;
    }

    try {
      let result: {
        deletedImages: number;
        deletedFolders: number;
        relocatedImages?: number;
        preservedImages?: number;
      };
      switch (scope) {
        case BatchScope.CURRENT_NOTE:
          if (!(source instanceof TFile)) {
            const settings = context.services.settings.getSettings();
            showOperationNotice(settings, getNoticeCopy(settings.uiLanguage).noActiveNote);
            return;
          }
          result = await context.services.fileManager.deleteOrphanImagesForNote(source);
          break;
        case BatchScope.FOLDER:
          if (!(source instanceof TFolder)) {
            const settings = context.services.settings.getSettings();
            showOperationNotice(settings, getNoticeCopy(settings.uiLanguage).noActiveFolder);
            return;
          }
          result = await context.services.fileManager.deleteOrphanImagesInFolder(source);
          break;
        case BatchScope.VAULT:
        default:
          result = await context.services.fileManager.deleteOrphanImagesInVault();
          break;
      }

      context.services.logger.debug('Completed orphan image cleanup', {
        scope,
        sourcePath: source?.path,
        deletedImages: result.deletedImages,
        deletedFolders: result.deletedFolders,
        relocatedImages: result.relocatedImages ?? 0,
        preservedImages: result.preservedImages ?? 0
      });
      showOperationNotice(
        context.services.settings.getSettings(),
        formatBatchOrphanCleanupNotice({
          deletedImages: result.deletedImages,
          deletedFolders: result.deletedFolders,
          relocatedImages: result.relocatedImages ?? 0,
          preservedImages: result.preservedImages ?? 0,
          failedCount: 0,
          language: context.services.settings.getSettings().uiLanguage
        })
      );
    } catch (error) {
      console.error('Note Image Manager orphan image cleanup failed', error);
      context.services.logger.error('Orphan image cleanup failed', error, {
        scope,
        sourcePath: source?.path
      });
      new Notice(error instanceof Error ? error.message : getNoticeCopy(context.services.settings.getSettings().uiLanguage).orphanCleanupFailed);
    }
  }

  private async runEmptyManagedFolderCleanup(
    context: ImageManagerFeatureContext,
    scope: BatchScope,
    source?: TFile | TFolder
  ): Promise<void> {
    context.services.logger.refreshMode('batch-clean-empty-managed-folders');

    try {
      let deletedFolders = 0;
      switch (scope) {
        case BatchScope.CURRENT_NOTE:
          if (!(source instanceof TFile)) {
            const settings = context.services.settings.getSettings();
            showOperationNotice(settings, getNoticeCopy(settings.uiLanguage).noActiveNoteFile);
            return;
          }
          deletedFolders = await context.services.fileManager.deleteEmptyManagedFoldersForNote(source);
          break;
        case BatchScope.FOLDER:
          if (!(source instanceof TFolder)) {
            const settings = context.services.settings.getSettings();
            showOperationNotice(settings, getNoticeCopy(settings.uiLanguage).noActiveFolder);
            return;
          }
          deletedFolders = await context.services.fileManager.deleteEmptyManagedFoldersInFolder(source);
          break;
        case BatchScope.VAULT:
        default:
          deletedFolders = await context.services.fileManager.deleteEmptyManagedFoldersInVault();
          break;
      }

      context.services.logger.debug('Completed empty managed folder cleanup', {
        scope,
        sourcePath: source?.path,
        deletedFolders
      });
      const settings = context.services.settings.getSettings();
      showOperationNotice(
        settings,
        deletedFolders > 0
          ? getNoticeCopy(settings.uiLanguage).emptyManagedFolderCleanupFinished(deletedFolders)
          : getNoticeCopy(settings.uiLanguage).noEmptyManagedFoldersFound
      );
    } catch (error) {
      console.error('Note Image Manager empty managed folder cleanup failed', error);
      context.services.logger.error('Empty managed folder cleanup failed', error, {
        scope,
        sourcePath: source?.path
      });
      new Notice(error instanceof Error ? error.message : getNoticeCopy(context.services.settings.getSettings().uiLanguage).emptyManagedFolderCleanupFailed);
    }
  }

  private resolveNotes(
    context: ImageManagerFeatureContext,
    scope: BatchScope,
    source?: TFile | TFolder
  ): TFile[] {
    switch (scope) {
      case BatchScope.CURRENT_NOTE:
        return source instanceof TFile && source.extension.toLowerCase() === 'md' ? [source] : [];
      case BatchScope.FOLDER:
        return source instanceof TFolder ? context.services.fileManager.getMarkdownFilesInFolder(source) : [];
      case BatchScope.VAULT:
      default:
        return context.services.fileManager.getMarkdownFilesInVault();
    }
  }

  private hasActiveBatch(context: ImageManagerFeatureContext): boolean {
    const report = context.services.batchProcessor.getReport();
    return report?.status === BatchExecutionStatus.RUNNING || report?.status === BatchExecutionStatus.PAUSED;
  }

  private async withActiveNoteFile(
    context: ImageManagerFeatureContext,
    command: {
      commandId: string;
      commandName: string;
    },
    callback: (file: TFile) => Promise<void>
  ): Promise<void> {
    const view = context.app.workspace.getActiveViewOfType(MarkdownView);
    const file = view?.file;
    if (!(file instanceof TFile) || file.extension.toLowerCase() !== 'md') {
      logSkippedCommand(context, {
        ...command,
        reason: 'No active note file'
      });
      const settings = context.services.settings.getSettings();
      showOperationNotice(settings, getNoticeCopy(settings.uiLanguage).noActiveNoteFile);
      return;
    }

    await callback(file);
  }
}
