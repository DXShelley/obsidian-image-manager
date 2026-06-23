import {
  MarkdownView,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile
} from 'obsidian';
import type { App, Editor, Menu, TAbstractFile, TFolder } from 'obsidian';
import { FileManager } from '@/services/file-manager';
import { ImageProcessor } from '@/services/image-processor';
import { LinkFormatter } from '@/services/link-formatter';
import { VariableResolver } from '@/services/variable-resolver';
import {
  DEFAULT_SETTINGS,
  ImageFormat,
  LinkFormat,
  type ImageInfo,
  type ImageManagerSettings
} from '@/types/index';

export default class ImageManagerPlugin extends Plugin {
  pluginSettings!: ImageManagerSettings;
  private variableResolver!: VariableResolver;
  private fileManager!: FileManager;
  private imageProcessor!: ImageProcessor;
  private linkFormatter!: LinkFormatter;

  override async onload(): Promise<void> {
    await this.loadSettings();
    this.variableResolver = new VariableResolver();
    this.fileManager = new FileManager(this.app, this.pluginSettings, this.variableResolver);
    this.imageProcessor = new ImageProcessor(this.app, this.pluginSettings);
    this.linkFormatter = new LinkFormatter(this.app);

    this.addSettingTab(new ImageManagerSettingTab(this.app, this));
    this.registerCommands();
    this.registerPasteHandler();
    this.registerContextMenu();
    this.registerMarkdownPostProcessor((element) => this.decorateRenderedImages(element));

    new Notice('Image Manager loaded');
  }

  override onunload(): void {
    // No runtime resources to release in the TypeScript baseline.
  }

  async loadSettings(): Promise<void> {
    this.pluginSettings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) };
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.pluginSettings);
  }

  private registerCommands(): void {
    this.addCommand({
      id: 'process-current-note-images',
      name: 'Process images in current note',
      editorCallback: (_editor: Editor, view) => {
        if (view instanceof MarkdownView && view.file) {
          void this.compressImagesInNote(view.file);
        }
      }
    });

    this.addCommand({
      id: 'open-current-note-gallery',
      name: 'Open current note image gallery',
      callback: () => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view?.file) {
          new Notice('No active note');
          return;
        }
        void this.openNoteGallery(view.file);
      }
    });

    this.addCommand({
      id: 'open-current-folder-gallery',
      name: 'Open current folder image gallery',
      callback: () => {
        const file = this.app.workspace.getActiveFile();
        const folder = file?.parent;
        if (!folder) {
          new Notice('No active folder');
          return;
        }
        void this.openFolderGallery(folder);
      }
    });
  }

  private registerPasteHandler(): void {
    this.registerEvent(
      this.app.workspace.on('editor-paste', (event, _editor, view) => {
        if (!this.pluginSettings.enableAutoConvert || !(view instanceof MarkdownView) || !view.file) {
          return;
        }

        const files = Array.from(event.clipboardData?.items ?? [])
          .filter((item) => item.type.startsWith('image/'))
          .map((item) => item.getAsFile())
          .filter((file): file is File => file !== null);

        if (files.length === 0) {
          return;
        }

        event.preventDefault();
        void this.insertPastedImages(files, view);
      })
    );
  }

  private registerContextMenu(): void {
    if (!this.pluginSettings.enableContextMenu) {
      return;
    }

    this.registerEvent(
      this.app.workspace.on('file-menu', (menu: Menu, file: TAbstractFile) => {
        if (!(file instanceof TFile) || !this.fileManager.isImageFile(file)) {
          return;
        }

        this.addImageMenuItems(menu, file);
      })
    );
  }

  private addImageMenuItems(menu: Menu, file: TFile): void {
    menu.addSeparator();
    menu.addItem((item) => {
      item.setTitle('Copy image to clipboard').setIcon('copy').onClick(() => {
        void this.copyImageToClipboard(file);
      });
    });
    menu.addItem((item) => {
      item.setTitle('Compress image').setIcon('archive').onClick(() => {
        void this.compressImage(file);
      });
    });
    menu.addItem((item) => {
      item.setTitle('Convert to WebP').setIcon('image').onClick(() => {
        void this.convertImage(file, ImageFormat.WEBP);
      });
    });
    menu.addItem((item) => {
      item.setTitle('Rotate 90 degrees').setIcon('rotate-cw').onClick(() => {
        void this.replaceImage(file, () => this.imageProcessor.rotate(file, 90), 'Image rotated');
      });
    });
    menu.addItem((item) => {
      item.setTitle('Flip horizontal').setIcon('flip-horizontal').onClick(() => {
        void this.replaceImage(file, () => this.imageProcessor.flip(file, 'horizontal'), 'Image flipped');
      });
    });
    menu.addItem((item) => {
      item.setTitle('Delete image').setIcon('trash').onClick(() => {
        void this.app.vault.trash(file, true);
      });
    });
  }

  private async insertPastedImages(files: File[], view: MarkdownView): Promise<void> {
    if (!view.file) {
      return;
    }

    const links: string[] = [];
    for (const file of files) {
      const source = await file.arrayBuffer();
      const originalName = file.name || `pasted-image-${Date.now()}.png`;
      const tempFile = await this.fileManager.saveImage(source, originalName, view.file);
      const output =
        this.pluginSettings.enableAutoConvert && this.pluginSettings.defaultFormat !== this.extensionToImageFormat(tempFile.extension)
          ? await this.convertAndReplace(tempFile, this.pluginSettings.defaultFormat)
          : tempFile;

      links.push(
        this.linkFormatter.formatLink(output.path, view.file, {
          format: this.pluginSettings.defaultLinkFormat,
          pathFormat: this.pluginSettings.defaultPathFormat
        })
      );
    }

    const cursor = view.editor.getCursor();
    const text = links.join('\n');
    view.editor.replaceRange(text, cursor);
    if (this.pluginSettings.dropPasteCursorLocation === 'back') {
      view.editor.setCursor({ line: cursor.line, ch: cursor.ch + text.length });
    }
  }

  private async compressImagesInNote(noteFile: TFile): Promise<void> {
    const images = await this.fileManager.getImagesInNote(noteFile);
    for (const image of images) {
      await this.compressImage(image);
    }
    new Notice(`Processed ${images.length} images`);
  }

  private async compressImage(file: TFile): Promise<void> {
    const before = file.stat.size;
    await this.replaceImage(file, () => this.imageProcessor.compress(file), 'Image compressed');
    if (this.pluginSettings.showSpaceSavedNotification) {
      const updated = this.app.vault.getAbstractFileByPath(file.path);
      if (updated instanceof TFile) {
        const saved = before - updated.stat.size;
        new Notice(`Saved ${this.formatBytes(saved)}`);
      }
    }
  }

  private async convertImage(file: TFile, format: ImageFormat): Promise<void> {
    const buffer = await this.imageProcessor.convert(file, format);
    const targetPath = file.path.replace(/\.[^/.]+$/, `.${format}`);
    const targetFile = this.app.vault.getAbstractFileByPath(targetPath);
    if (targetFile instanceof TFile) {
      await this.app.vault.modifyBinary(targetFile, buffer);
    } else {
      await this.app.vault.createBinary(targetPath, buffer);
    }
    new Notice(`Converted to ${format}`);
  }

  private async convertAndReplace(file: TFile, format: ImageFormat): Promise<TFile> {
    const buffer = await this.imageProcessor.convert(file, format);
    const targetPath = file.path.replace(/\.[^/.]+$/, `.${format}`);
    await this.app.vault.delete(file);
    return this.app.vault.createBinary(targetPath, buffer);
  }

  private async replaceImage(file: TFile, processor: () => Promise<ArrayBuffer>, message: string): Promise<void> {
    const buffer = await processor();
    await this.app.vault.modifyBinary(file, buffer);
    new Notice(message);
  }

  private async copyImageToClipboard(file: TFile): Promise<void> {
    const buffer = await this.app.vault.readBinary(file);
    const blob = new Blob([buffer], { type: `image/${file.extension}` });
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    new Notice('Image copied');
  }

  private async openNoteGallery(noteFile: TFile): Promise<void> {
    const files = await this.fileManager.getImagesInNote(noteFile);
    await this.openGallery(`Images in ${noteFile.basename}`, files);
  }

  private async openFolderGallery(folder: TFolder): Promise<void> {
    await this.openGallery(`Images in ${folder.path || 'vault root'}`, this.fileManager.getImagesInFolder(folder));
  }

  private async openGallery(title: string, files: TFile[]): Promise<void> {
    const images = await Promise.all(files.map((file) => this.imageProcessor.getImageInfo(file)));
    new ImageGalleryModal(this.app, title, images).open();
  }

  private decorateRenderedImages(element: HTMLElement): void {
    for (const image of element.querySelectorAll('img')) {
      image.addClass('image-manager-managed');
    }
  }

  private extensionToImageFormat(extension: string): ImageFormat {
    const normalized = extension.toLowerCase();
    if (normalized === 'jpg') {
      return ImageFormat.JPEG;
    }
    if (Object.values(ImageFormat).includes(normalized as ImageFormat)) {
      return normalized as ImageFormat;
    }
    return this.pluginSettings.defaultFormat;
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
}

class ImageManagerSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private readonly plugin: ImageManagerPlugin
  ) {
    super(app, plugin);
  }

  override display(): void {
    const { containerEl } = this;
    const settings = this.plugin.pluginSettings;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'Image Manager' });

    new Setting(containerEl)
      .setName('Default image format')
      .addDropdown((dropdown) =>
        dropdown
          .addOption(ImageFormat.WEBP, 'WebP')
          .addOption(ImageFormat.JPEG, 'JPEG')
          .addOption(ImageFormat.PNG, 'PNG')
          .setValue(settings.defaultFormat)
          .onChange(async (value) => {
            settings.defaultFormat = value as ImageFormat;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Default link format')
      .addDropdown((dropdown) =>
        dropdown
          .addOption(LinkFormat.WIKI, 'Wiki link')
          .addOption(LinkFormat.MARKDOWN, 'Markdown link')
          .setValue(settings.defaultLinkFormat)
          .onChange(async (value) => {
            settings.defaultLinkFormat = value as LinkFormat;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Rename pattern')
      .setDesc('Supports {noteName}, {fileName}, {date}, {time}, {random}.')
      .addText((text) =>
        text.setValue(settings.renamePattern).onChange(async (value) => {
          settings.renamePattern = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Output folder')
      .setDesc('Leave empty to save next to the current note.')
      .addText((text) =>
        text.setValue(settings.outputFolder).onChange(async (value) => {
          settings.outputFolder = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Compression quality')
      .addSlider((slider) =>
        slider
          .setLimits(1, 100, 1)
          .setDynamicTooltip()
          .setValue(settings.compressionQuality)
          .onChange(async (value) => {
            settings.compressionQuality = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Auto-convert pasted images')
      .addToggle((toggle) =>
        toggle.setValue(settings.enableAutoConvert).onChange(async (value) => {
          settings.enableAutoConvert = value;
          await this.plugin.saveSettings();
        })
      );
  }
}

class ImageGalleryModal extends Modal {
  constructor(
    app: App,
    private readonly title: string,
    private readonly images: ImageInfo[]
  ) {
    super(app);
  }

  override onOpen(): void {
    this.contentEl.empty();
    this.contentEl.addClass('image-manager-gallery');
    this.contentEl.createEl('h2', { text: this.title });

    const grid = this.contentEl.createDiv({ cls: 'image-manager-gallery-grid' });
    for (const image of this.images) {
      const item = grid.createDiv({ cls: 'image-manager-gallery-item' });
      item.createEl('div', { text: image.name, cls: 'image-manager-gallery-name' });
      item.createEl('div', { text: `${this.formatBytes(image.size)} ${image.width ?? '?'}x${image.height ?? '?'}` });
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
}
