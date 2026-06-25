import { Modal, Notice, Setting } from 'obsidian';
import type { App, TFile } from 'obsidian';
import type { UiCopy } from '@/i18n';
import type { ImageSelection } from '@/types/index';
import { normalizeImageSelection } from '@/utils/image-edit';

interface ImageSelectionModalOptions {
  readonly file: TFile;
  readonly title: string;
  readonly description: string;
  readonly confirmLabel: string;
  readonly emptySelectionNotice: string;
  readonly ui: UiCopy['imageSelection'];
  readonly onSubmit: (selection: ImageSelection) => void;
  readonly onCancel: () => void;
}

interface DragPoint {
  readonly x: number;
  readonly y: number;
}

export class ImageSelectionModal extends Modal {
  private readonly options: ImageSelectionModalOptions;
  private imageEl!: HTMLImageElement;
  private selectionEl!: HTMLDivElement;
  private hintEl!: HTMLDivElement;
  private activePointer: DragPoint | null = null;
  private currentSelection: ImageSelection | null = null;
  private resolved = false;
  private readonly cleanupCallbacks: (() => void)[] = [];

  constructor(app: App, options: ImageSelectionModalOptions) {
    super(app);
    this.options = options;
  }

  override onOpen(): void {
    this.contentEl.empty();
    this.contentEl.addClass('image-manager-selection-modal');
    new Setting(this.contentEl).setName(this.options.title).setHeading();
    this.contentEl.createEl('p', {
      cls: 'image-manager-selection-modal__description',
      text: this.options.description
    });

    const stage = this.contentEl.createDiv({ cls: 'image-manager-selection-modal__stage' });
    this.imageEl = stage.createEl('img', {
      cls: 'image-manager-selection-modal__image',
      attr: {
        src: this.app.vault.getResourcePath(this.options.file),
        alt: this.options.file.name,
        draggable: 'false'
      }
    });
    this.selectionEl = stage.createDiv({ cls: 'image-manager-selection-modal__selection' });
    this.hintEl = this.contentEl.createDiv({ cls: 'image-manager-selection-modal__hint' });
    this.updateHint();

    stage.addEventListener('mousedown', (event: MouseEvent) => {
      if (event.button !== 0) {
        return;
      }

      const point = this.getPointWithinImage(event);
      if (!point) {
        return;
      }

      event.preventDefault();
      this.activePointer = point;
      this.currentSelection = { x: point.x, y: point.y, width: 0, height: 0 };
      this.renderSelection();
    });

    const handleMove = (event: MouseEvent) => {
      if (!this.activePointer) {
        return;
      }

      const point = this.getPointWithinImage(event);
      if (!point) {
        return;
      }

      event.preventDefault();
      this.currentSelection = this.createSelection(this.activePointer, point);
      this.renderSelection();
    };
    const handleUp = (event: MouseEvent) => {
      if (!this.activePointer) {
        return;
      }

      const point = this.getPointWithinImage(event) ?? this.activePointer;
      event.preventDefault();
      this.currentSelection = this.createSelection(this.activePointer, point);
      this.activePointer = null;
      this.renderSelection();
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    this.cleanupCallbacks.push(() => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    });

    const actions = this.contentEl.createDiv({ cls: 'image-manager-selection-modal__actions' });
    const clearButton = actions.createEl('button', { text: this.options.ui.clearSelection });
    clearButton.type = 'button';
    clearButton.addEventListener('click', () => {
      this.currentSelection = null;
      this.renderSelection();
    });

    const cancelButton = actions.createEl('button', { text: this.options.ui.cancel });
    cancelButton.type = 'button';
    cancelButton.addEventListener('click', () => {
      this.cancel();
    });

    const confirmButton = actions.createEl('button', {
      cls: 'mod-cta',
      text: this.options.confirmLabel
    });
    confirmButton.type = 'button';
    confirmButton.addEventListener('click', () => {
      const selection = this.resolveSelectionInImagePixels();
      if (!selection) {
        new Notice(this.options.emptySelectionNotice);
        return;
      }

      this.resolved = true;
      this.options.onSubmit(selection);
      this.close();
    });
  }

  override onClose(): void {
    for (const cleanup of this.cleanupCallbacks.splice(0)) {
      cleanup();
    }
    this.contentEl.empty();
    if (!this.resolved) {
      this.options.onCancel();
    }
  }

  private getPointWithinImage(event: MouseEvent): DragPoint | null {
    const rect = this.imageEl.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return null;
    }

    const x = clamp(event.clientX - rect.left, 0, rect.width);
    const y = clamp(event.clientY - rect.top, 0, rect.height);
    return { x, y };
  }

  private createSelection(start: DragPoint, end: DragPoint): ImageSelection {
    return {
      x: Math.min(start.x, end.x),
      y: Math.min(start.y, end.y),
      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y)
    };
  }

  private renderSelection(): void {
    const selection = this.currentSelection;
    if (!selection || selection.width <= 0 || selection.height <= 0) {
      this.selectionEl.setCssStyles({ display: 'none' });
      this.updateHint();
      return;
    }

    this.selectionEl.setCssStyles({
      display: 'block',
      left: `${selection.x}px`,
      top: `${selection.y}px`,
      width: `${selection.width}px`,
      height: `${selection.height}px`
    });
    this.updateHint(selection);
  }

  private updateHint(selection?: ImageSelection): void {
    if (!selection || selection.width <= 0 || selection.height <= 0) {
      this.hintEl.setText(this.options.ui.dragHint);
      return;
    }

    this.hintEl.setText(this.options.ui.selectionHint(selection.width, selection.height));
  }

  private resolveSelectionInImagePixels(): ImageSelection | null {
    const selection = this.currentSelection;
    const naturalWidth = this.imageEl.naturalWidth;
    const naturalHeight = this.imageEl.naturalHeight;
    const rect = this.imageEl.getBoundingClientRect();
    if (!selection || naturalWidth <= 0 || naturalHeight <= 0 || rect.width <= 0 || rect.height <= 0) {
      return null;
    }

    return normalizeImageSelection(
      {
        x: (selection.x / rect.width) * naturalWidth,
        y: (selection.y / rect.height) * naturalHeight,
        width: (selection.width / rect.width) * naturalWidth,
        height: (selection.height / rect.height) * naturalHeight
      },
      naturalWidth,
      naturalHeight
    );
  }

  private cancel(): void {
    this.resolved = true;
    this.options.onCancel();
    this.close();
  }
}

export function pickImageSelection(
  app: App,
  options: Omit<ImageSelectionModalOptions, 'onSubmit' | 'onCancel'>
): Promise<ImageSelection | null> {
  return new Promise((resolve) => {
    new ImageSelectionModal(app, {
      ...options,
      onSubmit: (selection) => resolve(selection),
      onCancel: () => resolve(null)
    }).open();
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
