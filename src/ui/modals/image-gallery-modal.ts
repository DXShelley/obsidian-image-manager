import { Modal } from 'obsidian';
import type { App } from 'obsidian';
import { GallerySortBy, type ImageInfo } from '@/types/index';
import type { GalleryGridSize } from '@/types/index';
import { sortImages } from '@/utils/image-manager';

interface ImageGalleryModalOptions {
  title: string;
  images: ImageInfo[];
  defaultSortBy: GallerySortBy;
  defaultGridSize: GalleryGridSize;
  initialSelectedImagePath?: string;
  onCopyMarkdownLink?: (image: ImageInfo) => Promise<void>;
  onCopyImageToClipboard?: (image: ImageInfo) => Promise<void>;
}

type ViewMode = 'grid' | 'list';

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export class ImageGalleryModal extends Modal {
  private readonly title: string;
  private readonly images: ImageInfo[];
  private sortBy: GallerySortBy;
  private readonly gridSize: GalleryGridSize;
  private readonly initialSelectedImagePath: string | null;
  private readonly onCopyMarkdownLink?: (image: ImageInfo) => Promise<void>;
  private readonly onCopyImageToClipboard?: (image: ImageInfo) => Promise<void>;
  private filterText = '';
  private viewMode: ViewMode = 'grid';
  private filteredImages: ImageInfo[] = [];
  private selectedImagePath: string | null = null;
  private resultsEl!: HTMLElement;
  private lightboxEl!: HTMLElement;
  private lightboxImageEl!: HTMLImageElement;
  private lightboxTitleEl!: HTMLElement;
  private lightboxMetaEl!: HTMLElement;
  private lightboxCounterEl!: HTMLElement;
  private lightboxActionsEl!: HTMLElement;
  private lightboxPrevButton!: HTMLButtonElement;
  private lightboxNextButton!: HTMLButtonElement;

  constructor(app: App, options: ImageGalleryModalOptions) {
    super(app);
    this.title = options.title;
    this.images = options.images;
    this.sortBy = options.defaultSortBy;
    this.gridSize = options.defaultGridSize;
    this.initialSelectedImagePath = options.initialSelectedImagePath ?? null;
    this.onCopyMarkdownLink = options.onCopyMarkdownLink;
    this.onCopyImageToClipboard = options.onCopyImageToClipboard;
  }

  override onOpen(): void {
    this.selectedImagePath = this.initialSelectedImagePath;
    this.contentEl.empty();
    this.contentEl.addClass('image-manager-gallery');
    this.contentEl.createEl('h2', { text: this.title });

    const toolbar = this.contentEl.createDiv({ cls: 'image-manager-gallery-toolbar' });
    const search = toolbar.createEl('input', {
      cls: 'image-manager-gallery-search',
      type: 'search',
      placeholder: 'Filter images by name'
    });
    search.addEventListener('input', () => {
      this.filterText = search.value.trim().toLowerCase();
      this.renderResults();
    });

    const sortSelect = toolbar.createEl('select', { cls: 'image-manager-gallery-select' });
    [
      [GallerySortBy.DATE, 'Newest first'],
      [GallerySortBy.NAME, 'Name'],
      [GallerySortBy.SIZE, 'Largest first']
    ].forEach(([value, label]) => {
      const option = sortSelect.createEl('option', { value, text: label });
      option.selected = value === this.sortBy;
    });
    sortSelect.addEventListener('change', () => {
      this.sortBy = sortSelect.value as GallerySortBy;
      this.renderResults();
    });

    const viewToggle = toolbar.createDiv({ cls: 'image-manager-gallery-toggle' });
    for (const [mode, label] of [
      ['grid', 'Grid'],
      ['list', 'List']
    ] as const) {
      const button = viewToggle.createEl('button', {
        cls: `image-manager-gallery-button${mode === this.viewMode ? ' is-active' : ''}`,
        text: label
      });
      button.type = 'button';
      button.addEventListener('click', () => {
        this.viewMode = mode;
        for (const sibling of viewToggle.querySelectorAll('button')) {
          sibling.removeClass('is-active');
        }
        button.addClass('is-active');
        this.renderResults();
      });
    }

    this.resultsEl = this.contentEl.createDiv({ cls: 'image-manager-gallery-results' });
    this.buildLightbox();
    this.renderResults();
  }

  private renderResults(): void {
    this.resultsEl.empty();
    const filtered = sortImages(
      this.images.filter((image) => image.name.toLowerCase().includes(this.filterText)),
      this.sortBy
    );
    this.filteredImages = filtered;

    const container = this.resultsEl.createDiv({
      cls: `image-manager-gallery-${this.viewMode} image-manager-gallery-${this.viewMode}--${this.gridSize}`
    });

    filtered.forEach((image, index) => {
      const item = container.createDiv({ cls: 'image-manager-gallery-item' });
      if (image.path === this.selectedImagePath) {
        item.addClass('is-selected');
      }
      if (image.resourcePath) {
        item.addClass('image-manager-gallery-item--clickable');
        item.addEventListener('click', () => {
          this.openLightbox(index);
        });
      }
      if (image.resourcePath) {
        item.createEl('img', {
          cls: 'image-manager-gallery-thumb',
          attr: { src: image.resourcePath, alt: image.name }
        });
      }
      const meta = item.createDiv({ cls: 'image-manager-gallery-meta' });
      meta.createEl('div', { text: image.name, cls: 'image-manager-gallery-name' });
      meta.createEl('div', {
        text: `${formatBytes(image.size)} ${image.width ?? '?'}x${image.height ?? '?'}`
      });
      this.renderItemActions(item, image);
    });

    if (filtered.length === 0) {
      this.resultsEl.createEl('p', { text: 'No images match the current filter.' });
    }

    if (this.selectedImagePath && !filtered.some((image) => image.path === this.selectedImagePath)) {
      this.closeLightbox();
      return;
    }

    if (this.selectedImagePath) {
      this.renderLightbox();
    }
  }

  private buildLightbox(): void {
    this.lightboxEl = this.contentEl.createDiv({ cls: 'image-manager-gallery-lightbox' });
    this.lightboxEl.addEventListener('click', (event) => {
      if (event.target === this.lightboxEl) {
        this.closeLightbox();
      }
    });

    const panel = this.lightboxEl.createDiv({ cls: 'image-manager-gallery-lightbox__panel' });
    const header = panel.createDiv({ cls: 'image-manager-gallery-lightbox__header' });
    const titleWrap = header.createDiv({ cls: 'image-manager-gallery-lightbox__title' });
    this.lightboxTitleEl = titleWrap.createEl('strong', { text: '' });
    this.lightboxMetaEl = titleWrap.createEl('span', { text: '' });
    const controls = header.createDiv({ cls: 'image-manager-gallery-lightbox__controls' });
    this.lightboxCounterEl = controls.createEl('span', {
      cls: 'image-manager-gallery-lightbox__counter',
      text: ''
    });
    this.lightboxActionsEl = controls.createDiv({ cls: 'image-manager-gallery-lightbox__actions' });
    const closeButton = controls.createEl('button', {
      cls: 'image-manager-gallery-lightbox__close',
      text: 'Close'
    });
    closeButton.type = 'button';
    closeButton.addEventListener('click', () => this.closeLightbox());

    const body = panel.createDiv({ cls: 'image-manager-gallery-lightbox__body' });
    this.lightboxPrevButton = body.createEl('button', {
      cls: 'image-manager-gallery-lightbox__nav',
      text: 'Prev'
    });
    this.lightboxPrevButton.type = 'button';
    this.lightboxPrevButton.addEventListener('click', () => this.stepLightbox(-1));

    this.lightboxImageEl = body.createEl('img', {
      cls: 'image-manager-gallery-lightbox__image',
      attr: { alt: '' }
    });

    this.lightboxNextButton = body.createEl('button', {
      cls: 'image-manager-gallery-lightbox__nav',
      text: 'Next'
    });
    this.lightboxNextButton.type = 'button';
    this.lightboxNextButton.addEventListener('click', () => this.stepLightbox(1));
  }

  private openLightbox(index: number): void {
    const image = this.filteredImages[index];
    if (!image?.resourcePath) {
      return;
    }

    this.selectedImagePath = image.path;
    this.renderLightbox();
  }

  private closeLightbox(): void {
    this.selectedImagePath = null;
    this.lightboxEl.removeClass('is-open');
  }

  private stepLightbox(delta: -1 | 1): void {
    const currentIndex = this.getSelectedImageIndex();
    if (currentIndex === -1) {
      return;
    }

    const nextIndex = currentIndex + delta;
    const nextImage = this.filteredImages[nextIndex];
    if (!nextImage?.resourcePath) {
      return;
    }

    this.selectedImagePath = nextImage.path;
    this.renderLightbox();
  }

  private renderLightbox(): void {
    const selectedIndex = this.getSelectedImageIndex();
    const image = selectedIndex >= 0 ? this.filteredImages[selectedIndex] : null;
    if (!image?.resourcePath) {
      this.closeLightbox();
      return;
    }

    this.lightboxTitleEl.setText(image.name);
    this.lightboxMetaEl.setText(`${formatBytes(image.size)} ${image.width ?? '?'}x${image.height ?? '?'}`);
    this.lightboxCounterEl.setText(`${selectedIndex + 1} / ${this.filteredImages.length}`);
    this.renderLightboxActions(image);
    this.lightboxImageEl.src = image.resourcePath;
    this.lightboxImageEl.alt = image.name;
    this.lightboxPrevButton.disabled = selectedIndex <= 0;
    this.lightboxNextButton.disabled = selectedIndex >= this.filteredImages.length - 1;
    this.lightboxEl.addClass('is-open');
  }

  private getSelectedImageIndex(): number {
    return this.selectedImagePath ? this.filteredImages.findIndex((image) => image.path === this.selectedImagePath) : -1;
  }

  private renderItemActions(container: HTMLElement, image: ImageInfo): void {
    if (!this.onCopyMarkdownLink && !this.onCopyImageToClipboard) {
      return;
    }

    const actions = container.createDiv({ cls: 'image-manager-gallery-actions' });
    this.appendActionButtons(actions, image);
  }

  private renderLightboxActions(image: ImageInfo): void {
    this.lightboxActionsEl.empty();
    this.appendActionButtons(this.lightboxActionsEl, image);
  }

  private appendActionButtons(container: HTMLElement, image: ImageInfo): void {
    if (this.onCopyMarkdownLink) {
      const button = container.createEl('button', {
        cls: 'image-manager-gallery-action',
        text: 'Copy Markdown'
      });
      button.type = 'button';
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        void this.onCopyMarkdownLink?.(image);
      });
    }

    if (this.onCopyImageToClipboard) {
      const button = container.createEl('button', {
        cls: 'image-manager-gallery-action',
        text: 'Copy Image'
      });
      button.type = 'button';
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        void this.onCopyImageToClipboard?.(image);
      });
    }
  }
}
