import { MarkdownView, TFile } from 'obsidian';
import { getNoticeCopy, getUiCopy } from '@/i18n';
import type { ImageInfo, ImageManagerFeatureContext } from '@/types/index';
import { ImageGalleryModal } from '@/ui/modals/image-gallery-modal';
import { writeImageFileToClipboard } from '@/utils/clipboard';
import { canWriteImageToClipboard } from '@/utils/compatibility';
import { showOperationNotice } from '@/utils/operation-feedback';
import { sortImages } from '@/utils/image-manager';

interface OpenGalleryOptions {
  readonly title: string;
  readonly files: readonly TFile[];
  readonly initialSelectedImagePath?: string;
  readonly linkSourceFile?: TFile | null;
  readonly lightboxCloseBehavior?: 'return-to-gallery' | 'close-modal';
}

interface OpenSingleImageGalleryOptions {
  readonly lightboxCloseBehavior?: 'return-to-gallery' | 'close-modal';
}

export async function openGalleryForFiles(
  context: ImageManagerFeatureContext,
  options: OpenGalleryOptions
): Promise<void> {
  const settings = context.services.settings.getSettings();
  const ui = getUiCopy(settings.uiLanguage);
  const images = await Promise.all(options.files.map((file) => context.services.imageProcessor.getImageInfo(file)));
  new ImageGalleryModal(context.app, {
    title: options.title,
    ui: ui.gallery,
    images: sortImages(images, settings.gallerySortBy),
    defaultSortBy: settings.gallerySortBy,
    defaultGridSize: settings.galleryGridSize,
    initialSelectedImagePath: options.initialSelectedImagePath,
    lightboxCloseBehavior: options.lightboxCloseBehavior,
    onCopyImageToClipboard: async (image) => {
      await copyImageToClipboard(context, image);
    }
  }).open();
}

export async function openSingleImageGallery(
  context: ImageManagerFeatureContext,
  imageFile: TFile,
  linkSourceFile?: TFile | null,
  options?: OpenSingleImageGalleryOptions
): Promise<void> {
  const sourceNote = resolveSingleImageGallerySourceFile(context, imageFile.path, linkSourceFile);
  if (sourceNote) {
    const files = await context.services.fileManager.getImagesInNote(sourceNote);
    if (files.some((file) => file.path === imageFile.path)) {
      const ui = getUiCopy(context.services.settings.getSettings().uiLanguage);
      await openGalleryForFiles(context, {
        title: ui.gallery.titleForNote(sourceNote.basename),
        files,
        initialSelectedImagePath: imageFile.path,
        linkSourceFile: sourceNote,
        lightboxCloseBehavior: options?.lightboxCloseBehavior
      });
      return;
    }
  }

  const ui = getUiCopy(context.services.settings.getSettings().uiLanguage);
  await openGalleryForFiles(context, {
    title: ui.gallery.titleForImage(imageFile.name),
    files: [imageFile],
    initialSelectedImagePath: imageFile.path,
    linkSourceFile,
    lightboxCloseBehavior: options?.lightboxCloseBehavior
  });
}

async function copyImageToClipboard(context: ImageManagerFeatureContext, image: ImageInfo): Promise<void> {
  const settings = context.services.settings.getSettings();
  const notices = getNoticeCopy(settings.uiLanguage);
  if (!canWriteImageToClipboard()) {
    showOperationNotice(settings, notices.copyImageUnavailable);
    return;
  }

  const file = resolveImageFile(context, image.path);
  if (!file) {
    showOperationNotice(settings, notices.imageFileUnavailable);
    return;
  }

  try {
    const mimeType = await writeImageFileToClipboard(context.app, context.services.imageProcessor, file);
    context.services.logger.debug('Copied image to clipboard', {
      filePath: file.path,
      mimeType
    });
    showOperationNotice(settings, notices.imageCopied);
  } catch (error) {
    context.services.logger.error('Failed to copy image to clipboard', error, {
      filePath: file.path
    });
    showOperationNotice(settings, notices.failedToCopyImage);
  }
}

function resolveImageFile(context: ImageManagerFeatureContext, imagePath: string): TFile | null {
  const abstract = context.app.vault.getAbstractFileByPath(imagePath);
  return abstract instanceof TFile ? abstract : null;
}

function resolveMarkdownSourceFile(context: ImageManagerFeatureContext, preferredSourceFile?: TFile | null): TFile | null {
  if (preferredSourceFile instanceof TFile && preferredSourceFile.extension.toLowerCase() === 'md') {
    return preferredSourceFile;
  }

  const view = context.app.workspace.getActiveViewOfType(MarkdownView);
  return view?.file instanceof TFile && view.file.extension.toLowerCase() === 'md' ? view.file : null;
}

function resolveSingleImageGallerySourceFile(
  context: ImageManagerFeatureContext,
  imagePath: string,
  preferredSourceFile?: TFile | null
): TFile | null {
  const preferred = resolveMarkdownSourceFile(context, preferredSourceFile);
  if (preferred) {
    return preferred;
  }

  const referrers = getReferencingMarkdownNotes(context, imagePath);
  return referrers.length === 1 ? (referrers[0] ?? null) : null;
}

function getReferencingMarkdownNotes(
  context: ImageManagerFeatureContext,
  imagePath: string
): TFile[] {
  const resolvedLinks = context.app.metadataCache?.resolvedLinks ?? {};
  const notes: TFile[] = [];

  for (const [sourcePath, links] of Object.entries(resolvedLinks)) {
    if ((links[imagePath] ?? 0) <= 0) {
      continue;
    }

    const abstract = context.app.vault.getAbstractFileByPath(sourcePath);
    if (abstract instanceof TFile && abstract.extension.toLowerCase() === 'md') {
      notes.push(abstract);
    }
  }

  return notes;
}
