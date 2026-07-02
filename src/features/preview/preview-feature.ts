import { editorInfoField, MarkdownView, Menu, TFile } from 'obsidian';
import type { MarkdownFileInfo, MarkdownPostProcessorContext } from 'obsidian';
import { Prec } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { getNoticeCopy, getUiCopy } from '@/i18n';
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
          const settings = context.services.settings.getSettings();
          if (!settings.enableGallery) {
            showOperationNotice(settings, getNoticeCopy(settings.uiLanguage).galleryDisabled);
            return;
          }

          event.preventDefault();
          event.stopPropagation();
          void openSingleImageGallery(context, target, sourceNote, {
            lightboxCloseBehavior: 'close-modal'
          });
        });
      }
    });
    context.plugin.registerEditorExtension(
      Prec.highest(
        EditorView.domEventHandlers({
          click: (event, view) => this.handleEditorImageOpen(context, event, view),
          dblclick: (event, view) => this.handleEditorImageDoubleClick(context, event, view)
        })
      )
    );
  }

  private handleEditorImageOpen(
    context: ImageManagerFeatureContext,
    event: MouseEvent,
    view: EditorView
  ): boolean | undefined {
    return this.openEditorRenderedImageGallery(context, event, view);
  }

  private handleEditorImageDoubleClick(
    context: ImageManagerFeatureContext,
    event: MouseEvent,
    view: EditorView
  ): boolean | undefined {
    return this.openEditorRenderedImageGallery(context, event, view);
  }

  private openEditorRenderedImageGallery(
    context: ImageManagerFeatureContext,
    event: MouseEvent,
    view: EditorView
  ): boolean | undefined {
    const target = this.resolveEditorImageTarget(context, event, view);
    if (!target) {
      return undefined;
    }

    const settings = context.services.settings.getSettings();
    if (!settings.enableGallery) {
      showOperationNotice(settings, getNoticeCopy(settings.uiLanguage).galleryDisabled);
      return undefined;
    }

    event.preventDefault();
    event.stopPropagation();
    void openSingleImageGallery(context, target.imageFile, target.sourceNote, {
      lightboxCloseBehavior: 'close-modal'
    });
    return true;
  }

  private resolveEditorImageTarget(
    context: ImageManagerFeatureContext,
    event: MouseEvent,
    view: EditorView
  ): { readonly imageFile: TFile; readonly sourceNote: TFile } | null {
    const sourceNote = this.resolveEditorSourceNote(context, view);
    if (!sourceNote) {
      return null;
    }

    const rawTargets = this.getRenderedEditorImageTargets(event);
    for (const rawTarget of new Set(rawTargets)) {
      const imageFile = this.resolveImageFileFromRawTarget(context, rawTarget, sourceNote.path);
      if (imageFile) {
        return { imageFile, sourceNote };
      }
    }

    return null;
  }

  private resolveEditorSourceNote(context: ImageManagerFeatureContext, view: EditorView): TFile | null {
    const info = view.state.field(editorInfoField, false);
    const file = this.getMarkdownFileFromInfo(info);
    if (file) {
      return file;
    }

    const activeView = context.app.workspace.getActiveViewOfType(MarkdownView);
    return this.getMarkdownFileFromInfo(activeView ?? undefined);
  }

  private getMarkdownFileFromInfo(info: MarkdownFileInfo | undefined): TFile | null {
    const file = info?.file;
    return file instanceof TFile && file.extension.toLowerCase() === 'md' ? file : null;
  }

  private getRenderedEditorImageTargets(event: MouseEvent): string[] {
    const candidates = getRenderedImageCandidateElements(event);
    const targets: string[] = [];
    for (const candidate of candidates) {
      targets.push(...getRenderedImageTargetValues(candidate));
    }
    return targets;
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
      const ui = getUiCopy(context.services.settings.getSettings().uiLanguage);
      menu.addItem((item) => {
        item.setTitle(ui.contextMenu.downloadExternalImage).setIcon('download').onClick(() => {
          context.services.logger.refreshMode('preview-import-external-image');
          void context.services.recovery.runTransaction(
            {
              label: ui.transactions.contextDownloadExternalImage(sourceNote.basename),
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
                const settings = context.services.settings.getSettings();
                showOperationNotice(settings, getNoticeCopy(settings.uiLanguage).noMatchingExternalImageLink);
                return;
              }

              const settings = context.services.settings.getSettings();
              showOperationNotice(settings, getNoticeCopy(settings.uiLanguage).singleExternalImportFinished(result.replaced, result.downloaded));
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

    return this.resolveImageFileFromRawTarget(context, rawTarget, markdownContext.sourcePath);
  }

  private resolveImageFileFromRawTarget(
    context: ImageManagerFeatureContext,
    rawTarget: string,
    sourcePath: string
  ): TFile | null {
    for (const candidate of getRawLinkResolutionCandidates(rawTarget)) {
      const target = context.app.metadataCache.getFirstLinkpathDest(candidate, sourcePath);
      if (target instanceof TFile && context.services.fileManager.isImageFile(target)) {
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

    const sources = parseTextImageSources(rawSource, {
      allowExtensionlessRemote: true
    });
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

function getElementAttributeValues(element: Element | null, attributes: readonly string[]): string[] {
  if (!element) {
    return [];
  }

  return attributes
    .map((attribute) => element.getAttribute(attribute)?.trim())
    .filter((value): value is string => Boolean(value));
}

function getRenderedImageCandidateElements(event: MouseEvent): Element[] {
  const candidates = new Set<Element>();
  const elements = getEventPathElements(event);
  const target = elements[0] ?? null;
  for (const element of elements) {
    addRenderedImageCandidate(candidates, element);
    for (const selector of ['img', '.internal-embed', '.image-embed']) {
      const closest = element.closest(selector);
      if (closest) {
        addRenderedImageCandidate(candidates, closest);
      }
    }

    if (element === target || isImageWidgetContainer(element)) {
      addRenderedImageDescendants(candidates, element);
      addRenderedImageSiblingCandidates(candidates, element);
    }
  }

  return [...candidates];
}

function getEventPathElements(event: MouseEvent): Element[] {
  const elements: Element[] = [];
  const path = event.composedPath?.() ?? [];
  for (const item of path) {
    if (item instanceof Element) {
      elements.push(item);
    }
  }

  if (event.target instanceof Element && !elements.includes(event.target)) {
    elements.unshift(event.target);
  }

  return elements;
}

function addRenderedImageCandidate(candidates: Set<Element>, element: Element): void {
  if (isRenderedImageElement(element)) {
    candidates.add(element);
  }
}

function isRenderedImageElement(element: Element): boolean {
  return element.matches('img, .internal-embed, .image-embed');
}

function isImageWidgetContainer(element: Element): boolean {
  return element.matches('.cm-widgetBuffer, .cm-embed-block, .cm-line, .internal-embed, .image-embed');
}

function addRenderedImageDescendants(candidates: Set<Element>, element: Element): void {
  for (const descendant of element.querySelectorAll('img, .internal-embed, .image-embed')) {
    addRenderedImageCandidate(candidates, descendant);
  }
}

function addRenderedImageSiblingCandidates(candidates: Set<Element>, element: Element): void {
  for (const sibling of [element.previousElementSibling, element.nextElementSibling]) {
    if (!sibling) {
      continue;
    }

    addRenderedImageCandidate(candidates, sibling);
    addRenderedImageDescendants(candidates, sibling);
  }
}

function getRenderedImageTargetValues(element: Element): string[] {
  if (element.matches('img')) {
    return [
      ...getElementAttributeValues(element.closest('.internal-embed, .image-embed'), [
        'src',
        'data-src',
        'data-path',
        'alt',
        'aria-label'
      ]),
      ...getElementAttributeValues(element, ['data-image-manager-path', 'data-path', 'alt', 'title', 'src'])
    ];
  }

  const image = element.querySelector('img');
  return [
    ...getElementAttributeValues(element, ['src', 'data-src', 'data-path', 'alt', 'aria-label']),
    ...getElementAttributeValues(image, ['data-image-manager-path', 'data-path', 'alt', 'title', 'src'])
  ];
}
