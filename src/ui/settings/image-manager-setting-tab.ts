import { Notice, PluginSettingTab, Setting } from 'obsidian';
import type { App, ButtonComponent, TextAreaComponent } from 'obsidian';
import { VariableResolver } from '@/services/variable-resolver';
import type ImageManagerPlugin from '@/main';
import {
  Alignment,
  DEFAULT_SETTINGS,
  GalleryGridSize,
  GallerySortBy,
  ImageFormat,
  LinkFormat,
  MarkdownPathEncodingStrategy,
  PathFormat,
  type ImageManagerFeature,
  type ImageManagerSettings
} from '@/types/index';
import { getSettingTabCopy, getUiLanguageOptions, type ExampleOption, type PresetOption } from '@/i18n';
import {
  canWriteImageToClipboard,
  describeCurrentPlatform,
  getAttachmentFolderSetting,
  getSupportedCanvasOutputFormats
} from '@/utils/compatibility';
import { detectPluginConflicts } from '@/utils/plugin-conflicts';
import { validateRegexIgnorePattern } from '@/utils/regex-ignore';
import { getParentPath, isRelocatableOutputFolderTemplate, resolveNoteScopedPath } from '@/utils/image-manager';

interface CompatibilityCard {
  readonly title: string;
  readonly tone: 'ok' | 'warning';
  readonly description: string;
}

export class ImageManagerSettingTab extends PluginSettingTab {
  private readonly variableResolver = new VariableResolver();

  constructor(
    app: App,
    private readonly plugin: ImageManagerPlugin
  ) {
    super(app, plugin);
  }

  override display(): void {
    const { containerEl } = this;
    const settings = this.plugin.getSettings();
    const copy = this.getCopy();
    let renameInput: TextAreaComponent | null = null;
    let outputFolderInput: TextAreaComponent | null = null;
    let renameSetting: Setting | null = null;
    let outputFolderSetting: Setting | null = null;
    let renamePreviewValue: HTMLElement | null = null;
    let outputFolderPreviewValue: HTMLElement | null = null;

    containerEl.empty();
    containerEl.addClass('image-manager-settings');

    this.renderHeader(containerEl);

    const namingSection = this.createSection(
      containerEl,
      copy.sections.naming.title,
      copy.sections.naming.description
    );

    outputFolderSetting = new Setting(namingSection)
      .setName(copy.settings.outputFolderName)
      .setDesc(copy.settings.outputFolderDesc)
      .addTextArea((text) => {
        outputFolderInput = text;
        text.inputEl.rows = 2;
        text.setPlaceholder('./assets/${noteFileName}');
        text.setValue(settings.outputFolder).onChange(async (value) => {
          await this.updateSettings((draft) => {
            draft.outputFolder = value;
          });
          if (outputFolderSetting !== null && outputFolderPreviewValue !== null) {
            this.updateOutputFolderFeedback(outputFolderSetting, outputFolderPreviewValue, value);
          }
        });
        text.inputEl.addClass('image-manager-settings-code-input');
        text.inputEl.addClass('image-manager-settings-textarea');
      });

    this.createExampleRow(
      namingSection,
      copy.exampleTitles.outputFolder,
      copy.outputFolderExamples,
      (value) => {
        void this.applyOutputFolderExample(outputFolderInput, outputFolderSetting, outputFolderPreviewValue, value);
      }
    );
    outputFolderPreviewValue = this.createPreviewBlock(namingSection, copy.previews.outputFolder);
    this.updateOutputFolderFeedback(outputFolderSetting, outputFolderPreviewValue, settings.outputFolder);

    new Setting(namingSection)
      .setName(copy.settings.defaultFormatName)
      .setDesc(copy.settings.defaultFormatDesc)
      .addDropdown((dropdown) =>
        dropdown
          .addOption(ImageFormat.WEBP, 'WebP')
          .addOption(ImageFormat.JPEG, 'JPEG')
          .addOption(ImageFormat.PNG, 'PNG')
          .setValue(settings.defaultFormat)
          .onChange(async (value) => {
            await this.updateSettings((draft) => {
              draft.defaultFormat = value as ImageFormat;
            });
            if (renameSetting !== null && renamePreviewValue !== null) {
              this.updateRenameFeedback(renameSetting, renamePreviewValue, this.plugin.getSettings().renamePattern);
            }
          })
      );

    new Setting(namingSection)
      .setName(copy.settings.defaultLinkFormatName)
      .setDesc(copy.settings.defaultLinkFormatDesc)
      .addDropdown((dropdown) =>
        dropdown
          .addOption(LinkFormat.WIKI, copy.options.linkFormat.wiki)
          .addOption(LinkFormat.MARKDOWN, copy.options.linkFormat.markdown)
          .setValue(settings.defaultLinkFormat)
          .onChange(async (value) => {
            await this.updateSettings((draft) => {
              draft.defaultLinkFormat = value as LinkFormat;
            });
          })
      );

    new Setting(namingSection)
      .setName(copy.settings.defaultPathFormatName)
      .setDesc(copy.settings.defaultPathFormatDesc)
      .addDropdown((dropdown) =>
        dropdown
          .addOption(PathFormat.SHORTEST, copy.options.pathFormat.shortest)
          .addOption(PathFormat.RELATIVE, copy.options.pathFormat.relative)
          .addOption(PathFormat.ABSOLUTE, copy.options.pathFormat.absolute)
          .setValue(settings.defaultPathFormat)
          .onChange(async (value) => {
            await this.updateSettings((draft) => {
              draft.defaultPathFormat = value as PathFormat;
            });
          })
      );

    new Setting(namingSection)
      .setName(copy.settings.markdownPathName)
      .setDesc(copy.settings.markdownPathDesc)
      .addDropdown((dropdown) =>
        dropdown
          .addOption(MarkdownPathEncodingStrategy.ENCODED, copy.options.markdownPathEncodingStrategy.encoded)
          .addOption(MarkdownPathEncodingStrategy.READABLE, copy.options.markdownPathEncodingStrategy.readable)
          .addOption(MarkdownPathEncodingStrategy.AUTO, copy.options.markdownPathEncodingStrategy.auto)
          .setValue(settings.markdownPathEncodingStrategy)
          .onChange(async (value) => {
            await this.updateSettings((draft) => {
              draft.markdownPathEncodingStrategy = value as MarkdownPathEncodingStrategy;
            });
          })
      );

    renameSetting = new Setting(namingSection)
      .setName(copy.settings.renamePatternName)
      .setDesc(copy.settings.renamePatternDesc)
      .addTextArea((text) => {
        renameInput = text;
        text.inputEl.rows = 2;
        text.setPlaceholder(DEFAULT_SETTINGS.renamePattern);
        text.setValue(settings.renamePattern).onChange(async (value) => {
          await this.updateSettings((draft) => {
            draft.renamePattern = value;
          });
          if (renameSetting !== null && renamePreviewValue !== null) {
            this.updateRenameFeedback(renameSetting, renamePreviewValue, value);
          }
        });
        text.inputEl.addClass('image-manager-settings-code-input');
        text.inputEl.addClass('image-manager-settings-textarea');
      });

    this.createExampleRow(
      namingSection,
      copy.exampleTitles.renamePattern,
      copy.renameExamples,
      (value) => {
        void this.applyRenameExample(renameInput, renameSetting, renamePreviewValue, value);
      }
    );
    renamePreviewValue = this.createPreviewBlock(namingSection, copy.previews.renamePattern);
    this.updateRenameFeedback(renameSetting, renamePreviewValue, settings.renamePattern);

    this.createPresetRow(
      namingSection,
      copy.exampleTitles.presets,
      copy.rulePresets,
      (preset) => {
        void this.applyRulePreset(
          renameInput,
          outputFolderInput,
          renameSetting,
          outputFolderSetting,
          renamePreviewValue,
          outputFolderPreviewValue,
          preset
        );
      }
    );

    this.createVariableReference(namingSection);

    new Setting(namingSection)
      .setName(copy.settings.enableAutoRenameName)
      .setDesc(copy.settings.enableAutoRenameDesc)
      .addToggle((toggle) =>
        toggle.setValue(settings.enableAutoRename).onChange(async (value) => {
          await this.updateSettings((draft) => {
            draft.enableAutoRename = value;
          });
          if (renameSetting !== null && renamePreviewValue !== null) {
            this.updateRenameFeedback(renameSetting, renamePreviewValue, this.plugin.getSettings().renamePattern);
          }
        })
      );

    new Setting(namingSection)
      .setName(copy.settings.renameImagesOnRelocateName)
      .setDesc(copy.settings.renameImagesOnRelocateDesc)
      .addToggle((toggle) =>
        toggle.setValue(settings.renameImagesOnNoteRelocate).onChange(async (value) => {
          await this.updateSettings((draft) => {
            draft.renameImagesOnNoteRelocate = value;
          });
        })
      );

    new Setting(namingSection)
      .setName(copy.settings.deleteEmptyFoldersName)
      .setDesc(copy.settings.deleteEmptyFoldersDesc)
      .addToggle((toggle) =>
        toggle.setValue(settings.deleteEmptyFolders).onChange(async (value) => {
          await this.updateSettings((draft) => {
            draft.deleteEmptyFolders = value;
          });
        })
      );

    new Setting(namingSection)
      .setName(copy.settings.deleteOrphanImagesName)
      .setDesc(copy.settings.deleteOrphanImagesDesc)
      .addToggle((toggle) =>
        toggle.setValue(settings.deleteOrphanImages).onChange(async (value) => {
          await this.updateSettings((draft) => {
            draft.deleteOrphanImages = value;
          });
        })
      );

    const convertSection = this.createSection(
      containerEl,
      copy.sections.convert.title,
      copy.sections.convert.description
    );
    convertSection.addClass('image-manager-settings-section--convert');

    new Setting(convertSection)
      .setName(copy.settings.defaultQualityName)
      .setDesc(copy.settings.defaultQualityDesc)
      .addSlider((slider) =>
        slider
          .setLimits(1, 100, 1)
          .setValue(settings.defaultQuality)
          .onChange(async (value) => {
            await this.updateSettings((draft) => {
              draft.defaultQuality = value;
            });
          })
      );

    new Setting(convertSection)
      .setName(copy.settings.compressionQualityName)
      .setDesc(copy.settings.compressionQualityDesc)
      .addSlider((slider) =>
        slider
          .setLimits(1, 100, 1)
          .setValue(settings.compressionQuality)
          .onChange(async (value) => {
            await this.updateSettings((draft) => {
              draft.compressionQuality = value;
            });
          })
      );

    new Setting(convertSection)
      .setName(copy.settings.enableAutoConvertName)
      .setDesc(copy.settings.enableAutoConvertDesc)
      .addToggle((toggle) =>
        toggle.setValue(settings.enableAutoConvert).onChange(async (value) => {
          await this.updateSettings((draft) => {
            draft.enableAutoConvert = value;
          });
        })
      );

    new Setting(convertSection)
      .setName(copy.settings.showOperationNotificationsName)
      .setDesc(copy.settings.showOperationNotificationsDesc)
      .addToggle((toggle) =>
        toggle.setValue(settings.showOperationNotifications).onChange(async (value) => {
          await this.updateSettings((draft) => {
            draft.showOperationNotifications = value;
          });
        })
      );

    new Setting(convertSection)
      .setName(copy.settings.showSpaceSavedNotificationName)
      .setDesc(copy.settings.showSpaceSavedNotificationDesc)
      .addToggle((toggle) =>
        toggle.setValue(settings.showSpaceSavedNotification).onChange(async (value) => {
          await this.updateSettings((draft) => {
            draft.showSpaceSavedNotification = value;
          });
        })
      );

    new Setting(convertSection)
      .setName(copy.settings.enableDebugLoggingName)
      .setDesc(copy.settings.enableDebugLoggingDesc)
      .addToggle((toggle) =>
        toggle.setValue(settings.enableDebugLogging).onChange(async (value) => {
          await this.updateSettings((draft) => {
            draft.enableDebugLogging = value;
          });
          this.display();
        })
      );

    const thresholdWrap = convertSection.createDiv({ cls: 'image-manager-settings-threshold' });
    new Setting(thresholdWrap)
      .setName(copy.settings.compressionThresholdKBName)
      .setDesc(copy.settings.compressionThresholdKBDesc)
      .addText((text) => {
        text.inputEl.addClass('image-manager-settings-threshold__input');
        text.setPlaceholder('100').setValue(String(settings.compressionThresholdKB)).onChange(async (value) => {
          const parsed = Number.parseInt(value, 10);
          await this.updateSettings((draft) => {
            draft.compressionThresholdKB = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
          });
        });
      });

    const rulePanel = convertSection.createDiv({ cls: 'image-manager-settings-rule-panel' });

    const compressionRuleBlock = rulePanel.createDiv({ cls: 'image-manager-settings-rule-block' });
    const compressionIgnoreSetting = new Setting(compressionRuleBlock)
      .setName(copy.settings.compressionIgnorePatternName)
      .setDesc(copy.settings.compressionIgnorePatternDesc)
      .addTextArea((text) => {
        text.inputEl.rows = 3;
        text.setPlaceholder('^assets/raw/\n\\.gif$');
        text.setValue(settings.compressionIgnorePattern).onChange(async (value) => {
          await this.updateSettings((draft) => {
            draft.compressionIgnorePattern = value;
          });
          this.updateRegexPatternFeedback(compressionIgnoreSetting, value);
        });
        text.inputEl.addClass('image-manager-settings-code-input');
        text.inputEl.addClass('image-manager-settings-textarea');
      });
    compressionIgnoreSetting.settingEl.addClass('image-manager-settings-rule-setting');
    this.updateRegexPatternFeedback(compressionIgnoreSetting, settings.compressionIgnorePattern);
    this.createExampleRow(
      compressionRuleBlock,
      copy.exampleTitles.compressionIgnore,
      copy.compressionIgnoreExamples,
      (value) => {
        void this.applySettingValue((draft) => {
          draft.compressionIgnorePattern = value;
        });
      }
    ).addClass('image-manager-settings-rule-examples');

    const conversionRuleBlock = rulePanel.createDiv({ cls: 'image-manager-settings-rule-block' });
    const conversionIgnoreSetting = new Setting(conversionRuleBlock)
      .setName(copy.settings.conversionIgnorePatternName)
      .setDesc(copy.settings.conversionIgnorePatternDesc)
      .addTextArea((text) => {
        text.inputEl.rows = 3;
        text.setPlaceholder('^Screenshots/\n\\.png$');
        text.setValue(settings.conversionIgnorePattern).onChange(async (value) => {
          await this.updateSettings((draft) => {
            draft.conversionIgnorePattern = value;
          });
          this.updateRegexPatternFeedback(conversionIgnoreSetting, value);
        });
        text.inputEl.addClass('image-manager-settings-code-input');
        text.inputEl.addClass('image-manager-settings-textarea');
      });
    conversionIgnoreSetting.settingEl.addClass('image-manager-settings-rule-setting');
    this.updateRegexPatternFeedback(conversionIgnoreSetting, settings.conversionIgnorePattern);
    this.createExampleRow(
      conversionRuleBlock,
      copy.exampleTitles.conversionIgnore,
      copy.conversionIgnoreExamples,
      (value) => {
        void this.applySettingValue((draft) => {
          draft.conversionIgnorePattern = value;
        });
      }
    ).addClass('image-manager-settings-rule-examples');

    const editorSection = this.createSection(
      containerEl,
      copy.sections.editor.title,
      copy.sections.editor.description
    );

    new Setting(editorSection)
      .setName(copy.settings.enablePasteHandlerName)
      .setDesc(copy.settings.enablePasteHandlerDesc)
      .addToggle((toggle) =>
        toggle.setValue(settings.enablePasteHandler).onChange(async (value) => {
          await this.updateSettings((draft) => {
            draft.enablePasteHandler = value;
          });
          this.display();
        })
      );

    new Setting(editorSection)
      .setName(copy.settings.enableAutoDownloadImagesFromTextName)
      .setDesc(copy.settings.enableAutoDownloadImagesFromTextDesc)
      .addToggle((toggle) =>
        toggle.setValue(settings.enableAutoDownloadImagesFromText).onChange(async (value) => {
          await this.updateSettings((draft) => {
            draft.enableAutoDownloadImagesFromText = value;
          });
        })
      );

    new Setting(editorSection)
      .setName(copy.settings.dropPasteCursorLocationName)
      .setDesc(copy.settings.dropPasteCursorLocationDesc)
      .addDropdown((dropdown) =>
        dropdown
          .addOption('front', copy.options.dropPasteCursorLocation.front)
          .addOption('back', copy.options.dropPasteCursorLocation.back)
          .setValue(settings.dropPasteCursorLocation)
          .onChange(async (value) => {
            await this.updateSettings((draft) => {
              draft.dropPasteCursorLocation = value as 'front' | 'back';
            });
          })
      );

    new Setting(editorSection)
      .setName(copy.settings.enableContextMenuName)
      .setDesc(copy.settings.enableContextMenuDesc)
      .addToggle((toggle) =>
        toggle.setValue(settings.enableContextMenu).onChange(async (value) => {
          await this.updateSettings((draft) => {
            draft.enableContextMenu = value;
          });
          this.display();
        })
      );

    new Setting(editorSection)
      .setName(copy.settings.enableImageAlignName)
      .setDesc(copy.settings.enableImageAlignDesc)
      .addToggle((toggle) =>
        toggle.setValue(settings.enableImageAlign).onChange(async (value) => {
          await this.updateSettings((draft) => {
            draft.enableImageAlign = value;
          });
        })
      );

    new Setting(editorSection)
      .setName(copy.settings.imageAlignmentDefaultName)
      .setDesc(copy.settings.imageAlignmentDefaultDesc)
      .addDropdown((dropdown) =>
        dropdown
          .addOption(Alignment.NONE, copy.options.imageAlignment.none)
          .addOption(Alignment.LEFT, copy.options.imageAlignment.left)
          .addOption(Alignment.CENTER, copy.options.imageAlignment.center)
          .addOption(Alignment.RIGHT, copy.options.imageAlignment.right)
          .setValue(settings.imageAlignmentDefaultAlignment)
          .onChange(async (value) => {
            await this.updateSettings((draft) => {
              draft.imageAlignmentDefaultAlignment = value as ImageManagerSettings['imageAlignmentDefaultAlignment'];
            });
          })
      );

    new Setting(editorSection)
      .setName(copy.settings.disableImageSelectionName)
      .setDesc(copy.settings.disableImageSelectionDesc)
      .addToggle((toggle) =>
        toggle.setValue(settings.disableObsidianImageSelectionOnClick).onChange(async (value) => {
          await this.updateSettings((draft) => {
            draft.disableObsidianImageSelectionOnClick = value;
          });
        })
      );

    const gallerySection = this.createSection(
      containerEl,
      copy.sections.gallery.title,
      copy.sections.gallery.description
    );

    new Setting(gallerySection)
      .setName(copy.settings.enableGalleryName)
      .setDesc(copy.settings.enableGalleryDesc)
      .addToggle((toggle) =>
        toggle.setValue(settings.enableGallery).onChange(async (value) => {
          await this.updateSettings((draft) => {
            draft.enableGallery = value;
          });
        })
      );

    new Setting(gallerySection)
      .setName(copy.settings.galleryGridSizeName)
      .setDesc(copy.settings.galleryGridSizeDesc)
      .addDropdown((dropdown) =>
        dropdown
          .addOption(GalleryGridSize.SMALL, copy.options.galleryGridSize.small)
          .addOption(GalleryGridSize.MEDIUM, copy.options.galleryGridSize.medium)
          .addOption(GalleryGridSize.LARGE, copy.options.galleryGridSize.large)
          .setValue(settings.galleryGridSize)
          .onChange(async (value) => {
            await this.updateSettings((draft) => {
              draft.galleryGridSize = value as GalleryGridSize;
            });
          })
      );

    new Setting(gallerySection)
      .setName(copy.settings.gallerySortByName)
      .setDesc(copy.settings.gallerySortByDesc)
      .addDropdown((dropdown) =>
        dropdown
          .addOption(GallerySortBy.DATE, copy.options.gallerySortBy.date)
          .addOption(GallerySortBy.NAME, copy.options.gallerySortBy.name)
          .addOption(GallerySortBy.SIZE, copy.options.gallerySortBy.size)
          .setValue(settings.gallerySortBy)
          .onChange(async (value) => {
            await this.updateSettings((draft) => {
              draft.gallerySortBy = value as GallerySortBy;
            });
          })
      );

    this.renderCompatibilitySection(containerEl, settings);
    this.renderFeatureStatus(containerEl);
  }

  private renderHeader(containerEl: HTMLElement): void {
    const copy = this.getCopy();
    const languageOptions = getUiLanguageOptions();
    const hero = containerEl.createDiv({ cls: 'image-manager-settings-hero' });
    const content = hero.createDiv({ cls: 'image-manager-settings-hero__content' });
    new Setting(content).setName(copy.header.title).setHeading();
    content.createEl('p', {
      text: copy.header.subtitle
    });

    const actionWrap = hero.createDiv({ cls: 'image-manager-settings-hero__actions' });
    new Setting(actionWrap)
      .setName(copy.languageLabel)
      .setDesc(copy.languageDescription)
      .addDropdown((dropdown) =>
        dropdown
          .addOption('zh-CN', languageOptions['zh-CN'])
          .addOption('en', languageOptions.en)
          .setValue(this.plugin.getSettings().uiLanguage)
          .onChange(async (value) => {
            await this.updateSettings((draft) => {
              draft.uiLanguage = value as ImageManagerSettings['uiLanguage'];
            });
            this.display();
          })
      );

    new Setting(actionWrap).addButton((button) => {
      button.setButtonText(copy.header.reset);
      this.styleDestructiveButton(button);
      button.onClick(async () => {
        await this.updateSettings((draft) => {
          Object.assign(draft, DEFAULT_SETTINGS);
        });
        new Notice(copy.header.resetNotice);
        this.display();
      });
    });
  }

  private styleDestructiveButton(button: ButtonComponent): void {
    const compatibleButton = button as ButtonComponent & {
      setDestructive?: () => ButtonComponent;
      setWarning?: () => ButtonComponent;
    };

    if (typeof compatibleButton.setDestructive === 'function') {
      compatibleButton.setDestructive();
      return;
    }

    if (typeof compatibleButton.setWarning === 'function') {
      compatibleButton.setWarning();
      return;
    }

    button.buttonEl.addClass('mod-warning');
  }

  private createSection(containerEl: HTMLElement, title: string, description: string): HTMLElement {
    const section = containerEl.createDiv({ cls: 'image-manager-settings-section' });
    const header = section.createDiv({ cls: 'image-manager-settings-section__header' });
    new Setting(header).setName(title).setHeading();
    header.createEl('p', { text: description });
    return section;
  }

  private createPreviewBlock(containerEl: HTMLElement, label: string): HTMLElement {
    const preview = containerEl.createDiv({ cls: 'image-manager-settings-preview' });
    preview.createEl('div', { cls: 'image-manager-settings-preview__label', text: label });
    return preview.createDiv({ cls: 'image-manager-settings-preview__value' });
  }

  private createExampleRow(
    containerEl: HTMLElement,
    title: string,
    examples: readonly ExampleOption[],
    onApply: (value: string) => void
  ): HTMLElement {
    const wrap = containerEl.createDiv({ cls: 'image-manager-settings-examples' });
    wrap.createEl('div', { cls: 'image-manager-settings-examples__title', text: title });
    const list = wrap.createDiv({ cls: 'image-manager-settings-examples__list' });

    for (const example of examples) {
      const button = list.createEl('button', { cls: 'image-manager-settings-chip', text: example.label });
      button.type = 'button';
      button.title = `${example.value || this.getCopy().labels.outputFolderFallback}\n${example.description}`;
      button.addEventListener('click', () => {
        onApply(example.value);
      });
    }

    return wrap;
  }

  private createPresetRow(
    containerEl: HTMLElement,
    title: string,
    presets: readonly PresetOption[],
    onApply: (preset: PresetOption) => void
  ): void {
    const copy = this.getCopy();
    const wrap = containerEl.createDiv({ cls: 'image-manager-settings-presets' });
    wrap.createEl('div', { cls: 'image-manager-settings-examples__title', text: title });
    const list = wrap.createDiv({ cls: 'image-manager-settings-presets__list' });

    for (const preset of presets) {
      const card = list.createDiv({ cls: 'image-manager-settings-preset' });
      card.createEl('strong', { text: preset.label });
      card.createEl('p', { text: preset.description });
      card.createEl('code', { text: `${copy.settings.renamePatternName}: ${preset.renamePattern}` });
      card.createEl('code', {
        text: `${copy.settings.outputFolderName}: ${preset.outputFolder || copy.labels.outputFolderFallback}`
      });
      const applyButton = card.createEl('button', {
        cls: 'image-manager-settings-preset__button',
        text: copy.buttons.applyPreset
      });
      applyButton.type = 'button';
      applyButton.addEventListener('click', () => {
        onApply(preset);
      });
    }
  }

  private createVariableReference(containerEl: HTMLElement): void {
    const copy = this.getCopy();
    const block = containerEl.createDiv({ cls: 'image-manager-settings-variables' });
    block.createEl('div', { cls: 'image-manager-settings-examples__title', text: copy.exampleTitles.variables });
    const list = block.createDiv({ cls: 'image-manager-settings-variables__list' });

    for (const variable of copy.variableDescriptions) {
      const item = list.createDiv({ cls: 'image-manager-settings-variables__item' });
      item.createEl('code', { text: variable.token });
      item.createSpan({ text: variable.description });
    }
  }

  private updateRenameFeedback(setting: Setting, previewEl: HTMLElement, value: string): void {
    const copy = this.getCopy();
    const unresolved = this.variableResolver.validatePattern(value);
    this.setSettingErrorMessage(
      setting,
      unresolved.length > 0 ? `${copy.labels.invalidVariables}${unresolved.join('、')}` : null
    );

    if (!this.plugin.getSettings().enableAutoRename) {
      previewEl.setText(`${copy.samples.fileName}.${this.plugin.getSettings().defaultFormat}`);
      return;
    }

    const sample = this.variableResolver.createContext(copy.samples.noteName, copy.samples.fileName);
    const resolved = this.variableResolver.resolve(value, sample) || copy.samples.fileName;
    const extension = this.plugin.getSettings().defaultFormat;
    previewEl.setText(`${resolved}.${extension}`);
  }

  private updateOutputFolderFeedback(setting: Setting, previewEl: HTMLElement, value: string): void {
    const copy = this.getCopy();
    const unresolved = this.variableResolver.validatePattern(value);
    this.setSettingErrorMessage(
      setting,
      unresolved.length > 0 ? `${copy.labels.invalidVariables}${unresolved.join('、')}` : null
    );

    if (!value.trim()) {
      previewEl.setText(getParentPath(copy.samples.notePath) || copy.samples.vaultRoot);
      return;
    }

    const sample = this.variableResolver.createContext(copy.samples.noteName, copy.samples.fileName);
    const resolved = this.variableResolver.resolvePath(value, sample);
    const finalPath = resolveNoteScopedPath(resolved, copy.samples.notePath);
    previewEl.setText(`${resolved} -> ${finalPath}`);
  }

  private renderCompatibilitySection(containerEl: HTMLElement, settings: ImageManagerSettings): void {
    const copy = this.getCopy();
    const section = this.createSection(
      containerEl,
      copy.sections.compatibility.title,
      copy.sections.compatibility.description
    );

    new Setting(section)
      .setName(copy.settings.enableNoteRenameSyncName)
      .setDesc(copy.settings.enableNoteRenameSyncDesc)
      .addToggle((toggle) =>
        toggle.setValue(settings.enableNoteRenameSync).onChange(async (value) => {
          await this.updateSettings((draft) => {
            draft.enableNoteRenameSync = value;
          });
          this.display();
        })
      );

    const cards = this.getCompatibilityCards(settings);
    const list = section.createDiv({ cls: 'image-manager-settings-status' });
    for (const card of cards) {
      const cardEl = list.createDiv({ cls: 'image-manager-settings-card' });
      const top = cardEl.createDiv({ cls: 'image-manager-settings-card__top' });
      top.createEl('strong', { text: card.title });
      top.createEl('span', {
        cls: `image-manager-settings-badge image-manager-settings-badge--${card.tone}`,
        text: card.tone === 'ok' ? copy.labels.compatibilityOk : copy.labels.compatibilityWarning
      });
      cardEl.createEl('p', { text: card.description });
    }
  }

  private renderFeatureStatus(containerEl: HTMLElement): void {
    const copy = this.getCopy();
    const section = this.createSection(
      containerEl,
      copy.sections.featureStatus.title,
      copy.sections.featureStatus.description
    );

    const list = section.createDiv({ cls: 'image-manager-settings-status' });
    for (const feature of this.plugin.listFeatures()) {
      const card = list.createDiv({ cls: 'image-manager-settings-card' });
      const top = card.createDiv({ cls: 'image-manager-settings-card__top' });
      top.createEl('strong', { text: copy.featureLabels[feature.id] ?? feature.name });
      top.createEl('span', {
        cls: `image-manager-settings-badge image-manager-settings-badge--${feature.state}`,
        text: copy.featureStates[feature.state]
      });
      card.createEl('p', { text: this.translateFeatureSummary(feature) });
    }
  }

  private translateFeatureSummary(feature: ImageManagerFeature): string {
    return this.getCopy().featureSummaries[feature.id] ?? feature.summary;
  }

  private async updateSettings(mutator: (draft: ImageManagerSettings) => void): Promise<void> {
    await this.plugin.updateSettings(mutator);
  }

  private setSettingErrorMessage(setting: Setting, message: string | null): void {
    const settingWithOptionalError = setting as Setting & {
      setErrorMessage?: (value: string | null) => Setting;
    };

    if (typeof settingWithOptionalError.setErrorMessage === 'function') {
      settingWithOptionalError.setErrorMessage(message);
    }
  }

  private getCompatibilityCards(settings: ImageManagerSettings): readonly CompatibilityCard[] {
    const copy = this.getCopy();
    const supportedFormats = getSupportedCanvasOutputFormats().map((format) => format.toUpperCase());
    const attachmentFolder = getAttachmentFolderSetting(this.app);
    const debugLoggingEnabled = settings.enableDebugLogging;
    const pluginConflicts = detectPluginConflicts(this.app, settings);
    const cards: CompatibilityCard[] = [
      {
        title: copy.compatibility.platformTitle,
        tone: 'ok',
        description: copy.compatibility.platformDescription(
          describeCurrentPlatform(settings.uiLanguage),
          canWriteImageToClipboard()
        )
      },
      {
        title: copy.compatibility.debugTitle,
        tone: debugLoggingEnabled ? 'warning' : 'ok',
        description: debugLoggingEnabled ? copy.compatibility.debugEnabled : copy.compatibility.debugDisabled
      },
      {
        title: copy.compatibility.formatsTitle,
        tone: supportedFormats.length >= 2 ? 'ok' : 'warning',
        description:
          supportedFormats.length > 0
            ? copy.compatibility.formatsAvailable(supportedFormats)
            : copy.compatibility.formatsUnavailable
      }
    ];

    if (settings.enablePasteHandler) {
      cards.push({
        title: copy.compatibility.pasteConflictTitle,
        tone: 'warning',
        description: copy.compatibility.pasteConflictEnabled
      });
    } else {
      cards.push({
        title: copy.compatibility.pasteConflictTitle,
        tone: 'ok',
        description: copy.compatibility.pasteConflictDisabled
      });
    }

    if (settings.enablePasteHandler && attachmentFolder) {
      cards.push({
        title: copy.compatibility.nativeAttachmentTitle,
        tone: 'warning',
        description: copy.compatibility.nativeAttachmentDescription(attachmentFolder)
      });
    }

    for (const conflict of pluginConflicts) {
      const featureLabel = copy.compatibility.conflictFeatureLabels[conflict.feature];
      cards.push({
        title: copy.compatibility.pluginConflictTitle(featureLabel),
        tone: 'warning',
        description: copy.compatibility.pluginConflictDescription(
          conflict.pluginName,
          conflict.pluginId,
          this.translatePluginConflictDescription(conflict.feature)
        )
      });
    }

    if (settings.enableNoteRenameSync && !isRelocatableOutputFolderTemplate(settings.outputFolder)) {
      cards.push({
        title: copy.compatibility.renameSyncTitle,
        tone: 'warning',
        description: copy.compatibility.renameSyncUnsafe
      });
    } else if (settings.enableNoteRenameSync) {
      cards.push({
        title: copy.compatibility.renameSyncTitle,
        tone: 'ok',
        description: copy.compatibility.renameSyncSafe
      });
    } else {
      cards.push({
        title: copy.compatibility.renameSyncTitle,
        tone: 'ok',
        description: copy.compatibility.renameSyncDisabled
      });
    }

    return cards;
  }

  private async applyRenameExample(
    renameInput: TextAreaComponent | null,
    renameSetting: Setting | null,
    renamePreviewValue: HTMLElement | null,
    value: string
  ): Promise<void> {
    renameInput?.setValue(value);
    await this.updateSettings((draft) => {
      draft.renamePattern = value;
    });
    if (renameSetting !== null && renamePreviewValue !== null) {
      this.updateRenameFeedback(renameSetting, renamePreviewValue, value);
    }
  }

  private async applyOutputFolderExample(
    outputFolderInput: TextAreaComponent | null,
    outputFolderSetting: Setting | null,
    outputFolderPreviewValue: HTMLElement | null,
    value: string
  ): Promise<void> {
    outputFolderInput?.setValue(value);
    await this.updateSettings((draft) => {
      draft.outputFolder = value;
    });
    if (outputFolderSetting !== null && outputFolderPreviewValue !== null) {
      this.updateOutputFolderFeedback(outputFolderSetting, outputFolderPreviewValue, value);
    }
  }

  private async applyRulePreset(
    renameInput: TextAreaComponent | null,
    outputFolderInput: TextAreaComponent | null,
    renameSetting: Setting | null,
    outputFolderSetting: Setting | null,
    renamePreviewValue: HTMLElement | null,
    outputFolderPreviewValue: HTMLElement | null,
    preset: PresetOption
  ): Promise<void> {
    renameInput?.setValue(preset.renamePattern);
    outputFolderInput?.setValue(preset.outputFolder);
    await this.updateSettings((draft) => {
      draft.renamePattern = preset.renamePattern;
      draft.outputFolder = preset.outputFolder;
    });
    if (renameSetting !== null && renamePreviewValue !== null) {
      this.updateRenameFeedback(renameSetting, renamePreviewValue, preset.renamePattern);
    }
    if (outputFolderSetting !== null && outputFolderPreviewValue !== null) {
      this.updateOutputFolderFeedback(outputFolderSetting, outputFolderPreviewValue, preset.outputFolder);
    }
  }

  private updateRegexPatternFeedback(setting: Setting, value: string): void {
    const invalid = validateRegexIgnorePattern(value);
    this.setSettingErrorMessage(
      setting,
      invalid.length > 0 ? `${this.getCopy().labels.invalidRegex}${invalid.join('、')}` : null
    );
  }

  private async applySettingValue(mutator: (draft: ImageManagerSettings) => void): Promise<void> {
    await this.updateSettings(mutator);
    this.display();
  }

  private getCopy(): ReturnType<typeof getSettingTabCopy> {
    return getSettingTabCopy(this.plugin.getSettings().uiLanguage);
  }

  private translatePluginConflictDescription(feature: 'paste-handler' | 'note-rename-sync'): string {
    const copy = this.getCopy();
    return feature === 'paste-handler'
      ? copy.compatibility.pasteConflictEnabled
      : copy.compatibility.renameSyncUnsafe;
  }
}
