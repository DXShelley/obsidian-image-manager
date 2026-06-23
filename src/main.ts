import { MarkdownView, Notice, Plugin } from 'obsidian';
import type { Command } from 'obsidian';
import type { TFile } from 'obsidian';
import { createBuiltInFeatures } from '@/app/feature-catalog';
import {
  createPluginFeatureContext,
  createPluginFeatureRegistry,
  createPluginServices,
  getChangedSettingKeys
} from '@/app/plugin-runtime';
import type { FeatureRegistry } from '@/core/registry/feature-registry';
import { SettingsManager } from '@/core/settings/settings-manager';
import {
  ImageFormat,
  type ImageManagerFeature,
  type ImageManagerServices,
  type ImageManagerSettings
} from '@/types/index';
import { ImageManagerSettingTab } from '@/ui/settings/image-manager-setting-tab';
import { getConvertedTargetPath } from '@/utils/image-manager';
import { formatSavedLocationNotice, showOperationNotice } from '@/utils/operation-feedback';
import { sortCommandsByScope } from '@/utils/command-order';
import { parseTextImageSources, resolveTextImageSource, type TextImageSource } from '@/utils/pasted-image-source';
import { matchRegexIgnorePattern } from '@/utils/regex-ignore';

interface ClipboardFileInput {
  readonly kind: 'clipboard-file';
  readonly file: File;
}

interface ClipboardTextImageInput {
  readonly kind: 'text-image-source';
  readonly source: TextImageSource;
}

type ClipboardImageInput = ClipboardFileInput | ClipboardTextImageInput;

export default class ImageManagerPlugin extends Plugin {
  private readonly settingsManager = new SettingsManager(
    async () => this.loadData(),
    async (data) => this.saveData(data)
  );
  private featureRegistry!: FeatureRegistry;
  private services!: ImageManagerServices;

  override async onload(): Promise<void> {
    await this.settingsManager.load();
    this.services = createPluginServices(this.app, this.settingsManager);
    await this.services.recovery.initialize();
    this.featureRegistry = createPluginFeatureRegistry(createBuiltInFeatures());
    this.services.logger.refreshMode('plugin-onload');

    this.addSettingTab(new ImageManagerSettingTab(this.app, this));
    this.registerPasteHandler();
    await this.activateFeatures();
    this.services.logger.info('Plugin loaded', {
      settings: this.settingsManager.getSettings(),
      features: this.featureRegistry.list().map((feature) => feature.id)
    });

    showOperationNotice(this.settingsManager.getSettings(), 'Image Manager loaded');
  }

  override onunload(): void {
    this.services.logger.info('Plugin unloading');
    this.services.eventBus.clear();
  }

  private registerPasteHandler(): void {
    this.registerEvent(
      this.app.workspace.on('editor-paste', (event, _editor, view) => {
        if (!this.settingsManager.getSettings().enablePasteHandler) {
          return;
        }

        if (!(view instanceof MarkdownView) || !view.file) {
          return;
        }

        const files = Array.from(event.clipboardData?.items ?? [])
          .filter((item) => item.type.startsWith('image/'))
          .map((item) => item.getAsFile())
          .filter((file): file is File => file !== null);

        const textSources =
          files.length === 0 && this.settingsManager.getSettings().enableAutoDownloadImagesFromText
            ? parseTextImageSources(event.clipboardData?.getData('text/plain') ?? '')
            : [];

        if (files.length === 0 && textSources.length === 0) {
          return;
        }

        event.preventDefault();
        const inputs: ClipboardImageInput[] =
          files.length > 0
            ? files.map((file) => ({ kind: 'clipboard-file', file }))
            : textSources.map((source) => ({ kind: 'text-image-source', source }));
        void this.insertPastedImages(inputs, view).catch((error: unknown) => {
          console.error('Image Manager failed to process pasted images', error);
          new Notice('Failed to process pasted images');
        });
      })
    );
  }

  getSettings(): ImageManagerSettings {
    return this.settingsManager.getSettings();
  }

  async updateSettings(mutator: (draft: ImageManagerSettings) => void): Promise<ImageManagerSettings> {
    const before = this.settingsManager.getSettings();
    const updated = await this.settingsManager.update(mutator);
    const changedKeys = getChangedSettingKeys(before, updated);
    this.services.logger.refreshMode('settings-update');
    this.services.logger.info('Settings updated', {
      changedKeys,
      settings: updated
    });
    if (changedKeys.includes('defaultLinkFormat') || changedKeys.includes('defaultPathFormat')) {
      void this.rewriteActiveNoteImageLinks().catch((error: unknown) => {
        console.error('Image Manager failed to update image links after settings change', error);
        this.services.logger.error('Failed to update image links after settings change', error);
      });
    }
    return updated;
  }

  listFeatures(): ImageManagerFeature[] {
    return this.featureRegistry.list();
  }

  private async activateFeatures(): Promise<void> {
    const deferredCommands: Command[] = [];
    const originalAddCommand = this.addCommand.bind(this);

    this.addCommand = (command: Command) => {
      deferredCommands.push(command);
      return command;
    };

    try {
      await this.featureRegistry.activateAll(createPluginFeatureContext(this.app, this, this.services));
    } finally {
      this.addCommand = originalAddCommand;
    }

    for (const command of sortCommandsByScope(deferredCommands)) {
      originalAddCommand(command);
    }
  }

  private async insertPastedImages(inputs: ClipboardImageInput[], view: MarkdownView): Promise<void> {
    if (!view.file) {
      return;
    }
    const noteFile = view.file;

    this.services.logger.refreshMode('paste-handler');
    this.services.logger.debug('Processing pasted images', {
      notePath: noteFile.path,
      itemCount: inputs.length,
      textSourceCount: inputs.filter((input) => input.kind === 'text-image-source').length
    });

    await this.services.recovery.runTransaction(
      {
        label: `粘贴导入 ${view.file.basename}`,
        trigger: 'paste-import',
        scope: 'single-note'
      },
      async () => {
        await this.services.recovery.captureTextSnapshot(noteFile.path, view.editor.getValue());

        const links: string[] = [];
        const savedPaths: string[] = [];
        const failedFiles: string[] = [];
        const fallbackFiles: string[] = [];
        for (const input of inputs) {
          try {
            const { source, originalName } = await this.readClipboardImageInput(input);
            const tempFile = await this.services.fileManager.saveImage(source, originalName, noteFile);
            const settings = this.settingsManager.getSettings();
            let output = tempFile;

            if (settings.enableAutoConvert && settings.defaultFormat !== this.extensionToImageFormat(tempFile.extension)) {
              try {
                const ignored = matchRegexIgnorePattern(settings.conversionIgnorePattern, tempFile.path);
                if (ignored) {
                  this.services.logger.debug('Skipped auto-convert because file matches ignore pattern', {
                    filePath: tempFile.path,
                    pattern: ignored.source
                  });
                  fallbackFiles.push(originalName);
                } else {
                  output = await this.convertAndReplace(tempFile, settings.defaultFormat);
                }
              } catch (error: unknown) {
                console.warn(`Image Manager skipped auto-convert for "${originalName}"`, error);
                this.services.logger.warn('Auto-convert skipped', {
                  originalName,
                  requestedFormat: settings.defaultFormat,
                  sourceExtension: tempFile.extension
                });
                fallbackFiles.push(originalName);
              }
            }

            links.push(
              this.services.linkFormatter.formatLink(output.path, noteFile, {
                format: settings.defaultLinkFormat,
                pathFormat: settings.defaultPathFormat
              })
            );
            savedPaths.push(output.path);
          } catch (error: unknown) {
            const failedName = this.getClipboardImageInputLabel(input);
            console.error(`Image Manager failed to save pasted image "${failedName}"`, error);
            this.services.logger.error('Failed to save pasted image', error, {
              originalName: failedName,
              notePath: noteFile.path
            });
            failedFiles.push(failedName);
          }
        }

        if (links.length === 0) {
          new Notice('Failed to save pasted images');
          return;
        }

        const cursor = view.editor.getCursor();
        const text = links.join('\n');
        view.editor.replaceRange(text, cursor);
        if (this.settingsManager.getSettings().dropPasteCursorLocation === 'back') {
          view.editor.setCursor({ line: cursor.line, ch: cursor.ch + text.length });
        }

        if (failedFiles.length > 0) {
          showOperationNotice(this.settingsManager.getSettings(), `Processed ${links.length} pasted image(s), failed ${failedFiles.length}`);
        } else {
          showOperationNotice(this.settingsManager.getSettings(), formatSavedLocationNotice(savedPaths));
        }

        if (fallbackFiles.length > 0) {
          showOperationNotice(
            this.settingsManager.getSettings(),
            `Pasted ${fallbackFiles.length} image(s) without conversion because they were skipped or the current platform does not support the requested format`
          );
        }

        this.services.logger.debug('Paste handler completed', {
          notePath: noteFile.path,
          insertedLinks: links.length,
          failedFiles,
          fallbackFiles
        });
      }
    );
  }

  private async readClipboardImageInput(input: ClipboardImageInput): Promise<{
    source: ArrayBuffer;
    originalName: string;
  }> {
    if (input.kind === 'clipboard-file') {
      return {
        source: await input.file.arrayBuffer(),
        originalName: input.file.name || `pasted-image-${Date.now()}.png`
      };
    }

    const resolved = await resolveTextImageSource(input.source);
    return {
      source: resolved.data,
      originalName: resolved.originalName
    };
  }

  private getClipboardImageInputLabel(input: ClipboardImageInput): string {
    if (input.kind === 'clipboard-file') {
      return input.file.name || 'unnamed-image';
    }

    switch (input.source.kind) {
      case 'remote':
      case 'file':
        return input.source.originalName;
      case 'data':
        return 'base64-image';
    }
  }

  private async convertAndReplace(file: TFile, format: ImageFormat): Promise<TFile> {
    const buffer = await this.services.imageProcessor.convert(file, format);
    const targetPath = getConvertedTargetPath(
      file.path,
      format,
      (candidate) => this.app.vault.getAbstractFileByPath(candidate) !== null
    );
    return this.services.fileManager.replaceFile(file, buffer, targetPath);
  }

  private extensionToImageFormat(extension: string): ImageFormat {
    const normalized = extension.toLowerCase();
    if (normalized === 'jpg') {
      return ImageFormat.JPEG;
    }
    if (Object.values(ImageFormat).includes(normalized as ImageFormat)) {
      return normalized as ImageFormat;
    }
    return this.settingsManager.getSettings().defaultFormat;
  }

  private async rewriteActiveNoteImageLinks(): Promise<void> {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view?.file) {
      return;
    }
    const noteFile = view.file;

    await this.services.recovery.runTransaction(
      {
        label: `重写活动笔记图片链接 ${noteFile.basename}`,
        trigger: 'settings-rewrite',
        scope: 'single-note'
      },
      async () => {
        await this.services.recovery.captureTextSnapshot(noteFile.path, view.editor.getValue());
        const result = await this.services.fileManager.rewriteImageLinksInNote(noteFile);
        if (result.replaced > 0 || result.moved > 0) {
          this.services.logger.debug('Updated active note image links after settings change', {
            notePath: noteFile.path,
            updatedLinks: result.replaced,
            movedImages: result.moved
          });
        }
      }
    );
  }
}
