import { Modal } from 'obsidian';
import type { App } from 'obsidian';
import type { UiCopy } from '@/i18n';
import { GallerySortBy, type ImageInfo } from '@/types/index';
import type { GalleryGridSize } from '@/types/index';
import { sortImages } from '@/utils/image-manager';

interface ImageGalleryModalOptions {
  title: string;
  ui: UiCopy['gallery'];
  images: ImageInfo[];
  defaultSortBy: GallerySortBy;
  defaultGridSize: GalleryGridSize;
  initialSelectedImagePath?: string;
  lightboxCloseBehavior?: 'return-to-gallery' | 'close-modal';
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
  private readonly ui: UiCopy['gallery'];
  private readonly images: ImageInfo[];
  private sortBy: GallerySortBy;
  private readonly gridSize: GalleryGridSize;
  private readonly initialSelectedImagePath: string | null;
  private readonly lightboxCloseBehavior: 'return-to-gallery' | 'close-modal';
  private readonly onCopyImageToClipboard?: (image: ImageInfo) => Promise<void>;
  private filterText = '';
  private viewMode: ViewMode = 'grid';
  private filteredImages: ImageInfo[] = [];
  private selectedImagePath: string | null = null;
  private lightboxZoom = 1;
  private resultsEl!: HTMLElement;
  private lightboxEl!: HTMLElement;
  private lightboxViewportEl!: HTMLElement;
  private lightboxImageEl!: HTMLImageElement;
  private lightboxTitleEl!: HTMLElement;
  private lightboxMetaEl!: HTMLElement;
  private lightboxCounterEl!: HTMLElement;
  private lightboxActionsEl!: HTMLElement;
  private lightboxPrevButton!: HTMLButtonElement;
  private lightboxNextButton!: HTMLButtonElement;
  private lightboxZoomOutButton!: HTMLButtonElement;
  private lightboxZoomResetButton!: HTMLButtonElement;
  private lightboxZoomInButton!: HTMLButtonElement;
  private lightboxPointerId: number | null = null;
  private isLightboxDragging = false;
  private lightboxDragStartX = 0;
  private lightboxDragStartY = 0;
  private lightboxDragScrollLeft = 0;
  private lightboxDragScrollTop = 0;

  private static readonly MIN_ZOOM = 0.5;
  private static readonly MAX_ZOOM = 4;
  private static readonly ZOOM_STEP = 0.25;

  constructor(app: App, options: ImageGalleryModalOptions) {
    super(app);
    this.title = options.title;
    this.ui = options.ui;
    this.images = options.images;
    this.sortBy = options.defaultSortBy;
    this.gridSize = options.defaultGridSize;
    this.initialSelectedImagePath = options.initialSelectedImagePath ?? null;
    this.lightboxCloseBehavior = options.lightboxCloseBehavior ?? 'return-to-gallery';
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
      placeholder: this.ui.searchPlaceholder
    });
    search.addEventListener('input', () => {
      this.filterText = search.value.trim().toLowerCase();
      this.renderResults();
    });

    const sortSelect = toolbar.createEl('select', { cls: 'image-manager-gallery-select' });
    [
      [GallerySortBy.DATE, this.ui.sortBy.date],
      [GallerySortBy.NAME, this.ui.sortBy.name],
      [GallerySortBy.SIZE, this.ui.sortBy.size]
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
      ['grid', this.ui.viewMode.grid],
      ['list', this.ui.viewMode.list]
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
      this.resultsEl.createEl('p', { text: this.ui.emptyResults });
    }

    if (this.selectedImagePath && !filtered.some((image) => image.path === this.selectedImagePath)) {
      this.clearLightboxSelection();
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
        this.dismissLightbox();
      }
    });

    const panel = this.lightboxEl.createDiv({ cls: 'image-manager-gallery-lightbox__panel' });
    const header = panel.createDiv({ cls: 'image-manager-gallery-lightbox__header' });
    const titleWrap = header.createDiv({ cls: 'image-manager-gallery-lightbox__title' });
    this.lightboxTitleEl = titleWrap.createEl('strong', { text: '' });
    this.lightboxMetaEl = titleWrap.createEl('span', { text: '' });
    const headerMeta = header.createDiv({ cls: 'image-manager-gallery-lightbox__header-meta' });
    this.lightboxCounterEl = headerMeta.createEl('span', {
      cls: 'image-manager-gallery-lightbox__counter',
      text: ''
    });
    const closeButton = headerMeta.createEl('button', {
      cls: 'image-manager-gallery-lightbox__close',
      text: this.ui.close
    });
    closeButton.type = 'button';
    closeButton.addEventListener('click', () => this.dismissLightbox());

    const body = panel.createDiv({ cls: 'image-manager-gallery-lightbox__body' });
    this.lightboxViewportEl = body.createDiv({ cls: 'image-manager-gallery-lightbox__viewport' });
    this.lightboxViewportEl.addEventListener(
      'wheel',
      (event) => {
        event.preventDefault();
        const delta = event.deltaY < 0 ? ImageGalleryModal.ZOOM_STEP : -ImageGalleryModal.ZOOM_STEP;
        this.adjustZoom(delta);
      },
      { passive: false }
    );
    this.lightboxViewportEl.addEventListener('pointerdown', this.onLightboxPointerDown);
    this.lightboxViewportEl.addEventListener('pointermove', this.onLightboxPointerMove);
    this.lightboxViewportEl.addEventListener('pointerup', this.onLightboxPointerUp);
    this.lightboxViewportEl.addEventListener('pointercancel', this.onLightboxPointerUp);
    this.lightboxImageEl = this.lightboxViewportEl.createEl('img', {
      cls: 'image-manager-gallery-lightbox__image',
      attr: { alt: '' }
    });
    this.lightboxImageEl.addEventListener('load', () => this.updateLightboxPanUi());

    const footer = panel.createDiv({ cls: 'image-manager-gallery-lightbox__footer' });
    const footerNav = footer.createDiv({ cls: 'image-manager-gallery-lightbox__controls' });
    this.lightboxPrevButton = footerNav.createEl('button', {
      cls: 'image-manager-gallery-lightbox__nav',
      text: this.ui.previous
    });
    this.lightboxPrevButton.type = 'button';
    this.lightboxPrevButton.addEventListener('click', () => this.stepLightbox(-1));
    this.lightboxActionsEl = footerNav.createDiv({ cls: 'image-manager-gallery-lightbox__actions' });
    this.lightboxNextButton = footerNav.createEl('button', {
      cls: 'image-manager-gallery-lightbox__nav',
      text: this.ui.next
    });
    this.lightboxNextButton.type = 'button';
    this.lightboxNextButton.addEventListener('click', () => this.stepLightbox(1));

    const footerZoom = footer.createDiv({ cls: 'image-manager-gallery-lightbox__controls' });
    this.lightboxZoomOutButton = footerZoom.createEl('button', {
      cls: 'image-manager-gallery-lightbox__zoom-button',
      text: '−'
    });
    this.lightboxZoomOutButton.type = 'button';
    this.lightboxZoomOutButton.addEventListener('click', () => this.adjustZoom(-ImageGalleryModal.ZOOM_STEP));
    this.lightboxZoomResetButton = footerZoom.createEl('button', {
      cls: 'image-manager-gallery-lightbox__zoom-button',
      text: '100%'
    });
    this.lightboxZoomResetButton.type = 'button';
    this.lightboxZoomResetButton.addEventListener('click', () => this.setZoom(1));
    this.lightboxZoomInButton = footerZoom.createEl('button', {
      cls: 'image-manager-gallery-lightbox__zoom-button',
      text: '+'
    });
    this.lightboxZoomInButton.type = 'button';
    this.lightboxZoomInButton.addEventListener('click', () => this.adjustZoom(ImageGalleryModal.ZOOM_STEP));
  }

  private openLightbox(index: number): void {
    const image = this.filteredImages[index];
    if (!image?.resourcePath) {
      return;
    }

    this.selectedImagePath = image.path;
    this.setZoom(1);
    this.renderLightbox();
  }

  private dismissLightbox(): void {
    if (this.lightboxCloseBehavior === 'close-modal') {
      this.close();
      return;
    }

    this.clearLightboxSelection();
  }

  private clearLightboxSelection(): void {
    this.selectedImagePath = null;
    this.setZoom(1);
    this.resetLightboxDrag();
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
    this.setZoom(1);
    this.renderLightbox();
  }

  private renderLightbox(): void {
    const selectedIndex = this.getSelectedImageIndex();
    const image = selectedIndex >= 0 ? this.filteredImages[selectedIndex] : null;
    if (!image?.resourcePath) {
      this.clearLightboxSelection();
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
    this.resetLightboxDrag();
    this.updateZoomUi();
    this.lightboxEl.addClass('is-open');
  }

  private getSelectedImageIndex(): number {
    return this.selectedImagePath ? this.filteredImages.findIndex((image) => image.path === this.selectedImagePath) : -1;
  }

  private renderItemActions(container: HTMLElement, image: ImageInfo): void {
    if (!this.onCopyImageToClipboard) {
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
    if (this.onCopyImageToClipboard) {
      const button = container.createEl('button', {
        cls: 'image-manager-gallery-action',
        text: this.ui.copyImage
      });
      button.type = 'button';
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        void this.onCopyImageToClipboard?.(image);
      });
    }
  }

  private adjustZoom(delta: number): void {
    this.setZoom(this.lightboxZoom + delta);
  }

  private setZoom(nextZoom: number): void {
    this.lightboxZoom = Math.min(ImageGalleryModal.MAX_ZOOM, Math.max(ImageGalleryModal.MIN_ZOOM, nextZoom));
    if (!this.canPanLightbox()) {
      this.resetLightboxDrag();
    }
    this.updateZoomUi();
  }

  private updateZoomUi(): void {
    if (
      !this.lightboxImageEl ||
      !this.lightboxZoomResetButton ||
      !this.lightboxZoomOutButton ||
      !this.lightboxZoomInButton
    ) {
      return;
    }

    this.lightboxImageEl.style.transform = `scale(${this.lightboxZoom})`;
    this.lightboxZoomResetButton.setText(`${Math.round(this.lightboxZoom * 100)}%`);
    this.lightboxZoomOutButton.disabled = this.lightboxZoom <= ImageGalleryModal.MIN_ZOOM;
    this.lightboxZoomInButton.disabled = this.lightboxZoom >= ImageGalleryModal.MAX_ZOOM;
    this.updateLightboxPanUi();
  }

  private readonly onLightboxPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0 || !this.canPanLightbox()) {
      return;
    }

    this.lightboxPointerId = event.pointerId;
    this.isLightboxDragging = true;
    this.lightboxDragStartX = event.clientX;
    this.lightboxDragStartY = event.clientY;
    this.lightboxDragScrollLeft = this.lightboxViewportEl.scrollLeft;
    this.lightboxDragScrollTop = this.lightboxViewportEl.scrollTop;
    this.lightboxViewportEl.classList.add('is-dragging');
    this.lightboxViewportEl.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  };

  private readonly onLightboxPointerMove = (event: PointerEvent): void => {
    if (!this.isLightboxDragging || this.lightboxPointerId !== event.pointerId) {
      return;
    }

    this.lightboxViewportEl.scrollLeft = this.lightboxDragScrollLeft - (event.clientX - this.lightboxDragStartX);
    this.lightboxViewportEl.scrollTop = this.lightboxDragScrollTop - (event.clientY - this.lightboxDragStartY);
    event.preventDefault();
  };

  private readonly onLightboxPointerUp = (event: PointerEvent): void => {
    if (this.lightboxPointerId !== event.pointerId) {
      return;
    }

    this.resetLightboxDrag();
  };

  private canPanLightbox(): boolean {
    return (
      this.lightboxZoom > 1 &&
      (this.lightboxViewportEl.scrollWidth > this.lightboxViewportEl.clientWidth ||
        this.lightboxViewportEl.scrollHeight > this.lightboxViewportEl.clientHeight)
    );
  }

  private resetLightboxDrag(): void {
    if (this.lightboxPointerId !== null) {
      this.lightboxViewportEl.releasePointerCapture?.(this.lightboxPointerId);
    }

    this.lightboxPointerId = null;
    this.isLightboxDragging = false;
    this.lightboxViewportEl.classList.remove('is-dragging');
    this.updateLightboxPanUi();
  }

  private updateLightboxPanUi(): void {
    if (!this.lightboxViewportEl) {
      return;
    }

    this.lightboxViewportEl.classList.toggle('is-pannable', this.canPanLightbox());
  }
}
