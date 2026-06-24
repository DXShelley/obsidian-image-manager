import { MarkdownView, TFile } from 'obsidian';
import { LinkFormat, PathFormat, type ImageInfo, type ImageManagerFeatureContext } from '@/types/index';
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
}

export async function openGalleryForFiles(
  context: ImageManagerFeatureContext,
  options: OpenGalleryOptions
): Promise<void> {
  const settings = context.services.settings.getSettings();
  const images = await Promise.all(options.files.map((file) => context.services.imageProcessor.getImageInfo(file)));
  new ImageGalleryModal(context.app, {
    title: options.title,
    images: sortImages(images, settings.gallerySortBy),
    defaultSortBy: settings.gallerySortBy,
    defaultGridSize: settings.galleryGridSize,
    initialSelectedImagePath: options.initialSelectedImagePath,
    onCopyMarkdownLink: async (image) => {
      await copyMarkdownImageLink(context, image, options.linkSourceFile);
    },
    onCopyImageToClipboard: async (image) => {
      await copyImageToClipboard(context, image);
    }
  }).open();
}

export async function openSingleImageGallery(
  context: ImageManagerFeatureContext,
  imageFile: TFile,
  linkSourceFile?: TFile | null
): Promise<void> {
  const sourceNote = resolveSingleImageGallerySourceFile(context, imageFile.path, linkSourceFile);
  if (sourceNote) {
    const files = await context.services.fileManager.getImagesInNote(sourceNote);
    if (files.some((file) => file.path === imageFile.path)) {
      await openGalleryForFiles(context, {
        title: `Images in ${sourceNote.basename}`,
        files,
        initialSelectedImagePath: imageFile.path,
        linkSourceFile: sourceNote
      });
      return;
    }
  }

  await openGalleryForFiles(context, {
    title: `Image: ${imageFile.name}`,
    files: [imageFile],
    initialSelectedImagePath: imageFile.path,
    linkSourceFile
  });
}

async function copyMarkdownImageLink(
  context: ImageManagerFeatureContext,
  image: ImageInfo,
  preferredSourceFile?: TFile | null
): Promise<void> {
  const settings = context.services.settings.getSettings();
  if (typeof navigator === 'undefined' || typeof navigator.clipboard?.writeText !== 'function') {
    showOperationNotice(settings, 'Copy markdown link is not available on this platform');
    return;
  }

  const file = resolveImageFile(context, image.path);
  if (!file) {
    showOperationNotice(settings, 'Image file is no longer available');
    return;
  }

  const sourceFile = resolveMarkdownSourceFile(context, preferredSourceFile);
  const link = context.services.linkFormatter.formatLink(file.path, sourceFile ?? file, {
    format: LinkFormat.MARKDOWN,
    pathFormat: sourceFile ? settings.defaultPathFormat : PathFormat.ABSOLUTE,
    markdownPathEncodingStrategy: settings.markdownPathEncodingStrategy
  });
  await navigator.clipboard.writeText(link);
  showOperationNotice(settings, 'Markdown image link copied');
}

async function copyImageToClipboard(context: ImageManagerFeatureContext, image: ImageInfo): Promise<void> {
  const settings = context.services.settings.getSettings();
  if (!canWriteImageToClipboard()) {
    showOperationNotice(settings, 'Copy image is not available on this platform');
    return;
  }

  const file = resolveImageFile(context, image.path);
  if (!file) {
    showOperationNotice(settings, 'Image file is no longer available');
    return;
  }

  try {
    const mimeType = await writeImageFileToClipboard(context.app, context.services.imageProcessor, file);
    context.services.logger.debug('Copied image to clipboard', {
      filePath: file.path,
      mimeType
    });
    showOperationNotice(settings, 'Image copied');
  } catch (error) {
    context.services.logger.error('Failed to copy image to clipboard', error, {
      filePath: file.path
    });
    showOperationNotice(settings, 'Failed to copy image to clipboard');
  }
}

function resolveImageFile(context: ImageManagerFeatureContext, imagePath: string): TFile | null {
  const abstract = context.app.vault.getAbstractFileByPath(imagePath);
  return abstract instanceof TFile ? abstract : null;
}

function resolveMarkdownSourceFile(
  context: ImageManagerFeatureContext,
  preferredSourceFile?: TFile | null
): TFile | null {
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
