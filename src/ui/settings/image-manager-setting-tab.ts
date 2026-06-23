import { Notice, PluginSettingTab, Setting } from 'obsidian';
import type { App, TextAreaComponent } from 'obsidian';
import { VariableResolver } from '@/services/variable-resolver';
import type ImageManagerPlugin from '@/main';
import {
  DEFAULT_SETTINGS,
  GalleryGridSize,
  GallerySortBy,
  ImageFormat,
  LinkFormat,
  PathFormat,
  type ImageManagerFeature,
  type ImageManagerSettings
} from '@/types/index';
import {
  canWriteImageToClipboard,
  detectObsidianDebugMode,
  describeCurrentPlatform,
  getAttachmentFolderSetting,
  getSupportedCanvasOutputFormats
} from '@/utils/compatibility';
import { validateRegexIgnorePattern } from '@/utils/regex-ignore';
import { getParentPath, isRelocatableOutputFolderTemplate, resolveNoteScopedPath } from '@/utils/image-manager';

interface ExampleOption {
  readonly label: string;
  readonly value: string;
  readonly description: string;
}

interface PresetOption {
  readonly label: string;
  readonly description: string;
  readonly renamePattern: string;
  readonly outputFolder: string;
}

const SAMPLE_NOTE_NAME = '项目周报';
const SAMPLE_FILE_NAME = '页面截图';
const SAMPLE_NOTE_PATH = 'Projects/项目周报.md';

const VARIABLE_DESCRIPTIONS: readonly { readonly token: string; readonly description: string }[] = [
  { token: '{noteName}', description: '当前笔记名（不含扩展名）' },
  { token: '{noteFileName}', description: '与 {noteName} 等价，适合目录模板' },
  { token: '{fileName}', description: '原始图片文件名（不含扩展名）' },
  { token: '{date}', description: '当前日期，格式为 YYYY-MM-DD' },
  { token: '{time}', description: '当前时间，格式为 HH-MM-SS' },
  { token: '{random}', description: '随机后缀，避免重名' }
] as const;

const RENAME_PATTERN_EXAMPLES: readonly ExampleOption[] = [
  {
    label: '笔记名 + 日期',
    value: '{noteName}-{date}',
    description: '适合每篇笔记都维护一组图片的场景。'
  },
  {
    label: '笔记名 + 时间',
    value: '{noteName}-{date}-{time}',
    description: '适合频繁粘贴截图，文件名更稳定。'
  },
  {
    label: '沿用原图名',
    value: '{fileName}',
    description: '保留截图工具或下载文件的原始命名。'
  },
  {
    label: '笔记名 + 随机串',
    value: '{noteName}-{random}',
    description: '避免同一天重复粘贴时重名。'
  }
] as const;

const OUTPUT_FOLDER_EXAMPLES: readonly ExampleOption[] = [
  {
    label: '跟随当前笔记',
    value: '',
    description: '留空时，图片保存到当前笔记同目录。'
  },
  {
    label: '固定附件目录',
    value: 'Attachments/Images',
    description: '适合统一管理整个仓库的图片资源。'
  },
  {
    label: '笔记同级 assets',
    value: './assets',
    description: '在当前笔记目录下创建统一附件文件夹。'
  },
  {
    label: '按笔记名分目录',
    value: './assets/${noteFileName}',
    description: '每篇笔记拥有独立图片目录，迁移时更易同步。'
  }
] as const;

const COMPRESSION_IGNORE_EXAMPLES: readonly ExampleOption[] = [
  {
    label: '忽略原始目录',
    value: '^assets/raw/',
    description: '跳过原始素材目录中的图片。'
  },
  {
    label: '忽略 GIF',
    value: '\\.gif$',
    description: '压缩时保留动图。'
  }
] as const;

const CONVERSION_IGNORE_EXAMPLES: readonly ExampleOption[] = [
  {
    label: '忽略截图目录',
    value: '^Screenshots/',
    description: '转换时跳过指定目录。'
  },
  {
    label: '忽略 PNG',
    value: '\\.png$',
    description: '转换时保留 PNG 原格式。'
  }
] as const;

const RULE_PRESETS: readonly PresetOption[] = [
  {
    label: '日常截图',
    description: '适合写作时直接粘贴截图，按笔记分目录保存。',
    renamePattern: '{noteName}-{date}-{time}',
    outputFolder: './assets/${noteFileName}'
  },
  {
    label: '统一图库',
    description: '适合跨笔记复用图片，统一保存到全局目录。',
    renamePattern: '{date}-{time}-{random}',
    outputFolder: 'Attachments/Images'
  },
  {
    label: '保留原始命名',
    description: '适合整理外部下载图片，减少二次命名。',
    renamePattern: '{fileName}',
    outputFolder: './assets'
  }
] as const;

const FEATURE_LABELS: Readonly<Record<string, string>> = {
  rename: '自动命名与迁移',
  compress: '图片压缩',
  convert: '格式转换',
  preview: '图片预览',
  editor: '快速编辑',
  gallery: '图片画廊',
  batch: '批量处理',
  resize: '尺寸调整',
  align: '图片对齐',
  'context-menu': '右键菜单'
} as const;

const FEATURE_STATE_LABELS: Readonly<Record<ImageManagerFeature['state'], string>> = {
  implemented: '已启用',
  scaffolded: '规划中'
} as const;

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
      '保存与命名',
      '先确定图片保存到哪里，再定义文件名规则；下面的格式和路径选项会影响实际写入结果。'
    );

    outputFolderSetting = new Setting(namingSection)
      .setName('图片文件保存位置')
      .setDesc('支持相对路径和变量模板。只要启用本插件的图片粘贴接管，图片就会优先保存到这里。留空时保存到当前笔记所在目录。')
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
      '常用保存位置示例',
      OUTPUT_FOLDER_EXAMPLES,
      (value) => {
        void this.applyOutputFolderExample(outputFolderInput, outputFolderSetting, outputFolderPreviewValue, value);
      }
    );
    outputFolderPreviewValue = this.createPreviewBlock(namingSection, '实际保存位置预览');
    this.updateOutputFolderFeedback(outputFolderSetting, outputFolderPreviewValue, settings.outputFolder);

    new Setting(namingSection)
      .setName('默认图片格式')
      .setDesc('用于粘贴图片自动转换，以及手动执行格式转换时的目标格式。')
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
      .setName('默认链接格式')
      .setDesc('决定新插入图片在笔记中的链接语法。')
      .addDropdown((dropdown) =>
        dropdown
          .addOption(LinkFormat.WIKI, 'Wiki 链接')
          .addOption(LinkFormat.MARKDOWN, 'Markdown 链接')
          .setValue(settings.defaultLinkFormat)
          .onChange(async (value) => {
            await this.updateSettings((draft) => {
              draft.defaultLinkFormat = value as LinkFormat;
            });
          })
      );

    new Setting(namingSection)
      .setName('默认路径格式')
      .setDesc('控制插入链接时优先使用最短唯一路径、相对路径或绝对路径。')
      .addDropdown((dropdown) =>
        dropdown
          .addOption(PathFormat.SHORTEST, '最短唯一路径')
          .addOption(PathFormat.RELATIVE, '相对路径')
          .addOption(PathFormat.ABSOLUTE, '绝对路径')
          .setValue(settings.defaultPathFormat)
          .onChange(async (value) => {
            await this.updateSettings((draft) => {
              draft.defaultPathFormat = value as PathFormat;
            });
          })
      );

    renameSetting = new Setting(namingSection)
      .setName('生成的图片文件名')
      .setDesc('支持变量模板。留空时回退为原始文件名；如果笔记名与日期重复，会自动去重。')
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
      '常用命名示例',
      RENAME_PATTERN_EXAMPLES,
      (value) => {
        void this.applyRenameExample(renameInput, renameSetting, renamePreviewValue, value);
      }
    );
    renamePreviewValue = this.createPreviewBlock(namingSection, '命名模板预览');
    this.updateRenameFeedback(renameSetting, renamePreviewValue, settings.renamePattern);

    this.createPresetRow(
      namingSection,
      '推荐规则组合',
      RULE_PRESETS,
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
      .setName('启用自动重命名')
      .setDesc('关闭后，图片默认保留原始文件名，仅在格式转换时更新扩展名。')
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
      .setName('笔记重命名或移动后，同步重命名图片')
      .setDesc('仅在“同步受管图片目录”开启后生效，用当前命名模板重新生成图片文件名。')
      .addToggle((toggle) =>
        toggle.setValue(settings.renameImagesOnNoteRelocate).onChange(async (value) => {
          await this.updateSettings((draft) => {
            draft.renameImagesOnNoteRelocate = value;
          });
        })
      );

    const convertSection = this.createSection(
      containerEl,
      '转换与压缩',
      '控制粘贴自动转换、压缩质量和处理后的提示行为。'
    );

    new Setting(convertSection)
      .setName('默认处理质量')
      .setDesc('用于格式转换、旋转、翻转和缩放等处理操作。')
      .addSlider((slider) =>
        slider
          .setLimits(1, 100, 1)
          .setDynamicTooltip()
          .setValue(settings.defaultQuality)
          .onChange(async (value) => {
            await this.updateSettings((draft) => {
              draft.defaultQuality = value;
            });
          })
      );

    new Setting(convertSection)
      .setName('压缩质量')
      .setDesc('数值越低，压缩越激进，文件体积通常更小。')
      .addSlider((slider) =>
        slider
          .setLimits(1, 100, 1)
          .setDynamicTooltip()
          .setValue(settings.compressionQuality)
          .onChange(async (value) => {
            await this.updateSettings((draft) => {
              draft.compressionQuality = value;
            });
          })
      );

    new Setting(convertSection)
      .setName('粘贴图片时自动转换格式')
      .setDesc('启用后，粘贴到笔记中的图片会先转换为默认图片格式，再写入仓库。')
      .addToggle((toggle) =>
        toggle.setValue(settings.enableAutoConvert).onChange(async (value) => {
          await this.updateSettings((draft) => {
            draft.enableAutoConvert = value;
          });
        })
      );

    new Setting(convertSection)
      .setName('显示操作通知')
      .setDesc('关闭后，仅保留失败类提示；成功、跳过和汇总提示不再弹出。')
      .addToggle((toggle) =>
        toggle.setValue(settings.showOperationNotifications).onChange(async (value) => {
          await this.updateSettings((draft) => {
            draft.showOperationNotifications = value;
          });
        })
      );

    new Setting(convertSection)
      .setName('压缩完成后提示节省空间')
      .setDesc('在执行压缩命令后显示压缩前后大小对比和压缩比例。')
      .addToggle((toggle) =>
        toggle.setValue(settings.showSpaceSavedNotification).onChange(async (value) => {
          await this.updateSettings((draft) => {
            draft.showSpaceSavedNotification = value;
          });
        })
      );

    const compressionIgnoreSetting = new Setting(convertSection)
      .setName('压缩忽略正则')
      .setDesc('每行一个正则；命中图片路径时跳过压缩。支持注释行 `# ...`。')
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
    this.updateRegexPatternFeedback(compressionIgnoreSetting, settings.compressionIgnorePattern);
    this.createExampleRow(convertSection, '压缩忽略示例', COMPRESSION_IGNORE_EXAMPLES, (value) => {
      void this.applySettingValue((draft) => {
        draft.compressionIgnorePattern = value;
      });
    });

    const conversionIgnoreSetting = new Setting(convertSection)
      .setName('转换忽略正则')
      .setDesc('每行一个正则；命中图片路径时跳过格式转换和粘贴自动转换。支持注释行 `# ...`。')
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
    this.updateRegexPatternFeedback(conversionIgnoreSetting, settings.conversionIgnorePattern);
    this.createExampleRow(convertSection, '转换忽略示例', CONVERSION_IGNORE_EXAMPLES, (value) => {
      void this.applySettingValue((draft) => {
        draft.conversionIgnorePattern = value;
      });
    });

    new Setting(convertSection)
      .setName('压缩阈值（KB）')
      .setDesc('低于该体积的图片会跳过压缩，避免处理极小文件。')
      .addText((text) =>
        text.setPlaceholder('100').setValue(String(settings.compressionThresholdKB)).onChange(async (value) => {
          const parsed = Number.parseInt(value, 10);
          await this.updateSettings((draft) => {
            draft.compressionThresholdKB = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
          });
        })
      );

    const editorSection = this.createSection(
      containerEl,
      '编辑器与粘贴行为',
      '控制图片链接插入后的光标位置，以及文件右键菜单中的图像操作入口。'
    );

    new Setting(editorSection)
      .setName('接管编辑器图片粘贴')
      .setDesc('启用后，插件会拦截图片粘贴流程，并优先使用本插件的保存、命名和转换规则。')
      .addToggle((toggle) =>
        toggle.setValue(settings.enablePasteHandler).onChange(async (value) => {
          await this.updateSettings((draft) => {
            draft.enablePasteHandler = value;
          });
          this.display();
        })
      );

    new Setting(editorSection)
      .setName('自动下载文本图片源')
      .setDesc('开启后，粘贴纯文本的图片 URL、`file://` 图片路径或 `data:image/...;base64,...` 时，会自动下载并插入图片链接。普通文本不会被接管。')
      .addToggle((toggle) =>
        toggle.setValue(settings.enableAutoDownloadImagesFromText).onChange(async (value) => {
          await this.updateSettings((draft) => {
            draft.enableAutoDownloadImagesFromText = value;
          });
        })
      );

    new Setting(editorSection)
      .setName('插入图片后光标位置')
      .setDesc('控制图片链接插入后，光标停留在链接前方还是后方。')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('front', '保留在插入内容前')
          .addOption('back', '移动到插入内容后')
          .setValue(settings.dropPasteCursorLocation)
          .onChange(async (value) => {
            await this.updateSettings((draft) => {
              draft.dropPasteCursorLocation = value as 'front' | 'back';
            });
          })
      );

    new Setting(editorSection)
      .setName('启用文件右键菜单操作')
      .setDesc('在文件管理器中右键图片时，显示压缩、转换、旋转、翻转等操作。')
      .addToggle((toggle) =>
        toggle.setValue(settings.enableContextMenu).onChange(async (value) => {
          await this.updateSettings((draft) => {
            draft.enableContextMenu = value;
          });
          this.display();
        })
      );

    new Setting(editorSection)
      .setName('启用图片默认对齐')
      .setDesc('为渲染后的图片统一附加默认对齐样式，不修改 Markdown 源文。')
      .addToggle((toggle) =>
        toggle.setValue(settings.enableImageAlign).onChange(async (value) => {
          await this.updateSettings((draft) => {
            draft.enableImageAlign = value;
          });
        })
      );

    new Setting(editorSection)
      .setName('默认图片对齐方式')
      .setDesc('仅在启用图片默认对齐时生效。')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('none', '不处理')
          .addOption('left', '左对齐')
          .addOption('center', '居中')
          .addOption('right', '右对齐')
          .setValue(settings.imageAlignmentDefaultAlignment)
          .onChange(async (value) => {
            await this.updateSettings((draft) => {
              draft.imageAlignmentDefaultAlignment = value as ImageManagerSettings['imageAlignmentDefaultAlignment'];
            });
          })
      );

    new Setting(editorSection)
      .setName('禁用 Obsidian 图片点击选中')
      .setDesc('启用后，预览模式下点击图片时优先阻止原生选中行为。')
      .addToggle((toggle) =>
        toggle.setValue(settings.disableObsidianImageSelectionOnClick).onChange(async (value) => {
          await this.updateSettings((draft) => {
            draft.disableObsidianImageSelectionOnClick = value;
          });
        })
      );

    const gallerySection = this.createSection(
      containerEl,
      '图片画廊',
      '控制当前笔记或当前文件夹画廊的启用状态、默认布局和排序规则。'
    );

    new Setting(gallerySection)
      .setName('启用图片画廊')
      .setDesc('控制“当前笔记画廊”和“当前文件夹画廊”命令是否可用。')
      .addToggle((toggle) =>
        toggle.setValue(settings.enableGallery).onChange(async (value) => {
          await this.updateSettings((draft) => {
            draft.enableGallery = value;
          });
        })
      );

    new Setting(gallerySection)
      .setName('画廊网格尺寸')
      .setDesc('决定画廊中每行显示的图片数量和缩略图尺寸。')
      .addDropdown((dropdown) =>
        dropdown
          .addOption(GalleryGridSize.SMALL, '小')
          .addOption(GalleryGridSize.MEDIUM, '中')
          .addOption(GalleryGridSize.LARGE, '大')
          .setValue(settings.galleryGridSize)
          .onChange(async (value) => {
            await this.updateSettings((draft) => {
              draft.galleryGridSize = value as GalleryGridSize;
            });
          })
      );

    new Setting(gallerySection)
      .setName('画廊默认排序')
      .setDesc('打开画廊时默认使用的排序规则。')
      .addDropdown((dropdown) =>
        dropdown
          .addOption(GallerySortBy.DATE, '最新优先')
          .addOption(GallerySortBy.NAME, '按名称')
          .addOption(GallerySortBy.SIZE, '大图优先')
          .setValue(settings.gallerySortBy)
          .onChange(async (value) => {
            await this.updateSettings((draft) => {
              draft.gallerySortBy = value as GallerySortBy;
            });
          })
      );

    this.renderCompatibilitySection(containerEl, settings);
    this.renderPlannedSettings(containerEl, settings);
    this.renderFeatureStatus(containerEl);
  }

  private renderHeader(containerEl: HTMLElement): void {
    const hero = containerEl.createDiv({ cls: 'image-manager-settings-hero' });
    const content = hero.createDiv({ cls: 'image-manager-settings-hero__content' });
    content.createEl('h2', { text: 'Image Manager 设置' });
    content.createEl('p', {
      text: '统一管理图片的保存、命名、转换、链接和浏览行为。设置项只展示当前版本已生效的能力，未接入功能会单独标记。'
    });

    const actionWrap = hero.createDiv({ cls: 'image-manager-settings-hero__actions' });
    new Setting(actionWrap).addButton((button) =>
      button.setButtonText('恢复默认设置').setWarning().onClick(async () => {
        await this.updateSettings((draft) => {
          Object.assign(draft, DEFAULT_SETTINGS);
        });
        new Notice('Image Manager 设置已恢复为默认值');
        this.display();
      })
    );
  }

  private createSection(containerEl: HTMLElement, title: string, description: string): HTMLElement {
    const section = containerEl.createDiv({ cls: 'image-manager-settings-section' });
    const header = section.createDiv({ cls: 'image-manager-settings-section__header' });
    header.createEl('h3', { text: title });
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
  ): void {
    const wrap = containerEl.createDiv({ cls: 'image-manager-settings-examples' });
    wrap.createEl('div', { cls: 'image-manager-settings-examples__title', text: title });
    const list = wrap.createDiv({ cls: 'image-manager-settings-examples__list' });

    for (const example of examples) {
      const button = list.createEl('button', { cls: 'image-manager-settings-chip', text: example.label });
      button.type = 'button';
      button.title = `${example.value || '(留空)'}\n${example.description}`;
      button.addEventListener('click', () => {
        onApply(example.value);
      });
    }
  }

  private createPresetRow(
    containerEl: HTMLElement,
    title: string,
    presets: readonly PresetOption[],
    onApply: (preset: PresetOption) => void
  ): void {
    const wrap = containerEl.createDiv({ cls: 'image-manager-settings-presets' });
    wrap.createEl('div', { cls: 'image-manager-settings-examples__title', text: title });
    const list = wrap.createDiv({ cls: 'image-manager-settings-presets__list' });

    for (const preset of presets) {
      const card = list.createDiv({ cls: 'image-manager-settings-preset' });
      card.createEl('strong', { text: preset.label });
      card.createEl('p', { text: preset.description });
      card.createEl('code', { text: `命名：${preset.renamePattern}` });
      card.createEl('code', { text: `目录：${preset.outputFolder || '(跟随当前笔记目录)'}` });
      const applyButton = card.createEl('button', {
        cls: 'image-manager-settings-preset__button',
        text: '应用此组合'
      });
      applyButton.type = 'button';
      applyButton.addEventListener('click', () => {
        onApply(preset);
      });
    }
  }

  private createVariableReference(containerEl: HTMLElement): void {
    const block = containerEl.createDiv({ cls: 'image-manager-settings-variables' });
    block.createEl('div', { cls: 'image-manager-settings-examples__title', text: '可用变量' });
    const list = block.createDiv({ cls: 'image-manager-settings-variables__list' });

    for (const variable of VARIABLE_DESCRIPTIONS) {
      const item = list.createDiv({ cls: 'image-manager-settings-variables__item' });
      item.createEl('code', { text: variable.token });
      item.createSpan({ text: variable.description });
    }
  }

  private updateRenameFeedback(setting: Setting, previewEl: HTMLElement, value: string): void {
    const unresolved = this.variableResolver.validatePattern(value);
    this.setSettingErrorMessage(setting, unresolved.length > 0 ? `未识别的变量：${unresolved.join('、')}` : null);

    if (!this.plugin.getSettings().enableAutoRename) {
      previewEl.setText(`${SAMPLE_FILE_NAME}.${this.plugin.getSettings().defaultFormat}`);
      return;
    }

    const sample = this.variableResolver.createContext(SAMPLE_NOTE_NAME, SAMPLE_FILE_NAME);
    const resolved = this.variableResolver.resolve(value, sample) || SAMPLE_FILE_NAME;
    const extension = this.plugin.getSettings().defaultFormat;
    previewEl.setText(`${resolved}.${extension}`);
  }

  private updateOutputFolderFeedback(setting: Setting, previewEl: HTMLElement, value: string): void {
    const unresolved = this.variableResolver.validatePattern(value);
    this.setSettingErrorMessage(setting, unresolved.length > 0 ? `未识别的变量：${unresolved.join('、')}` : null);

    if (!value.trim()) {
      previewEl.setText(getParentPath(SAMPLE_NOTE_PATH) || '(仓库根目录)');
      return;
    }

    const sample = this.variableResolver.createContext(SAMPLE_NOTE_NAME, SAMPLE_FILE_NAME);
    const resolved = this.variableResolver.resolvePath(value, sample);
    const finalPath = resolveNoteScopedPath(resolved, SAMPLE_NOTE_PATH);
    previewEl.setText(`${resolved} -> ${finalPath}`);
  }

  private renderCompatibilitySection(containerEl: HTMLElement, settings: ImageManagerSettings): void {
    const section = this.createSection(
      containerEl,
      '兼容性与冲突规避',
      '处理跨平台差异、Obsidian 原生行为以及其他附件/粘贴类插件可能带来的冲突。'
    );

    new Setting(section)
      .setName('笔记改名或移动时，同步受管图片目录')
      .setDesc('仅对可安全识别的受管目录生效。若你使用其他附件整理插件，建议关闭。')
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
        text: card.tone === 'ok' ? '兼容' : '注意'
      });
      cardEl.createEl('p', { text: card.description });
    }
  }

  private renderPlannedSettings(containerEl: HTMLElement, settings: ImageManagerSettings): void {
    const section = this.createSection(
      containerEl,
      '规划中能力',
      '以下配置字段已经在数据结构中预留，但当前版本尚未接入实际交互逻辑，因此不提供可编辑开关。这样可以避免出现“能配置但不生效”的设置项。'
    );

    const items: readonly { readonly label: string; readonly value: string; readonly description: string }[] = [
      {
        label: '拖拽调整图片尺寸',
        value: settings.enableDragResize ? 'true' : 'false',
        description: '尺寸调整命令已可用，但编辑器内拖拽交互仍未实现。'
      }
    ];

    const list = section.createDiv({ cls: 'image-manager-settings-planned' });
    for (const item of items) {
      const card = list.createDiv({ cls: 'image-manager-settings-card image-manager-settings-card--muted' });
      const top = card.createDiv({ cls: 'image-manager-settings-card__top' });
      top.createEl('strong', { text: item.label });
      top.createEl('code', { text: item.value });
      card.createEl('p', { text: item.description });
    }
  }

  private renderFeatureStatus(containerEl: HTMLElement): void {
    const section = this.createSection(
      containerEl,
      '功能状态',
      '用于区分当前版本已经可用的模块，以及仍处于预留或规划阶段的能力。'
    );

    const list = section.createDiv({ cls: 'image-manager-settings-status' });
    for (const feature of this.plugin.listFeatures()) {
      const card = list.createDiv({ cls: 'image-manager-settings-card' });
      const top = card.createDiv({ cls: 'image-manager-settings-card__top' });
      top.createEl('strong', { text: FEATURE_LABELS[feature.id] ?? feature.name });
      top.createEl('span', {
        cls: `image-manager-settings-badge image-manager-settings-badge--${feature.state}`,
        text: FEATURE_STATE_LABELS[feature.state]
      });
      card.createEl('p', { text: this.translateFeatureSummary(feature) });
    }
  }

  private translateFeatureSummary(feature: ImageManagerFeature): string {
    const summaryMap: Readonly<Record<string, string>> = {
      rename: '根据变量模板为图片命名，并在笔记移动或重命名时同步受管图片目录。',
      compress: '提供单图与批量压缩，并可提示节省的空间大小。',
      convert: '支持将图片转换为默认格式或指定格式。',
      preview: '提供图片预览入口和相关浏览能力。',
      editor: '提供快速旋转和水平翻转等轻量编辑命令。',
      gallery: '提供当前笔记和当前文件夹的图片画廊视图。',
      batch: '支持按笔记、文件夹或整个仓库执行批量任务。',
      resize: '支持将图片缩放到指定边界尺寸。',
      align: '支持为渲染后的图片附加默认对齐样式，并配合预览行为一起生效。',
      'context-menu': '为文件管理器中的图片提供右键快捷操作。'
    };
    return summaryMap[feature.id] ?? feature.summary;
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
    const supportedFormats = getSupportedCanvasOutputFormats().map((format) => format.toUpperCase());
    const attachmentFolder = getAttachmentFolderSetting(this.app);
    const debugModeEnabled = detectObsidianDebugMode(this.app);
    const cards: CompatibilityCard[] = [
      {
        title: '当前平台',
        tone: 'ok',
        description: `当前运行环境：${describeCurrentPlatform()}。右键复制图片到剪贴板${canWriteImageToClipboard() ? '可用' : '不可用'}。`
      },
      {
        title: '调试日志模式',
        tone: debugModeEnabled ? 'warning' : 'ok',
        description: debugModeEnabled
          ? '检测到 Obsidian 调试模式已开启。插件会输出详细诊断日志，便于定位问题。'
          : 'Obsidian 调试模式当前关闭。插件不会启用额外详细日志，也不会为日志做轮询或常驻监听。'
      },
      {
        title: '可编码输出格式',
        tone: supportedFormats.length >= 2 ? 'ok' : 'warning',
        description:
          supportedFormats.length > 0
            ? `当前环境可稳定输出：${supportedFormats.join('、')}。GIF、HEIC、TIFF 等格式不保证可直接重新编码。`
            : '当前环境未检测到可稳定输出的目标格式，建议只关闭自动转换并保留原图。'
      }
    ];

    if (settings.enablePasteHandler) {
      cards.push({
        title: '粘贴接管冲突',
        tone: 'warning',
        description:
          '已启用本插件的粘贴接管。它会优先处理图片粘贴，可能覆盖 Obsidian 原生附件保存规则，也可能与其他粘贴增强插件重复处理。'
      });
    } else {
      cards.push({
        title: '粘贴接管冲突',
        tone: 'ok',
        description: '已关闭本插件的粘贴接管。图片粘贴将交给 Obsidian 原生流程或其他插件处理。'
      });
    }

    if (settings.enablePasteHandler && attachmentFolder) {
      cards.push({
        title: 'Obsidian 原生附件目录',
        tone: 'warning',
        description: `检测到 Obsidian 原生附件目录设置为“${attachmentFolder}”。启用本插件粘贴接管时，将优先使用本插件的输出目录规则。`
      });
    }

    if (settings.enableNoteRenameSync && !isRelocatableOutputFolderTemplate(settings.outputFolder)) {
      cards.push({
        title: '笔记改名同步范围',
        tone: 'warning',
        description:
          '当前输出目录规则不是可安全迁移的受管目录模板。为避免误搬移外部附件，插件会跳过自动同步图片目录。'
      });
    } else if (settings.enableNoteRenameSync) {
      cards.push({
        title: '笔记改名同步范围',
        tone: 'ok',
        description: '当前输出目录规则可安全识别为受管目录，笔记改名或移动时会同步图片目录。'
      });
    } else {
      cards.push({
        title: '笔记改名同步范围',
        tone: 'ok',
        description: '已关闭笔记改名同步，可避免与附件整理或链接重写类插件互相干预。'
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
    this.setSettingErrorMessage(setting, invalid.length > 0 ? `无效正则：${invalid.join('、')}` : null);
  }

  private async applySettingValue(mutator: (draft: ImageManagerSettings) => void): Promise<void> {
    await this.updateSettings(mutator);
    this.display();
  }
}
