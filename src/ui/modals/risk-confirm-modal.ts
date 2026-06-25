import { Modal } from 'obsidian';
import type { App } from 'obsidian';

interface RiskConfirmModalOptions {
  readonly title: string;
  readonly message: string;
  readonly confirmText: string;
  readonly cancelText: string;
}

export function confirmRiskAction(app: App, options: RiskConfirmModalOptions): Promise<boolean> {
  return new Promise((resolve) => {
    new RiskConfirmModal(app, options, resolve).open();
  });
}

class RiskConfirmModal extends Modal {
  private settled = false;

  constructor(
    app: App,
    private readonly options: RiskConfirmModalOptions,
    private readonly resolve: (confirmed: boolean) => void
  ) {
    super(app);
  }

  override onOpen(): void {
    this.contentEl.empty();
    this.contentEl.createEl('h2', { text: this.options.title });
    this.contentEl.createEl('p', { text: this.options.message });

    const actions = this.contentEl.createDiv({ cls: 'image-manager-risk-confirm-actions' });
    const cancelButton = actions.createEl('button', {
      text: this.options.cancelText
    });
    cancelButton.type = 'button';
    cancelButton.addEventListener('click', () => this.settle(false));

    const confirmButton = actions.createEl('button', {
      cls: 'mod-cta',
      text: this.options.confirmText
    });
    confirmButton.type = 'button';
    confirmButton.addEventListener('click', () => this.settle(true));
  }

  override onClose(): void {
    this.contentEl.empty();
    this.settle(false);
  }

  private settle(confirmed: boolean): void {
    if (this.settled) {
      return;
    }

    this.settled = true;
    this.resolve(confirmed);
    const modalWithClose = this as Modal & { close?: () => void };
    modalWithClose.close?.();
  }
}
