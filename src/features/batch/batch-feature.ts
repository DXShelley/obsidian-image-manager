import { MarkdownView, Notice, TFile, TFolder } from 'obsidian';
import type { ImageManagerFeature, ImageManagerFeatureContext } from '@/types/index';
import { BatchExecutionStatus, BatchOperation, BatchScope } from '@/types/index';
import { executeLoggedCommand, logSkippedCommand } from '@/utils/command-logging';
import { showOperationNotice } from '@/utils/operation-feedback';

export class BatchFeature implements ImageManagerFeature {
  readonly id = 'batch';
  readonly name = 'Batch Processor';
  readonly summary = 'Normalize image links and placement for the current note, folder, or entire vault.';
  readonly state = 'implemented' as const;

  async register(context: ImageManagerFeatureContext): Promise<void> {
    const noteCommand = {
      commandId: 'batch-update-current-note-image-links',
      commandName: '当前笔记：更新图片链接与目录'
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
            showOperationNotice(context.services.settings.getSettings(), 'No active note');
            return;
          }
          const noteFile = view.file;

          await context.services.recovery.runTransaction(
            {
              label: `批量更新笔记图片链接 ${noteFile.basename}`,
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

    const folderCommand = {
      commandId: 'batch-update-current-folder-image-links',
      commandName: '当前文件夹：更新图片链接与目录'
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
            showOperationNotice(context.services.settings.getSettings(), 'No active folder');
            return;
          }

          await context.services.recovery.runTransaction(
            {
              label: `批量更新文件夹图片链接 ${folder.path || 'vault root'}`,
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

    const vaultCommand = {
      commandId: 'batch-update-vault-image-links',
      commandName: '整个仓库：更新图片链接与目录'
    } as const;
    context.plugin.addCommand({
      id: vaultCommand.commandId,
      name: vaultCommand.commandName,
      callback: () => {
        void executeLoggedCommand(context, vaultCommand, async () => {
          await context.services.recovery.runTransaction(
            {
              label: '批量更新整个仓库图片链接',
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
  }

  private async runLinkRewriteBatch(
    context: ImageManagerFeatureContext,
    scope: BatchScope,
    source?: TFile | TFolder
  ): Promise<void> {
    context.services.logger.refreshMode('batch-update-links');
    if (this.hasActiveBatch(context)) {
      showOperationNotice(context.services.settings.getSettings(), 'An image batch job is already active');
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
      const report = await context.services.batchProcessor.run({
        id: `${scope}-update-links-${Date.now()}`,
        scope,
        operation: BatchOperation.UPDATE_LINKS,
        tasks: notes.map((note) => ({
          id: note.path,
          label: note.path,
          run: async () => {
            const result = await context.services.fileManager.rewriteImageLinksInNote(note, allowedNotePaths);
            if (result.replaced > 0 || result.moved > 0) {
              rewrittenNotes += 1;
              rewrittenLinks += result.replaced;
              movedImages += result.moved;
              downloadedImages += result.downloaded;
            }
          }
        }))
      });

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
        downloadedImages
      });
      showOperationNotice(
        context.services.settings.getSettings(),
        report.failed > 0
          ? `Updated image links in ${rewrittenNotes} note(s), ${report.failed} failed`
          : downloadedImages > 0
            ? `Updated ${rewrittenLinks} image link(s), downloaded ${downloadedImages} image(s), and moved ${movedImages} image(s) in ${rewrittenNotes} note(s)`
            : `Updated ${rewrittenLinks} image link(s) and moved ${movedImages} image(s) in ${rewrittenNotes} note(s)`
      );
    } catch (error) {
      console.error('Image Manager batch link rewrite failed', error);
      context.services.logger.error('Batch link rewrite failed', error, {
        scope,
        sourcePath: source?.path
      });
      new Notice(error instanceof Error ? error.message : 'Batch link rewrite failed');
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
}
