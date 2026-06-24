import { TFile } from 'obsidian';
import type { MarkdownPostProcessorContext } from 'obsidian';
import { openSingleImageGallery } from '@/features/gallery/gallery-actions';
import type { ImageManagerFeature, ImageManagerFeatureContext } from '@/types/index';
import { Alignment } from '@/types/index';
import { getRawLinkResolutionCandidates } from '@/utils/link-resolution';
import { showOperationNotice } from '@/utils/operation-feedback';

export class PreviewFeature implements ImageManagerFeature {
  readonly id = 'preview';
  readonly name = 'Preview Decoration';
  readonly summary = 'Tag rendered images for gallery and preview styling hooks.';
  readonly state = 'implemented' as const;

  async register(context: ImageManagerFeatureContext): Promise<void> {
    context.plugin.registerMarkdownPostProcessor((element, markdownContext) => {
      for (const image of element.querySelectorAll('img')) {
        image.addClass('image-manager-managed');
        this.applyPreviewSettings(context, image);
        const target = this.resolveLinkedImageFile(context, markdownContext, image);
        if (!(target instanceof TFile) || !context.services.fileManager.isImageFile(target)) {
          continue;
        }

        image.setAttribute('src', this.buildFreshResourcePath(context, target));
        image.setAttribute('data-image-manager-path', target.path);
        image.addEventListener('dblclick', (event) => {
          if (!context.services.settings.getSettings().enableGallery) {
            showOperationNotice(context.services.settings.getSettings(), 'Gallery is disabled in settings');
            return;
          }

          event.preventDefault();
          event.stopPropagation();
          void openSingleImageGallery(context, target, this.resolveSourceNote(context, markdownContext));
        });
      }
    });
  }

  private resolveLinkedImageFile(
    context: ImageManagerFeatureContext,
    markdownContext: MarkdownPostProcessorContext,
    image: HTMLImageElement
  ): TFile | null {
    const rawTarget =
      image.closest('.internal-embed')?.getAttribute('src') ??
      image.closest('a.internal-link')?.getAttribute('href') ??
      image.getAttribute('data-path');
    if (!rawTarget) {
      return null;
    }

    for (const candidate of getRawLinkResolutionCandidates(rawTarget)) {
      const target = context.app.metadataCache.getFirstLinkpathDest(candidate, markdownContext.sourcePath);
      if (target instanceof TFile) {
        return target;
      }
    }

    return null;
  }

  private buildFreshResourcePath(context: ImageManagerFeatureContext, file: TFile): string {
    const base = context.app.vault.getResourcePath(file);
    const separator = base.includes('?') ? '&' : '?';
    return `${base}${separator}image-manager-mtime=${file.stat.mtime}`;
  }

  private applyPreviewSettings(context: ImageManagerFeatureContext, image: HTMLImageElement): void {
    const settings = context.services.settings.getSettings();
    image.removeClass('image-manager-align-left', 'image-manager-align-center', 'image-manager-align-right');

    if (settings.enableImageAlign) {
      switch (settings.imageAlignmentDefaultAlignment) {
        case Alignment.LEFT:
          image.addClass('image-manager-align-left');
          break;
        case Alignment.CENTER:
          image.addClass('image-manager-align-center');
          break;
        case Alignment.RIGHT:
          image.addClass('image-manager-align-right');
          break;
        case Alignment.NONE:
        default:
          break;
      }
    }

    if (settings.disableObsidianImageSelectionOnClick) {
      image.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
      });
    }
  }

  private resolveSourceNote(
    context: ImageManagerFeatureContext,
    markdownContext: MarkdownPostProcessorContext
  ): TFile | null {
    const abstract = context.app.vault.getAbstractFileByPath(markdownContext.sourcePath);
    return abstract instanceof TFile && abstract.extension.toLowerCase() === 'md' ? abstract : null;
  }
}
