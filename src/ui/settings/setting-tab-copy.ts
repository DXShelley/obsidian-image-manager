import type { UiLanguage } from '@/types/index';

export interface ExampleOption {
  readonly label: string;
  readonly value: string;
  readonly description: string;
}

export interface PresetOption {
  readonly label: string;
  readonly description: string;
  readonly renamePattern: string;
  readonly outputFolder: string;
}

interface CopyBundle {
  readonly languageLabel: string;
  readonly languageDescription: string;
  readonly languageOptions: Readonly<Record<UiLanguage, string>>;
  readonly header: {
    readonly title: string;
    readonly subtitle: string;
    readonly reset: string;
    readonly resetNotice: string;
  };
  readonly sections: {
    readonly naming: { readonly title: string; readonly description: string };
    readonly convert: { readonly title: string; readonly description: string };
    readonly editor: { readonly title: string; readonly description: string };
    readonly gallery: { readonly title: string; readonly description: string };
    readonly compatibility: { readonly title: string; readonly description: string };
    readonly featureStatus: { readonly title: string; readonly description: string };
  };
  readonly samples: {
    readonly noteName: string;
    readonly fileName: string;
    readonly notePath: string;
    readonly vaultRoot: string;
  };
  readonly previews: {
    readonly outputFolder: string;
    readonly renamePattern: string;
  };
  readonly exampleTitles: {
    readonly outputFolder: string;
    readonly renamePattern: string;
    readonly compressionIgnore: string;
    readonly conversionIgnore: string;
    readonly presets: string;
    readonly variables: string;
  };
  readonly settings: {
    readonly outputFolderName: string;
    readonly outputFolderDesc: string;
    readonly defaultFormatName: string;
    readonly defaultFormatDesc: string;
    readonly defaultLinkFormatName: string;
    readonly defaultLinkFormatDesc: string;
    readonly defaultPathFormatName: string;
    readonly defaultPathFormatDesc: string;
    readonly markdownPathName: string;
    readonly markdownPathDesc: string;
    readonly renamePatternName: string;
    readonly renamePatternDesc: string;
    readonly enableAutoRenameName: string;
    readonly enableAutoRenameDesc: string;
    readonly renameImagesOnRelocateName: string;
    readonly renameImagesOnRelocateDesc: string;
    readonly deleteEmptyFoldersName: string;
    readonly deleteEmptyFoldersDesc: string;
    readonly deleteOrphanImagesName: string;
    readonly deleteOrphanImagesDesc: string;
    readonly defaultQualityName: string;
    readonly defaultQualityDesc: string;
    readonly compressionQualityName: string;
    readonly compressionQualityDesc: string;
    readonly enableAutoConvertName: string;
    readonly enableAutoConvertDesc: string;
    readonly showOperationNotificationsName: string;
    readonly showOperationNotificationsDesc: string;
    readonly showSpaceSavedNotificationName: string;
    readonly showSpaceSavedNotificationDesc: string;
    readonly compressionIgnorePatternName: string;
    readonly compressionIgnorePatternDesc: string;
    readonly conversionIgnorePatternName: string;
    readonly conversionIgnorePatternDesc: string;
    readonly compressionThresholdKBName: string;
    readonly compressionThresholdKBDesc: string;
    readonly enablePasteHandlerName: string;
    readonly enablePasteHandlerDesc: string;
    readonly enableAutoDownloadImagesFromTextName: string;
    readonly enableAutoDownloadImagesFromTextDesc: string;
    readonly dropPasteCursorLocationName: string;
    readonly dropPasteCursorLocationDesc: string;
    readonly enableContextMenuName: string;
    readonly enableContextMenuDesc: string;
    readonly enableImageAlignName: string;
    readonly enableImageAlignDesc: string;
    readonly imageAlignmentDefaultName: string;
    readonly imageAlignmentDefaultDesc: string;
    readonly disableImageSelectionName: string;
    readonly disableImageSelectionDesc: string;
    readonly enableGalleryName: string;
    readonly enableGalleryDesc: string;
    readonly galleryGridSizeName: string;
    readonly galleryGridSizeDesc: string;
    readonly gallerySortByName: string;
    readonly gallerySortByDesc: string;
    readonly enableNoteRenameSyncName: string;
    readonly enableNoteRenameSyncDesc: string;
  };
  readonly buttons: {
    readonly applyPreset: string;
  };
  readonly labels: {
    readonly outputFolderFallback: string;
    readonly invalidVariables: string;
    readonly invalidRegex: string;
    readonly compatibilityOk: string;
    readonly compatibilityWarning: string;
  };
  readonly options: {
    readonly linkFormat: { readonly wiki: string; readonly markdown: string };
    readonly pathFormat: { readonly shortest: string; readonly relative: string; readonly absolute: string };
    readonly markdownPathEncodingStrategy: { readonly encoded: string; readonly readable: string; readonly auto: string };
    readonly dropPasteCursorLocation: { readonly front: string; readonly back: string };
    readonly imageAlignment: { readonly none: string; readonly left: string; readonly center: string; readonly right: string };
    readonly galleryGridSize: { readonly small: string; readonly medium: string; readonly large: string };
    readonly gallerySortBy: { readonly date: string; readonly name: string; readonly size: string };
  };
  readonly variableDescriptions: readonly { readonly token: string; readonly description: string }[];
  readonly renameExamples: readonly ExampleOption[];
  readonly outputFolderExamples: readonly ExampleOption[];
  readonly compressionIgnoreExamples: readonly ExampleOption[];
  readonly conversionIgnoreExamples: readonly ExampleOption[];
  readonly rulePresets: readonly PresetOption[];
  readonly featureLabels: Readonly<Record<string, string>>;
  readonly featureStates: Readonly<Record<'implemented' | 'scaffolded', string>>;
  readonly featureSummaries: Readonly<Record<string, string>>;
  readonly compatibility: {
    readonly platformTitle: string;
    readonly platformDescription: (platform: string, canWriteClipboard: boolean) => string;
    readonly debugTitle: string;
    readonly debugEnabled: string;
    readonly debugDisabled: string;
    readonly formatsTitle: string;
    readonly formatsAvailable: (formats: string[]) => string;
    readonly formatsUnavailable: string;
    readonly pasteConflictTitle: string;
    readonly pasteConflictEnabled: string;
    readonly pasteConflictDisabled: string;
    readonly nativeAttachmentTitle: string;
    readonly nativeAttachmentDescription: (folder: string) => string;
    readonly pluginConflictTitle: (featureLabel: string) => string;
    readonly pluginConflictDescription: (pluginName: string, pluginId: string, description: string) => string;
    readonly renameSyncTitle: string;
    readonly renameSyncUnsafe: string;
    readonly renameSyncSafe: string;
    readonly renameSyncDisabled: string;
    readonly conflictFeatureLabels: Record<'paste-handler' | 'note-rename-sync', string>;
  };
}

const ZH: CopyBundle = {
  languageLabel: '界面语言',
  languageDescription: '切换设置页与功能状态的显示语言。默认中文。',
  languageOptions: {
    'zh-CN': '简体中文',
    en: 'English'
  },
  header: {
    title: 'Image Manager 设置',
    subtitle: '在 Obsidian 里把图片处理做到够用、顺手、可恢复，不为过度设计增加维护熵。',
    reset: '恢复默认设置',
    resetNotice: 'Image Manager 设置已恢复为默认值'
  },
  sections: {
    naming: {
      title: '保存与命名',
      description: '先定保存位置，再定文件名规则；这两项决定图片最终如何落盘。'
    },
    convert: {
      title: '转换与压缩',
      description: '控制默认输出质量、自动转换与压缩策略。'
    },
    editor: {
      title: '粘贴与编辑',
      description: '控制粘贴接管、右键编辑和图片交互行为。'
    },
    gallery: {
      title: '图片画廊',
      description: '控制画廊入口、默认布局和排序规则。'
    },
    compatibility: {
      title: '兼容性与冲突规避',
      description: '检查平台限制、原生附件规则和常见插件冲突。'
    },
    featureStatus: {
      title: '功能状态',
      description: '区分当前已可用能力与后续规划能力。'
    }
  },
  samples: {
    noteName: '项目周报',
    fileName: '页面截图',
    notePath: 'Projects/项目周报.md',
    vaultRoot: '(仓库根目录)'
  },
  previews: {
    outputFolder: '实际保存位置预览',
    renamePattern: '命名模板预览'
  },
  exampleTitles: {
    outputFolder: '常用保存位置',
    renamePattern: '常用命名规则',
    compressionIgnore: '压缩忽略示例',
    conversionIgnore: '转换忽略示例',
    presets: '推荐组合',
    variables: '可用变量'
  },
  settings: {
    outputFolderName: '图片保存位置',
    outputFolderDesc: '支持相对路径和变量模板。留空时保存到当前笔记目录。',
    defaultFormatName: '默认图片格式',
    defaultFormatDesc: '用于自动转换和手动转换的目标格式。',
    defaultLinkFormatName: '默认链接格式',
    defaultLinkFormatDesc: '决定新插入图片使用哪种链接语法。',
    defaultPathFormatName: '默认路径格式',
    defaultPathFormatDesc: '决定插入链接时优先使用哪种路径。',
    markdownPathName: 'Markdown 路径输出策略',
    markdownPathDesc: '仅对 Markdown 图片链接生效。',
    renamePatternName: '生成的图片文件名',
    renamePatternDesc: '支持变量模板。留空时回退为原文件名。',
    enableAutoRenameName: '启用自动重命名',
    enableAutoRenameDesc: '关闭后保留原文件名，仅在转换时更新扩展名。',
    renameImagesOnRelocateName: '笔记改名后同步重命名图片',
    renameImagesOnRelocateDesc: '仅在受管目录同步开启时生效。',
    deleteEmptyFoldersName: '删除空图片文件夹',
    deleteEmptyFoldersDesc: '只清理图片附件目录中因迁移或删除而留下的空目录。',
    deleteOrphanImagesName: '删除孤立图片',
    deleteOrphanImagesDesc: '执行“更新图片链接与目录”时，顺带清理当前范围内未被引用的图片。',
    defaultQualityName: '默认处理质量',
    defaultQualityDesc: '用于转换、旋转、翻转和缩放。',
    compressionQualityName: '压缩质量',
    compressionQualityDesc: '越低越省空间，画质损失也越明显。',
    enableAutoConvertName: '粘贴图片时自动转换格式',
    enableAutoConvertDesc: '启用后，粘贴图片会先转为默认格式再保存。',
    showOperationNotificationsName: '显示操作通知',
    showOperationNotificationsDesc: '关闭后，仅保留失败提示。',
    showSpaceSavedNotificationName: '压缩后提示节省空间',
    showSpaceSavedNotificationDesc: '显示压缩前后大小和比例。',
    compressionIgnorePatternName: '压缩忽略正则',
    compressionIgnorePatternDesc: '每行一个正则；命中路径时跳过压缩。支持 `#` 注释。',
    conversionIgnorePatternName: '转换忽略正则',
    conversionIgnorePatternDesc: '每行一个正则；命中路径时跳过转换。支持 `#` 注释。',
    compressionThresholdKBName: '压缩阈值（KB）',
    compressionThresholdKBDesc: '低于该体积的图片跳过压缩。',
    enablePasteHandlerName: '接管编辑器图片粘贴',
    enablePasteHandlerDesc: '启用后，插件会接管图片粘贴并使用本插件规则保存。',
    enableAutoDownloadImagesFromTextName: '自动下载文本图片源',
    enableAutoDownloadImagesFromTextDesc: '粘贴图片 URL、`file://` 或 `data:image` 时自动下载并插入。',
    dropPasteCursorLocationName: '插入图片后光标位置',
    dropPasteCursorLocationDesc: '控制图片链接插入后，光标停在前面还是后面。',
    enableContextMenuName: '启用文件右键菜单操作',
    enableContextMenuDesc: '显示复制、画廊、压缩、转换、裁剪、旋转和翻转等图片操作。',
    enableImageAlignName: '启用图片默认对齐',
    enableImageAlignDesc: '为渲染后的图片附加默认对齐样式，不修改 Markdown 源文。',
    imageAlignmentDefaultName: '默认图片对齐方式',
    imageAlignmentDefaultDesc: '仅在启用图片默认对齐时生效。',
    disableImageSelectionName: '禁用 Obsidian 图片点击选中',
    disableImageSelectionDesc: '启用后，预览模式下优先阻止原生点击选中。',
    enableGalleryName: '启用图片画廊',
    enableGalleryDesc: '控制画廊命令、右键入口和阅读视图双击入口。',
    galleryGridSizeName: '画廊网格尺寸',
    galleryGridSizeDesc: '决定每行显示数量和缩略图大小。',
    gallerySortByName: '画廊默认排序',
    gallerySortByDesc: '打开画廊时默认采用的排序方式。',
    enableNoteRenameSyncName: '笔记改名或移动时同步受管图片目录',
    enableNoteRenameSyncDesc: '仅对可安全识别的受管目录生效。'
  },
  buttons: {
    applyPreset: '应用此组合'
  },
  labels: {
    outputFolderFallback: '(跟随当前笔记目录)',
    invalidVariables: '未识别的变量：',
    invalidRegex: '无效正则：',
    compatibilityOk: '兼容',
    compatibilityWarning: '注意'
  },
  options: {
    linkFormat: { wiki: 'Wiki 链接', markdown: 'Markdown 链接' },
    pathFormat: { shortest: '最短唯一路径', relative: '相对路径', absolute: '绝对路径' },
    markdownPathEncodingStrategy: { encoded: '强制编码', readable: '中文可读', auto: '自动' },
    dropPasteCursorLocation: { front: '停在前面', back: '移到后面' },
    imageAlignment: { none: '不处理', left: '左对齐', center: '居中', right: '右对齐' },
    galleryGridSize: { small: '小', medium: '中', large: '大' },
    gallerySortBy: { date: '最新优先', name: '按名称', size: '大图优先' }
  },
  variableDescriptions: [
    { token: '{noteName}', description: '当前笔记名（不含扩展名）' },
    { token: '{noteFileName}', description: '与 {noteName} 等价，适合目录模板' },
    { token: '{fileName}', description: '原始图片文件名（不含扩展名）' },
    { token: '{date}', description: '当前日期，格式为 YYYY-MM-DD' },
    { token: '{time}', description: '当前时间，格式为 HH-MM-SS' },
    { token: '{random}', description: '随机后缀，避免重名' }
  ],
  renameExamples: [
    { label: '笔记名 + 日期', value: '{noteName}-{date}', description: '适合按笔记沉淀图片。' },
    { label: '笔记名 + 时间', value: '{noteName}-{date}-{time}', description: '适合连续粘贴截图。' },
    { label: '沿用原图名', value: '{fileName}', description: '保留原始命名。' },
    { label: '笔记名 + 随机串', value: '{noteName}-{random}', description: '避免同日重名。' }
  ],
  outputFolderExamples: [
    { label: '跟随当前笔记', value: '', description: '保存到当前笔记同目录。' },
    { label: '固定附件目录', value: 'Attachments/Images', description: '统一管理全库图片。' },
    { label: '笔记同级 assets', value: './assets', description: '在笔记目录下创建附件文件夹。' },
    { label: '按笔记名分目录', value: './assets/${noteFileName}', description: '每篇笔记一份独立目录。' }
  ],
  compressionIgnoreExamples: [
    { label: '忽略原始目录', value: '^assets/raw/', description: '跳过原始素材目录。' },
    { label: '忽略 GIF', value: '\\.gif$', description: '保留动图原样。' }
  ],
  conversionIgnoreExamples: [
    { label: '忽略截图目录', value: '^Screenshots/', description: '跳过指定目录。' },
    { label: '忽略 PNG', value: '\\.png$', description: '保留 PNG 原格式。' }
  ],
  rulePresets: [
    { label: '日常截图', description: '按笔记分目录保存截图。', renamePattern: '{noteName}-{date}-{time}', outputFolder: './assets/${noteFileName}' },
    { label: '统一图库', description: '跨笔记复用图片时更省心。', renamePattern: '{date}-{time}-{random}', outputFolder: 'Attachments/Images' },
    { label: '保留原始命名', description: '适合整理外部下载图片。', renamePattern: '{fileName}', outputFolder: './assets' }
  ],
  featureLabels: {
    rename: '自动命名与迁移',
    compress: '图片压缩',
    convert: '格式转换',
    preview: '图片预览',
    editor: '快速编辑',
    gallery: '图片画廊',
    batch: '批量处理',
    recovery: '恢复事务',
    resize: '尺寸调整',
    'drag-resize': '拖拽调整尺寸',
    'watermark-removal': '去水印',
    align: '图片对齐',
    'context-menu': '右键菜单'
  },
  featureStates: { implemented: '已启用', scaffolded: '规划中' },
  featureSummaries: {
    rename: '按变量命名图片，并在笔记改名或移动时同步受管目录。',
    compress: '支持单图和批量压缩，并记录压缩历史避免重复处理。',
    convert: '支持默认格式转换，并处理重名目标文件。',
    preview: '为预览图提供标记和刷新钩子，方便画廊与样式接入。',
    editor: '提供旋转、翻转等轻量编辑能力；裁剪入口放在右键菜单中。',
    gallery: '提供当前图片、当前笔记和当前文件夹的画廊视图。',
    batch: '支持按笔记、文件夹或整库执行批量任务。',
    recovery: '为图片和 Markdown 修改记录事务，支持撤销与重做。',
    resize: '支持将图片缩放到安全的边界尺寸。',
    'drag-resize': '后续会补上编辑器内直接拖拽调整图片显示尺寸的交互。',
    'watermark-removal': '规划中的局部修复能力，待效果和交互达标后再恢复。',
    align: '为渲染后的图片附加默认对齐样式。',
    'context-menu': '为图片文件提供复制、画廊、压缩、转换、裁剪和轻量编辑入口。'
  },
  compatibility: {
    platformTitle: '当前平台',
    platformDescription: (platform, canWriteClipboard) =>
      `当前运行环境：${platform}。右键复制图片到剪贴板${canWriteClipboard ? '可用' : '不可用'}。`,
    debugTitle: '调试日志模式',
    debugEnabled: '检测到 Obsidian 调试模式已开启。插件会输出更详细的诊断日志。',
    debugDisabled: 'Obsidian 调试模式当前关闭，插件不会额外输出详细日志。',
    formatsTitle: '可编码输出格式',
    formatsAvailable: (formats) => `当前环境可稳定输出：${formats.join('、')}。GIF、HEIC、TIFF 不保证可直接重新编码。`,
    formatsUnavailable: '当前环境未检测到稳定的可编码格式，建议关闭自动转换并保留原图。',
    pasteConflictTitle: '粘贴接管冲突',
    pasteConflictEnabled: '已启用本插件的粘贴接管，可能与其他粘贴或附件插件重复处理同一张图片。',
    pasteConflictDisabled: '已关闭本插件的粘贴接管，图片粘贴将交给 Obsidian 原生流程或其他插件处理。',
    nativeAttachmentTitle: 'Obsidian 原生附件目录',
    nativeAttachmentDescription: (folder) => `检测到 Obsidian 原生附件目录为“${folder}”。启用本插件粘贴接管时，将优先使用本插件的输出规则。`,
    pluginConflictTitle: (featureLabel) => `${featureLabel} 与插件冲突`,
    pluginConflictDescription: (pluginName, pluginId, description) => `检测到已启用插件“${pluginName}”（${pluginId}）。${description}`,
    renameSyncTitle: '笔记改名同步范围',
    renameSyncUnsafe: '当前输出目录规则不属于可安全迁移的受管模板，插件会跳过自动同步目录。',
    renameSyncSafe: '当前输出目录规则可安全识别为受管目录，笔记改名或移动时会同步图片目录。',
    renameSyncDisabled: '已关闭笔记改名同步，可减少与附件整理类插件互相干预。',
    conflictFeatureLabels: {
      'paste-handler': '粘贴接管',
      'note-rename-sync': '笔记改名同步'
    }
  }
};

const EN: CopyBundle = {
  languageLabel: 'Interface Language',
  languageDescription: 'Switch the settings page and feature-status panel language. Default: Chinese.',
  languageOptions: {
    'zh-CN': '简体中文',
    en: 'English'
  },
  header: {
    title: 'Image Manager Settings',
    subtitle: 'Keep image workflows practical, pleasant, and recoverable in Obsidian without adding design entropy.',
    reset: 'Reset To Defaults',
    resetNotice: 'Image Manager settings were reset to defaults'
  },
  sections: {
    naming: {
      title: 'Storage And Naming',
      description: 'Choose where images go first, then decide how they are named.'
    },
    convert: {
      title: 'Convert And Compress',
      description: 'Control default output quality, auto-convert behavior, and compression rules.'
    },
    editor: {
      title: 'Paste And Editing',
      description: 'Control paste takeover, context-menu editing, and image interaction behavior.'
    },
    gallery: {
      title: 'Gallery',
      description: 'Control gallery entry points, default layout, and sort order.'
    },
    compatibility: {
      title: 'Compatibility',
      description: 'Review platform limits, native attachment rules, and likely plugin conflicts.'
    },
    featureStatus: {
      title: 'Feature Status',
      description: 'See what is shipped now and what is still planned.'
    }
  },
  samples: {
    noteName: 'weekly-notes',
    fileName: 'page-capture',
    notePath: 'Projects/weekly-notes.md',
    vaultRoot: '(vault root)'
  },
  previews: {
    outputFolder: 'Resolved save path',
    renamePattern: 'Filename preview'
  },
  exampleTitles: {
    outputFolder: 'Common save paths',
    renamePattern: 'Common naming rules',
    compressionIgnore: 'Compression ignore examples',
    conversionIgnore: 'Conversion ignore examples',
    presets: 'Recommended presets',
    variables: 'Available variables'
  },
  settings: {
    outputFolderName: 'Image save path',
    outputFolderDesc: 'Supports relative paths and variables. Leave empty to save beside the current note.',
    defaultFormatName: 'Default image format',
    defaultFormatDesc: 'Used by auto-convert and manual convert actions.',
    defaultLinkFormatName: 'Default link format',
    defaultLinkFormatDesc: 'Choose which syntax new image links use.',
    defaultPathFormatName: 'Default path format',
    defaultPathFormatDesc: 'Choose which path style is preferred when inserting links.',
    markdownPathName: 'Markdown path strategy',
    markdownPathDesc: 'Applies only to Markdown image links.',
    renamePatternName: 'Generated image filename',
    renamePatternDesc: 'Supports variables. Leave empty to fall back to the original file name.',
    enableAutoRenameName: 'Enable auto rename',
    enableAutoRenameDesc: 'When off, the original filename is kept unless format conversion changes the extension.',
    renameImagesOnRelocateName: 'Rename images when notes move or rename',
    renameImagesOnRelocateDesc: 'Applies only when managed-folder sync is enabled.',
    deleteEmptyFoldersName: 'Delete empty image folders',
    deleteEmptyFoldersDesc: 'Only removes empty folders left behind inside managed image directories.',
    deleteOrphanImagesName: 'Delete orphan images',
    deleteOrphanImagesDesc: 'Also removes unreferenced images in scope when running link and directory updates.',
    defaultQualityName: 'Default processing quality',
    defaultQualityDesc: 'Used by convert, rotate, flip, and resize operations.',
    compressionQualityName: 'Compression quality',
    compressionQualityDesc: 'Lower values save more space but degrade quality faster.',
    enableAutoConvertName: 'Auto-convert pasted images',
    enableAutoConvertDesc: 'Convert pasted images into the default format before saving them.',
    showOperationNotificationsName: 'Show operation notices',
    showOperationNotificationsDesc: 'When off, only failure notices remain.',
    showSpaceSavedNotificationName: 'Show saved space after compression',
    showSpaceSavedNotificationDesc: 'Show before/after size and ratio after compression.',
    compressionIgnorePatternName: 'Compression ignore regex',
    compressionIgnorePatternDesc: 'One regex per line. Skip compression when a path matches. `#` comments are allowed.',
    conversionIgnorePatternName: 'Conversion ignore regex',
    conversionIgnorePatternDesc: 'One regex per line. Skip conversion when a path matches. `#` comments are allowed.',
    compressionThresholdKBName: 'Compression threshold (KB)',
    compressionThresholdKBDesc: 'Skip compression for images below this size.',
    enablePasteHandlerName: 'Take over editor image paste',
    enablePasteHandlerDesc: 'When enabled, the plugin handles image paste and saves files with its own rules.',
    enableAutoDownloadImagesFromTextName: 'Auto-download text image sources',
    enableAutoDownloadImagesFromTextDesc: 'Automatically fetch pasted image URLs, `file://` paths, or `data:image` payloads.',
    dropPasteCursorLocationName: 'Cursor position after insert',
    dropPasteCursorLocationDesc: 'Choose whether the cursor stays before or moves after the inserted image link.',
    enableContextMenuName: 'Enable file context-menu actions',
    enableContextMenuDesc: 'Show copy, gallery, compress, convert, crop, rotate, and flip actions for image files.',
    enableImageAlignName: 'Enable default image alignment',
    enableImageAlignDesc: 'Apply default alignment styles to rendered images without changing Markdown source.',
    imageAlignmentDefaultName: 'Default image alignment',
    imageAlignmentDefaultDesc: 'Applies only when default image alignment is enabled.',
    disableImageSelectionName: 'Disable Obsidian image click selection',
    disableImageSelectionDesc: 'Prefer blocking native click-to-select in reading view.',
    enableGalleryName: 'Enable image gallery',
    enableGalleryDesc: 'Controls gallery commands, context-menu entry, and reading-view double-click entry.',
    galleryGridSizeName: 'Gallery grid size',
    galleryGridSizeDesc: 'Controls thumbnails per row and their size.',
    gallerySortByName: 'Default gallery sort',
    gallerySortByDesc: 'Choose the default sort order when the gallery opens.',
    enableNoteRenameSyncName: 'Sync managed image folders when notes move or rename',
    enableNoteRenameSyncDesc: 'Applies only to managed folders that can be recognized safely.'
  },
  buttons: {
    applyPreset: 'Apply preset'
  },
  labels: {
    outputFolderFallback: '(same folder as the current note)',
    invalidVariables: 'Unknown variables: ',
    invalidRegex: 'Invalid regex: ',
    compatibilityOk: 'OK',
    compatibilityWarning: 'Review'
  },
  options: {
    linkFormat: { wiki: 'Wiki link', markdown: 'Markdown link' },
    pathFormat: { shortest: 'Shortest unique path', relative: 'Relative path', absolute: 'Absolute path' },
    markdownPathEncodingStrategy: { encoded: 'Always encode', readable: 'Readable path', auto: 'Automatic' },
    dropPasteCursorLocation: { front: 'Stay before', back: 'Move after' },
    imageAlignment: { none: 'Do nothing', left: 'Left', center: 'Center', right: 'Right' },
    galleryGridSize: { small: 'Small', medium: 'Medium', large: 'Large' },
    gallerySortBy: { date: 'Newest first', name: 'By name', size: 'Largest first' }
  },
  variableDescriptions: [
    { token: '{noteName}', description: 'Current note name without extension' },
    { token: '{noteFileName}', description: 'Alias of {noteName}; useful in folder templates' },
    { token: '{fileName}', description: 'Original image filename without extension' },
    { token: '{date}', description: 'Current date in YYYY-MM-DD' },
    { token: '{time}', description: 'Current time in HH-MM-SS' },
    { token: '{random}', description: 'Random suffix to avoid collisions' }
  ],
  renameExamples: [
    { label: 'Note + date', value: '{noteName}-{date}', description: 'Good when each note owns its images.' },
    { label: 'Note + time', value: '{noteName}-{date}-{time}', description: 'Good for frequent screenshots.' },
    { label: 'Keep original name', value: '{fileName}', description: 'Preserve the incoming filename.' },
    { label: 'Note + random', value: '{noteName}-{random}', description: 'Avoid same-day collisions.' }
  ],
  outputFolderExamples: [
    { label: 'Follow current note', value: '', description: 'Save beside the current note.' },
    { label: 'Fixed attachment folder', value: 'Attachments/Images', description: 'Centralize images for the whole vault.' },
    { label: 'Sibling assets folder', value: './assets', description: 'Create one shared folder beside the note.' },
    { label: 'Folder per note', value: './assets/${noteFileName}', description: 'Give each note its own image folder.' }
  ],
  compressionIgnoreExamples: [
    { label: 'Ignore raw folder', value: '^assets/raw/', description: 'Skip original source assets.' },
    { label: 'Ignore GIF', value: '\\.gif$', description: 'Keep animated GIFs unchanged.' }
  ],
  conversionIgnoreExamples: [
    { label: 'Ignore screenshots folder', value: '^Screenshots/', description: 'Skip a specific directory.' },
    { label: 'Ignore PNG', value: '\\.png$', description: 'Keep PNG files as PNG.' }
  ],
  rulePresets: [
    { label: 'Daily screenshots', description: 'Store screenshots per note with stable timestamps.', renamePattern: '{noteName}-{date}-{time}', outputFolder: './assets/${noteFileName}' },
    { label: 'Shared library', description: 'Better when images are reused across notes.', renamePattern: '{date}-{time}-{random}', outputFolder: 'Attachments/Images' },
    { label: 'Keep source names', description: 'Useful for downloaded or imported images.', renamePattern: '{fileName}', outputFolder: './assets' }
  ],
  featureLabels: {
    rename: 'Auto naming and relocation',
    compress: 'Compression',
    convert: 'Format conversion',
    preview: 'Preview hooks',
    editor: 'Quick editing',
    gallery: 'Image gallery',
    batch: 'Batch processing',
    recovery: 'Recovery transactions',
    resize: 'Resize',
    'drag-resize': 'Drag resize',
    'watermark-removal': 'Watermark removal',
    align: 'Image alignment',
    'context-menu': 'Context menu'
  },
  featureStates: { implemented: 'Shipped', scaffolded: 'Planned' },
  featureSummaries: {
    rename: 'Name images from variables and keep managed folders in sync when notes move or rename.',
    compress: 'Compress single images or batches and avoid rerunning the same file version.',
    convert: 'Convert images into the preferred format while handling filename collisions safely.',
    preview: 'Provide preview and refresh hooks for rendered images and gallery integrations.',
    editor: 'Provide lightweight rotate and flip actions, with crop exposed from the context menu.',
    gallery: 'Open current-image, note-level, and folder-level galleries with useful browsing tools.',
    batch: 'Run scoped tasks across a note, folder, or the whole vault.',
    recovery: 'Persist transactions for image and Markdown changes so undo and redo stay reliable.',
    resize: 'Resize images to a safe boundary preset for large assets.',
    'drag-resize': 'Direct drag-to-resize inside the editor is still planned.',
    'watermark-removal': 'Planned object-removal tooling will only return after quality and interaction reach a practical bar.',
    align: 'Apply configurable default alignment styles to rendered note images.',
    'context-menu': 'Expose copy, gallery, compress, convert, crop, and lightweight edit actions from the file menu.'
  },
  compatibility: {
    platformTitle: 'Current platform',
    platformDescription: (platform, canWriteClipboard) =>
      `Current runtime: ${platform}. Copy image to clipboard from the file menu is ${canWriteClipboard ? 'available' : 'unavailable'}.`,
    debugTitle: 'Debug logging mode',
    debugEnabled: 'Obsidian debug mode is enabled. The plugin will emit more detailed diagnostic logs.',
    debugDisabled: 'Obsidian debug mode is off. The plugin will not emit extra verbose logs.',
    formatsTitle: 'Encodable output formats',
    formatsAvailable: (formats) => `This environment can encode: ${formats.join(', ')}. GIF, HEIC, and TIFF are not guaranteed to round-trip safely.`,
    formatsUnavailable: 'No stable output format was detected in this environment. Consider disabling auto-convert and keeping originals.',
    pasteConflictTitle: 'Paste takeover conflicts',
    pasteConflictEnabled: 'Paste takeover is enabled and may overlap with other paste or attachment plugins.',
    pasteConflictDisabled: 'Paste takeover is disabled, so image paste is handled by Obsidian or another plugin.',
    nativeAttachmentTitle: 'Native attachment folder',
    nativeAttachmentDescription: (folder) => `Obsidian currently uses “${folder}” as its native attachment folder. When paste takeover is enabled, Image Manager rules take priority.`,
    pluginConflictTitle: (featureLabel) => `${featureLabel} conflict`,
    pluginConflictDescription: (pluginName, pluginId, description) => `Detected enabled plugin "${pluginName}" (${pluginId}). ${description}`,
    renameSyncTitle: 'Rename-sync scope',
    renameSyncUnsafe: 'The current output-folder rule is not a safely relocatable managed template, so auto-sync is skipped.',
    renameSyncSafe: 'The current output-folder rule is a safely managed template, so note rename or move will sync image folders.',
    renameSyncDisabled: 'Note rename sync is disabled, which reduces interference with attachment-management plugins.',
    conflictFeatureLabels: {
      'paste-handler': 'Paste takeover',
      'note-rename-sync': 'Note rename sync'
    }
  }
};

export function getSettingTabCopy(language: UiLanguage): CopyBundle {
  return language === 'en' ? EN : ZH;
}
