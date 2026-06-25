import { Menu, TFile } from 'obsidian';
import type { MarkdownPostProcessorContext } from 'obsidian';
import { openSingleImageGallery } from '@/features/gallery/gallery-actions';
import type { ImageManagerFeature, ImageManagerFeatureContext } from '@/types/index';
import { Alignment } from '@/types/index';
import { getRawLinkResolutionCandidates } from '@/utils/link-resolution';
import { showOperationNotice } from '@/utils/operation-feedback';
import { parseTextImageSources } from '@/utils/pasted-image-source';

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
        const sourceNote = this.resolveSourceNote(context, markdownContext);
        const target = this.resolveLinkedImageFile(context, markdownContext, image);
        if (!(target instanceof TFile) || !context.services.fileManager.isImageFile(target)) {
          this.registerExternalImageContextMenu(context, element, markdownContext, image, sourceNote);
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
          void openSingleImageGallery(context, target, sourceNote);
        });
      }
    });
  }

  private registerExternalImageContextMenu(
    context: ImageManagerFeatureContext,
    sectionElement: HTMLElement,
    markdownContext: MarkdownPostProcessorContext,
    image: HTMLImageElement,
    sourceNote: TFile | null
  ): void {
    const externalSource = this.getImportableExternalImageSource(image);
    if (!externalSource || !sourceNote) {
      return;
    }

    image.addEventListener('contextmenu', (event: MouseEvent) => {
      if (!context.services.settings.getSettings().enableContextMenu) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const menu = new Menu();
      menu.addItem((item) => {
        item.setTitle('下载该外部图片到本地').setIcon('download').onClick(() => {
          context.services.logger.refreshMode('preview-import-external-image');
          void context.services.recovery.runTransaction(
            {
              label: `右键下载外部图片 ${sourceNote.basename}`,
              trigger: 'context-menu',
              scope: 'single-note'
            },
            async () => {
              const sectionInfo = markdownContext.getSectionInfo?.(image);
              const occurrence = this.getExternalImageOccurrenceInSection(sectionElement, image, externalSource);
              const location =
                sectionInfo || occurrence > 1
                  ? {
                      lineStart: sectionInfo?.lineStart,
                      lineEnd: sectionInfo?.lineEnd,
                      occurrence
                    }
                  : undefined;
              const result = location
                ? await context.services.fileManager.importExternalImageLinkInNoteBySource(
                    sourceNote,
                    externalSource,
                    location
                  )
                : await context.services.fileManager.importExternalImageLinkInNoteBySource(
                    sourceNote,
                    externalSource
                  );
              if (result.replaced === 0 && result.downloaded === 0) {
                showOperationNotice(
                  context.services.settings.getSettings(),
                  'No matching external image link found in the note'
                );
                return;
              }

              showOperationNotice(
                context.services.settings.getSettings(),
                `External image import finished: ${result.replaced} link(s) updated, downloaded ${result.downloaded} image(s)`
              );
            }
          );
        });
      });
      menu.showAtMouseEvent(event);
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

  private getImportableExternalImageSource(image: HTMLImageElement): string | null {
    const rawSource = image.getAttribute('src')?.trim();
    if (!rawSource) {
      return null;
    }

    const sources = parseTextImageSources(rawSource);
    const [source] = sources;
    return sources.length === 1 && source ? source.value : null;
  }

  private getExternalImageOccurrenceInSection(
    sectionElement: HTMLElement,
    targetImage: HTMLImageElement,
    externalSource: string
  ): number {
    let occurrence = 0;
    for (const image of sectionElement.querySelectorAll('img')) {
      if (this.getImportableExternalImageSource(image) === externalSource) {
        occurrence += 1;
      }
      if (image === targetImage) {
        return Math.max(occurrence, 1);
      }
    }
    return 1;
  }
}
