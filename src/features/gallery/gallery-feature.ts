import { MarkdownView } from 'obsidian';
import type { TFile, TFolder } from 'obsidian';
import type { ImageManagerFeature, ImageManagerFeatureContext } from '@/types/index';
import { ImageGalleryModal } from '@/ui/modals/image-gallery-modal';
import { executeLoggedCommand, logSkippedCommand } from '@/utils/command-logging';
import { showOperationNotice } from '@/utils/operation-feedback';
import { sortImages } from '@/utils/image-manager';

export class GalleryFeature implements ImageManagerFeature {
  readonly id = 'gallery';
  readonly name = 'Gallery';
  readonly summary = 'Preview note and folder images with filtering, sorting, and grid/list view modes.';
  readonly state = 'implemented' as const;

  async register(context: ImageManagerFeatureContext): Promise<void> {
    const noteCommand = {
      commandId: 'open-current-note-gallery',
      commandName: '当前笔记：打开图片画廊'
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
      commandName: '当前文件夹：打开图片画廊'
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
    await this.openGallery(context, `Images in ${noteFile.basename}`, files);
  }

  async openFolderGallery(context: ImageManagerFeatureContext, folder: TFolder): Promise<void> {
    await this.openGallery(context, `Images in ${folder.path || 'vault root'}`, context.services.fileManager.getImagesInFolder(folder));
  }

  private async openGallery(
    context: ImageManagerFeatureContext,
    title: string,
    files: TFile[]
  ): Promise<void> {
    const settings = context.services.settings.getSettings();
    const images = await Promise.all(files.map((file) => context.services.imageProcessor.getImageInfo(file)));
    new ImageGalleryModal(context.app, {
      title,
      images: sortImages(images, settings.gallerySortBy),
      defaultSortBy: settings.gallerySortBy,
      defaultGridSize: settings.galleryGridSize
    }).open();
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
}
