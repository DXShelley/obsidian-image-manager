import { MarkdownView, TFile } from 'obsidian';
import type { TFolder } from 'obsidian';
import { getDefaultCommandName, getNoticeCopy, getUiCopy } from '@/i18n';
import type { ImageManagerFeature, ImageManagerFeatureContext } from '@/types/index';
import { openGalleryForFiles } from '@/features/gallery/gallery-actions';
import { executeLoggedCommand, logSkippedCommand } from '@/utils/command-logging';
import { showOperationNotice } from '@/utils/operation-feedback';

export class GalleryFeature implements ImageManagerFeature {
  readonly id = 'gallery';
  readonly name = 'Gallery';
  readonly summary = 'Preview note and folder images with filtering, sorting, and grid/list view modes.';
  readonly state = 'implemented' as const;

  async register(context: ImageManagerFeatureContext): Promise<void> {
    const noteCommand = {
      commandId: 'open-current-note-gallery',
      commandName: getDefaultCommandName('open-current-note-gallery')
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
            const settings = context.services.settings.getSettings();
            showOperationNotice(settings, getNoticeCopy(settings.uiLanguage).noActiveNote);
            return;
          }

          await this.openNoteGallery(context, view.file);
        });
      }
    });

    const folderCommand = {
      commandId: 'open-current-folder-gallery',
      commandName: getDefaultCommandName('open-current-folder-gallery')
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
            const settings = context.services.settings.getSettings();
            showOperationNotice(settings, getNoticeCopy(settings.uiLanguage).noActiveFolder);
            return;
          }

          await this.openFolderGallery(context, folder);
        });
      }
    });
  }

  async openNoteGallery(context: ImageManagerFeatureContext, noteFile: TFile): Promise<void> {
    const files = await context.services.fileManager.getImagesInNote(noteFile);
    const language = context.services.settings.getSettings().uiLanguage;
    await openGalleryForFiles(context, {
      title: getUiCopy(language).gallery.titleForNote(noteFile.basename),
      files,
      linkSourceFile: noteFile
    });
  }

  async openFolderGallery(context: ImageManagerFeatureContext, folder: TFolder): Promise<void> {
    const language = context.services.settings.getSettings().uiLanguage;
    const ui = getUiCopy(language);
    await openGalleryForFiles(context, {
      title: ui.gallery.titleForFolder(folder.path || ui.common.vaultRoot),
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
    const settings = context.services.settings.getSettings();
    showOperationNotice(settings, getNoticeCopy(settings.uiLanguage).galleryDisabled);
    return false;
  }

  private getActiveMarkdownFile(context: ImageManagerFeatureContext): TFile | null {
    const view = context.app.workspace.getActiveViewOfType(MarkdownView);
    return view?.file instanceof TFile ? view.file : null;
  }
}
