import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GalleryGridSize, GallerySortBy } from '@/types/index';

type ObsidianElement = HTMLElement & {
  addClass: (...classes: string[]) => ObsidianElement;
  removeClass: (...classes: string[]) => ObsidianElement;
  empty: () => ObsidianElement;
  setText: (text: string) => ObsidianElement;
  setCssStyles: (styles: Partial<CSSStyleDeclaration>) => ObsidianElement;
  createDiv: (options?: { cls?: string; text?: string }) => ObsidianElement;
  createEl: (
    tag: string,
    options?: {
      cls?: string;
      text?: string;
      type?: string;
      placeholder?: string;
      attr?: Record<string, string>;
    }
  ) => ObsidianElement;
};

function enhanceElement<T extends HTMLElement>(element: T): T & ObsidianElement {
  const target = element as T & ObsidianElement;
  target.addClass = (...classes: string[]) => {
    target.classList.add(...classes);
    return target;
  };
  target.removeClass = (...classes: string[]) => {
    target.classList.remove(...classes);
    return target;
  };
  target.empty = () => {
    target.replaceChildren();
    return target;
  };
  target.setText = (text: string) => {
    target.textContent = text;
    return target;
  };
  target.setCssStyles = (styles) => {
    Object.assign(target.style, styles);
    return target;
  };
  target.createDiv = (options) => {
    const child = enhanceElement(document.createElement('div'));
    if (options?.cls) {
      child.className = options.cls;
    }
    if (options?.text) {
      child.textContent = options.text;
    }
    target.appendChild(child);
    return child;
  };
  target.createEl = (tag, options) => {
    const child = enhanceElement(document.createElement(tag));
    if (options?.cls) {
      child.className = options.cls;
    }
    if (options?.text) {
      child.textContent = options.text;
    }
    if (options?.type && child instanceof HTMLInputElement) {
      child.type = options.type;
    }
    if (options?.placeholder && child instanceof HTMLInputElement) {
      child.placeholder = options.placeholder;
    }
    if (options?.attr) {
      Object.entries(options.attr).forEach(([key, value]) => child.setAttribute(key, value));
    }
    target.appendChild(child);
    return child;
  };
  return target;
}

vi.mock('obsidian', () => ({
  Modal: class {
    contentEl = enhanceElement(document.createElement('div'));

    constructor(_app: unknown) {}

    open(): void {}

    close(): void {}
  },
  Setting: class {
    constructor(private readonly containerEl: ObsidianElement) {}

    setName(text: string): this {
      this.containerEl.createDiv({ cls: 'setting-item-heading', text });
      return this;
    }

    setHeading(): this {
      return this;
    }
  }
}));

const galleryUi = {
  titleForNote: (noteName: string) => `Images in ${noteName}`,
  titleForFolder: (folderPath: string) => `Images in ${folderPath}`,
  titleForImage: (fileName: string) => `Image: ${fileName}`,
  searchPlaceholder: 'Filter by file name',
  sortBy: { date: 'Newest first', name: 'By name', size: 'Largest first' },
  viewMode: { grid: 'Grid', list: 'List' },
  emptyResults: 'No images match the current filter.',
  close: 'Close',
  previous: 'Previous',
  next: 'Next',
  copyImage: 'Copy Image'
};

function createPointerEvent(type: string, init: { pointerId: number; clientX: number; clientY: number; button?: number }): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    pointerId: { value: init.pointerId },
    clientX: { value: init.clientX },
    clientY: { value: init.clientY },
    button: { value: init.button ?? 0 }
  });
  return event;
}

describe('ImageGalleryModal', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('allows dragging the zoomed image when the viewport is scrollable', async () => {
    const { ImageGalleryModal } = await import('@/ui/modals/image-gallery-modal');
    const modal = new ImageGalleryModal({} as never, {
      title: 'Gallery',
      ui: galleryUi,
      images: [
        {
          path: 'assets/photo.png',
          name: 'photo.png',
          extension: 'png',
          size: 1024,
          mtime: 1,
          resourcePath: 'app://assets/photo.png',
          width: 1600,
          height: 1200
        }
      ],
      defaultSortBy: GallerySortBy.DATE,
      defaultGridSize: GalleryGridSize.MEDIUM
    });

    modal.onOpen();

    const contentEl = (modal as unknown as { contentEl: HTMLElement }).contentEl;
    const clickableItem = contentEl.querySelector('.image-manager-gallery-item--clickable');
    expect(clickableItem).toBeTruthy();
    clickableItem?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const viewport = contentEl.querySelector('.image-manager-gallery-lightbox__viewport') as HTMLElement;
    expect(viewport).toBeTruthy();

    Object.defineProperties(viewport, {
      clientWidth: { configurable: true, value: 400 },
      clientHeight: { configurable: true, value: 300 },
      scrollWidth: { configurable: true, value: 900 },
      scrollHeight: { configurable: true, value: 700 }
    });
    viewport.scrollLeft = 120;
    viewport.scrollTop = 80;

    (modal as unknown as { setZoom: (zoom: number) => void }).setZoom(1.5);
    expect(viewport.classList.contains('is-pannable')).toBe(true);

    viewport.dispatchEvent(createPointerEvent('pointerdown', { pointerId: 1, clientX: 200, clientY: 150 }));
    expect(viewport.classList.contains('is-dragging')).toBe(true);

    viewport.dispatchEvent(createPointerEvent('pointermove', { pointerId: 1, clientX: 150, clientY: 120 }));

    expect(viewport.scrollLeft).toBe(170);
    expect(viewport.scrollTop).toBe(110);

    viewport.dispatchEvent(createPointerEvent('pointerup', { pointerId: 1, clientX: 150, clientY: 120 }));
    expect(viewport.classList.contains('is-dragging')).toBe(false);
  });

  it('does not start dragging when the image is not zoomed in', async () => {
    const { ImageGalleryModal } = await import('@/ui/modals/image-gallery-modal');
    const modal = new ImageGalleryModal({} as never, {
      title: 'Gallery',
      ui: galleryUi,
      images: [
        {
          path: 'assets/photo.png',
          name: 'photo.png',
          extension: 'png',
          size: 1024,
          mtime: 1,
          resourcePath: 'app://assets/photo.png',
          width: 1600,
          height: 1200
        }
      ],
      defaultSortBy: GallerySortBy.DATE,
      defaultGridSize: GalleryGridSize.MEDIUM
    });

    modal.onOpen();

    const contentEl = (modal as unknown as { contentEl: HTMLElement }).contentEl;
    contentEl.querySelector('.image-manager-gallery-item--clickable')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const viewport = contentEl.querySelector('.image-manager-gallery-lightbox__viewport') as HTMLElement;
    Object.defineProperties(viewport, {
      clientWidth: { configurable: true, value: 400 },
      clientHeight: { configurable: true, value: 300 },
      scrollWidth: { configurable: true, value: 900 },
      scrollHeight: { configurable: true, value: 700 }
    });
    viewport.scrollLeft = 25;
    viewport.scrollTop = 15;

    viewport.dispatchEvent(createPointerEvent('pointerdown', { pointerId: 2, clientX: 180, clientY: 140 }));
    viewport.dispatchEvent(createPointerEvent('pointermove', { pointerId: 2, clientX: 120, clientY: 100 }));

    expect(viewport.classList.contains('is-pannable')).toBe(false);
    expect(viewport.classList.contains('is-dragging')).toBe(false);
    expect(viewport.scrollLeft).toBe(25);
    expect(viewport.scrollTop).toBe(15);
  });

  it('renders lightbox actions in the footer without copy markdown or duplicate zoom labels', async () => {
    const { ImageGalleryModal } = await import('@/ui/modals/image-gallery-modal');
    const copyImage = vi.fn(async () => {});
    const modal = new ImageGalleryModal({} as never, {
      title: 'Gallery',
      ui: galleryUi,
      images: [
        {
          path: 'assets/photo.png',
          name: 'photo.png',
          extension: 'png',
          size: 1024,
          mtime: 1,
          resourcePath: 'app://assets/photo.png',
          width: 1600,
          height: 1200
        }
      ],
      defaultSortBy: GallerySortBy.DATE,
      defaultGridSize: GalleryGridSize.MEDIUM,
      onCopyImageToClipboard: copyImage
    });

    modal.onOpen();

    const contentEl = (modal as unknown as { contentEl: HTMLElement }).contentEl;
    contentEl.querySelector('.image-manager-gallery-item--clickable')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(contentEl.textContent).not.toContain('Copy Markdown');
    expect(contentEl.querySelector('.image-manager-gallery-lightbox__footer .image-manager-gallery-lightbox__nav')).toBeTruthy();
    expect(contentEl.querySelectorAll('.image-manager-gallery-lightbox__zoom-button').length).toBe(3);
    expect(contentEl.querySelectorAll('.image-manager-gallery-lightbox__counter').length).toBe(1);
    expect(contentEl.querySelectorAll('.image-manager-gallery-lightbox__zoom').length).toBe(0);

    const zoomButtons = Array.from(contentEl.querySelectorAll('.image-manager-gallery-lightbox__zoom-button')).map((button) =>
      button.textContent?.trim()
    );
    expect(zoomButtons).toContain('100%');
  });
});
