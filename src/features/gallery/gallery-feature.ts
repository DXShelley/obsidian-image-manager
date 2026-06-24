import { MarkdownView, TFile } from 'obsidian';
import type { TFolder } from 'obsidian';
import type { ImageManagerFeature, ImageManagerFeatureContext } from '@/types/index';
import { openGalleryForFiles, openSingleImageGallery } from '@/features/gallery/gallery-actions';
import { executeLoggedCommand, logSkippedCommand } from '@/utils/command-logging';
import { showOperationNotice } from '@/utils/operation-feedback';

export class GalleryFeature implements ImageManagerFeature {
  readonly id = 'gallery';
  readonly name = 'Gallery';
  readonly summary = 'Preview note and folder images with filtering, sorting, and grid/list view modes.';
  readonly state = 'implemented' as const;

  async register(context: ImageManagerFeatureContext): Promise<void> {
    const imageCommand = {
      commandId: 'open-active-image-gallery',
      commandName: '打开当前图片画廊'
    } as const;
    context.plugin.addCommand({
      id: imageCommand.commandId,
      name: imageCommand.commandName,
      callback: () => {
        void executeLoggedCommand(context, imageCommand, async () => {
          if (!this.ensureGalleryEnabled(context, imageCommand)) {
            return;
          }

          const file = context.app.workspace.getActiveFile();
          if (!(file instanceof TFile) || !context.services.fileManager.isImageFile(file)) {
            logSkippedCommand(context, {
              ...imageCommand,
              reason: 'No active image file'
            });
            showOperationNotice(context.services.settings.getSettings(), 'Open an image file first');
            return;
          }

          await openSingleImageGallery(context, file);
        });
      }
    });

    const noteCommand = {
      commandId: 'open-current-note-gallery',
      commandName: '打开图片画廊'
    } as const;
    context.plugin.addCommand({
      id: noteCommand.commandId,
      name: noteCommand.commandName,
      callback: () => {
        void executeLoggedCommand(context, noteCommand, async () => {
          if (!this.ensureGalleryEnabled(context, noteCommand)) {
            return;
          }

          const view = context.app.workspace.getActiveViewOfType(MarkdownView);
          if (!view?.file) {
            logSkippedCommand(context, {
              ...noteCommand,
              reason: 'No active note'
            });
            showOperationNotice(context.services.settings.getSettings(), 'No active note');
            return;
          }

          await this.openNoteGallery(context, view.file);
        });
      }
    });

    const folderCommand = {
      commandId: 'open-current-folder-gallery',
      commandName: '打开图片画廊'
    } as const;
    context.plugin.addCommand({
      id: folderCommand.commandId,
      name: folderCommand.commandName,
      callback: () => {
        void executeLoggedCommand(context, folderCommand, async () => {
          if (!this.ensureGalleryEnabled(context, folderCommand)) {
            return;
          }

          const folder = context.app.workspace.getActiveFile()?.parent;
          if (!folder) {
            logSkippedCommand(context, {
              ...folderCommand,
              reason: 'No active folder'
            });
            showOperationNotice(context.services.settings.getSettings(), 'No active folder');
            return;
          }

          await this.openFolderGallery(context, folder);
        });
      }
    });
  }

  async openNoteGallery(context: ImageManagerFeatureContext, noteFile: TFile): Promise<void> {
    const files = await context.services.fileManager.getImagesInNote(noteFile);
    await openGalleryForFiles(context, {
      title: `Images in ${noteFile.basename}`,
      files,
      linkSourceFile: noteFile
    });
  }

  async openFolderGallery(context: ImageManagerFeatureContext, folder: TFolder): Promise<void> {
    await openGalleryForFiles(context, {
      title: `Images in ${folder.path || 'vault root'}`,
      files: context.services.fileManager.getImagesInFolder(folder),
      linkSourceFile: this.getActiveMarkdownFile(context)
    });
  }

  private ensureGalleryEnabled(
    context: ImageManagerFeatureContext,
    command: {
      commandId: string;
      commandName: string;
    }
  ): boolean {
    if (context.services.settings.getSettings().enableGallery) {
      return true;
    }

    logSkippedCommand(context, {
      ...command,
      reason: 'Gallery is disabled'
    });
    showOperationNotice(context.services.settings.getSettings(), 'Gallery is disabled in settings');
    return false;
  }

  private getActiveMarkdownFile(context: ImageManagerFeatureContext): TFile | null {
    const view = context.app.workspace.getActiveViewOfType(MarkdownView);
    return view?.file instanceof TFile ? view.file : null;
  }
}
