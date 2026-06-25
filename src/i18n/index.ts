import { DEFAULT_UI_LANGUAGE, getUiLanguageOptions, resolveUiLanguage, type UiLanguage } from './language';

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

export type CommandScopeLabelKey = 'FILE' | 'FOLDER' | 'VAULT';

export interface CommandScopeCopy {
  readonly displayLabels: Readonly<Record<CommandScopeLabelKey, string>>;
  readonly aliases: Readonly<Record<CommandScopeLabelKey, readonly string[]>>;
}

export interface SettingTabCopy {
  readonly languageLabel: string;
  readonly languageDescription: string;
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

export interface NoticeCopy {
  readonly loaded: string;
  readonly failedToProcessPastedImages: string;
  readonly failedToSavePastedImages: string;
  readonly failedToSavePastedImage: (fileName: string) => string;
  readonly processedPastedImages: (successCount: number, failedCount: number) => string;
  readonly noActiveFolder: string;
  readonly noActiveNote: string;
  readonly noActiveImageFile: string;
  readonly noActiveNoteFile: string;
  readonly galleryDisabled: string;
  readonly convertedToFormat: (format: string) => string;
  readonly noImagesFound: string;
  readonly batchJobAlreadyActive: string;
  readonly imageResized: string;
  readonly imageCompressed: string;
  readonly imageRotated: string;
  readonly imageFlippedHorizontal: string;
  readonly imageFlippedVertical: string;
  readonly imageCropped: string;
  readonly copyImageUnavailable: string;
  readonly imageCopied: string;
  readonly failedToCopyImage: string;
  readonly imageFileUnavailable: string;
  readonly noUndoTransaction: string;
  readonly undoCompleted: (label: string) => string;
  readonly undoFailed: string;
  readonly noRedoTransaction: string;
  readonly redoCompleted: (label: string) => string;
  readonly redoFailed: string;
  readonly managedImagesSynced: (count: number) => string;
  readonly failedToSyncManagedImages: string;
  readonly commandFailed: (commandName: string) => string;
  readonly batchLinkRewriteFailed: string;
  readonly batchExternalImageImportFailed: string;
  readonly orphanCleanupFailed: string;
  readonly recoveryHistoryReset: string;
  readonly selectAreaFirst: string;
  readonly compressionSummary: (before: string, after: string, ratio: string, direction: string, label: string) => string;
  readonly compressionDirectionReduction: string;
  readonly compressionDirectionIncrease: string;
  readonly noImagesSaved: string;
  readonly savedSingleImage: (path: string) => string;
  readonly savedImagesToFolder: (count: number, folder: string) => string;
  readonly savedImagesAcrossFolders: (count: number, folderCount: number) => string;
  readonly conversionIgnored: (fileName: string, pattern: string) => string;
  readonly compressionIgnored: (fileName: string, pattern: string) => string;
  readonly compressionBelowThreshold: (fileName: string) => string;
  readonly compressionAlreadyProcessed: (fileName: string) => string;
  readonly compressionShouldNotRecompress: (fileName: string) => string;
  readonly compressionNoGain: (fileName: string) => string;
  readonly noAutoConvertFallback: string;
  readonly autoConvertFallbackMixed: (total: number, ignoredCount: number, failedCount: number) => string;
  readonly autoConvertFallbackIgnored: (ignoredCount: number) => string;
  readonly autoConvertFallbackFailed: (failedCount: number) => string;
  readonly batchLinkUpdateEmptyWithDeletes: (deletedImages: number, deletedFolders: number, failedCount: number) => string;
  readonly batchLinkUpdateEmptyFailed: (failedCount: number) => string;
  readonly noImageLinksUpdated: string;
  readonly batchLinkPreviewItem: (notePath: string, replaced: number) => string;
  readonly batchLinkMore: (count: number) => string;
  readonly batchLinkMoved: (count: number) => string;
  readonly batchLinkDownloaded: (count: number) => string;
  readonly batchLinkDeleted: (count: number) => string;
  readonly batchLinkRemovedFolders: (count: number) => string;
  readonly batchFailedCount: (count: number) => string;
  readonly batchLinkUpdateFinished: (fileCount: number, linkCount: number, previews: string, suffix: string) => string;
  readonly batchCompressionNone: string;
  readonly batchCompressionFinished: (fileCount: number) => string;
  readonly batchCompressionFinishedWithDelta: (fileCount: number, before: string, after: string, ratio: string, direction: string) => string;
  readonly externalImportEmptyFailed: (failedCount: number) => string;
  readonly noExternalImageLinksFound: string;
  readonly externalImportDownloaded: (count: number) => string;
  readonly externalImportFinished: (fileCount: number, linkCount: number, previews: string, suffix: string) => string;
  readonly noMatchingExternalImageLink: string;
  readonly singleExternalImportFinished: (replaced: number, downloaded: number) => string;
  readonly batchConversionFinished: (imageCount: number, targetFormat: string) => string;
  readonly orphanCleanupEmptyFailed: (failedCount: number) => string;
  readonly noExtraImagesFound: string;
  readonly orphanCleanupRemovedImages: (count: number) => string;
  readonly orphanCleanupRelocatedImages: (count: number) => string;
  readonly orphanCleanupPreservedImages: (count: number) => string;
  readonly orphanCleanupRemovedFolders: (count: number) => string;
  readonly orphanCleanupFinished: (segments: string) => string;
  readonly pluginConflictPreviewItem: (featureLabel: string, pluginName: string) => string;
  readonly pluginConflictMore: (count: number) => string;
  readonly pluginConflictSummary: (preview: string, suffix: string) => string;
}

export interface UiCopy {
  readonly common: {
    readonly vaultRoot: string;
    readonly platforms: Readonly<Record<'mobile' | 'desktop' | 'mobileMode' | 'desktopMode', string>>;
  };
  readonly gallery: {
    readonly titleForNote: (noteName: string) => string;
    readonly titleForFolder: (folderPath: string) => string;
    readonly titleForImage: (fileName: string) => string;
    readonly searchPlaceholder: string;
    readonly sortBy: Readonly<Record<'date' | 'name' | 'size', string>>;
    readonly viewMode: Readonly<Record<'grid' | 'list', string>>;
    readonly emptyResults: string;
    readonly close: string;
    readonly previous: string;
    readonly next: string;
    readonly copyImage: string;
  };
  readonly imageSelection: {
    readonly clearSelection: string;
    readonly cancel: string;
    readonly dragHint: string;
    readonly selectionHint: (width: number, height: number) => string;
  };
  readonly contextMenu: {
    readonly openInGallery: string;
    readonly copyImageToClipboard: string;
    readonly convertToDefaultFormat: string;
    readonly compressImage: string;
    readonly cropBySelection: string;
    readonly rotateClockwise90: string;
    readonly rotateCounterClockwise90: string;
    readonly flipHorizontal: string;
    readonly flipVertical: string;
    readonly downloadExternalImage: string;
    readonly cropDialogTitle: (fileName: string) => string;
    readonly cropDialogDescription: string;
    readonly cropConfirm: string;
  };
  readonly vaultOperation: {
    readonly title: string;
    readonly message: (actionName: string) => string;
    readonly confirmText: string;
    readonly cancelText: string;
    readonly actionNames: Readonly<
      Record<'linkRewrite' | 'externalImport' | 'orphanCleanup' | 'formatConversion' | 'compression', string>
    >;
  };
  readonly conflicts: {
    readonly featureLabels: Readonly<Record<'paste-handler' | 'note-rename-sync', string>>;
    readonly descriptions: Readonly<Record<'paste-handler' | 'note-rename-sync', string>>;
  };
  readonly transactions: {
    readonly pasteImport: (noteName: string) => string;
    readonly rewriteActiveNoteImageLinks: (noteName: string) => string;
    readonly convertCurrentNoteImages: string;
    readonly convertFolderImages: (folderPath: string) => string;
    readonly convertVaultImages: string;
    readonly compressCurrentNoteImages: string;
    readonly compressFolderImages: (folderPath: string) => string;
    readonly compressVaultImages: string;
    readonly batchUpdateNoteImageLinks: (noteName: string) => string;
    readonly importCurrentNoteExternalImages: string;
    readonly deleteCurrentNoteExtraImages: (noteName: string) => string;
    readonly batchUpdateFolderImageLinks: (folderPath: string) => string;
    readonly importFolderExternalImages: (folderPath: string) => string;
    readonly deleteFolderExtraImages: (folderPath: string) => string;
    readonly batchUpdateVaultImageLinks: string;
    readonly importVaultExternalImages: string;
    readonly deleteVaultExtraImages: string;
    readonly contextConvertImage: (fileName: string) => string;
    readonly contextCompressImage: (fileName: string) => string;
    readonly contextCropImage: (fileName: string) => string;
    readonly contextRotateImage: (fileName: string) => string;
    readonly contextFlipHorizontalImage: (fileName: string) => string;
    readonly contextFlipVerticalImage: (fileName: string) => string;
    readonly contextDownloadExternalImage: (noteName: string) => string;
    readonly rotateActiveImage: string;
    readonly flipActiveImageHorizontal: string;
    readonly resizeActiveImage: string;
    readonly syncManagedImages: (noteName: string) => string;
  };
}

interface LocaleBundle {
  readonly settingsTab: SettingTabCopy;
  readonly commands: Readonly<Record<string, string>>;
  readonly ui: UiCopy;
  readonly notices: NoticeCopy;
}

export const LOCALIZED_COMMAND_IDS = [
  'a1-update-current-note-image-links',
  'a2-import-current-note-external-images',
  'a3-convert-active-image-to-default-format',
  'a4-compress-active-image',
  'a5-delete-current-note-extra-images',
  'b1-update-current-folder-image-links',
  'b2-import-current-folder-external-images',
  'b3-convert-current-folder-images-to-default-format',
  'b4-compress-current-folder-images',
  'b5-delete-current-folder-extra-images',
  'c1-update-vault-image-links',
  'c2-import-vault-external-images',
  'c3-convert-vault-images-to-default-format',
  'c4-compress-vault-images',
  'c5-delete-vault-extra-images',
  'd1-undo-last-image-manager-transaction',
  'd2-redo-last-image-manager-transaction',
  'open-current-folder-gallery',
  'open-current-note-gallery'
] as const;

export type LocalizedCommandId = (typeof LOCALIZED_COMMAND_IDS)[number];

const COMMAND_SCOPE_COPIES: Readonly<Record<UiLanguage, CommandScopeCopy>> = {
  'zh-CN': {
    displayLabels: {
      FILE: '【单文件】',
      FOLDER: '【单文件夹】',
      VAULT: '【整库】'
    },
    aliases: {
      FILE: ['【单文件】', '单文件：', '当前文件：', '当前笔记：', '图片：'],
      FOLDER: ['【单文件夹】', '单文件夹：', '当前文件夹：'],
      VAULT: ['【整库】', '整库：', '整个仓库：']
    }
  },
  en: {
    displayLabels: {
      FILE: '【File】',
      FOLDER: '【Folder】',
      VAULT: '【Vault】'
    },
    aliases: {
      FILE: ['【File】', 'File:', 'Current file:', 'Current note:', 'Image:'],
      FOLDER: ['【Folder】', 'Folder:', 'Current folder:'],
      VAULT: ['【Vault】', 'Vault:', 'Entire vault:']
    }
  }
};

const ZH_SETTINGS_TAB: SettingTabCopy = {
  languageLabel: '界面语言',
  languageDescription: '切换设置页与功能状态的显示语言。默认中文。',
  header: {
    title: 'Image Manager 设置',
    subtitle: '管理 Obsidian 图片保存、转换、压缩和恢复。',
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
      `${platform}；剪贴板复制${canWriteClipboard ? '可用' : '不可用'}。`,
    debugTitle: '调试日志模式',
    debugEnabled: '调试模式已开启，会输出更多日志。',
    debugDisabled: '调试模式关闭。',
    formatsTitle: '可编码输出格式',
    formatsAvailable: (formats) => `可输出：${formats.join('、')}。GIF、HEIC、TIFF 不保证重编码。`,
    formatsUnavailable: '未检测到稳定输出格式，建议保留原图。',
    pasteConflictTitle: '粘贴接管冲突',
    pasteConflictEnabled: '粘贴接管已启用，可能与附件插件重复处理。',
    pasteConflictDisabled: '粘贴接管已关闭。',
    nativeAttachmentTitle: 'Obsidian 原生附件目录',
    nativeAttachmentDescription: (folder) => `Obsidian 附件目录：“${folder}”。本插件粘贴规则会优先生效。`,
    pluginConflictTitle: (featureLabel) => `${featureLabel} 与插件冲突`,
    pluginConflictDescription: (pluginName, pluginId, description) => `已启用“${pluginName}”（${pluginId}）。${description}`,
    renameSyncTitle: '笔记改名同步范围',
    renameSyncUnsafe: '当前目录规则不可安全迁移，会跳过同步。',
    renameSyncSafe: '当前目录规则可安全同步。',
    renameSyncDisabled: '笔记改名同步已关闭。',
    conflictFeatureLabels: {
      'paste-handler': '粘贴接管',
      'note-rename-sync': '笔记改名同步'
    }
  }
};

const EN_SETTINGS_TAB: SettingTabCopy = {
  languageLabel: 'Interface Language',
  languageDescription: 'Switch settings language. Default: Chinese.',
  header: {
    title: 'Image Manager Settings',
    subtitle: 'Manage image storage, conversion, compression, and recovery in Obsidian.',
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
      `${platform}; clipboard copy is ${canWriteClipboard ? 'available' : 'unavailable'}.`,
    debugTitle: 'Debug logging mode',
    debugEnabled: 'Debug mode is on; extra logs are enabled.',
    debugDisabled: 'Debug mode is off.',
    formatsTitle: 'Encodable output formats',
    formatsAvailable: (formats) => `Can encode: ${formats.join(', ')}. GIF, HEIC, and TIFF may not round-trip.`,
    formatsUnavailable: 'No stable output format detected. Keep originals.',
    pasteConflictTitle: 'Paste takeover conflicts',
    pasteConflictEnabled: 'Paste takeover is on and may overlap with attachment plugins.',
    pasteConflictDisabled: 'Paste takeover is off.',
    nativeAttachmentTitle: 'Native attachment folder',
    nativeAttachmentDescription: (folder) => `Obsidian attachment folder: "${folder}". Image Manager paste rules take priority.`,
    pluginConflictTitle: (featureLabel) => `${featureLabel} conflict`,
    pluginConflictDescription: (pluginName, pluginId, description) => `Detected enabled plugin "${pluginName}" (${pluginId}). ${description}`,
    renameSyncTitle: 'Rename-sync scope',
    renameSyncUnsafe: 'The current output-folder rule is not a safely relocatable managed template, so auto-sync is skipped.',
    renameSyncSafe: 'The current folder rule can sync safely.',
    renameSyncDisabled: 'Note rename sync is off.',
    conflictFeatureLabels: {
      'paste-handler': 'Paste takeover',
      'note-rename-sync': 'Note rename sync'
    }
  }
};

const ZH_COMMANDS: Readonly<Record<string, string>> = {
  'a1-update-current-note-image-links': '更新图片链接与目录',
  'a2-import-current-note-external-images': '下载外部图片',
  'a3-convert-active-image-to-default-format': '转换为默认格式',
  'a4-compress-active-image': '压缩图片',
  'a5-delete-current-note-extra-images': '删除多余图片',
  'b1-update-current-folder-image-links': '更新图片链接与目录',
  'b2-import-current-folder-external-images': '下载外部图片',
  'b3-convert-current-folder-images-to-default-format': '转换为默认格式',
  'b4-compress-current-folder-images': '压缩图片',
  'b5-delete-current-folder-extra-images': '删除多余图片',
  'c1-update-vault-image-links': '更新图片链接与目录',
  'c2-import-vault-external-images': '下载外部图片',
  'c3-convert-vault-images-to-default-format': '转换为默认格式',
  'c4-compress-vault-images': '压缩图片',
  'c5-delete-vault-extra-images': '删除多余图片',
  'd1-undo-last-image-manager-transaction': '撤销图片修改',
  'd2-redo-last-image-manager-transaction': '重做图片修改',
  'open-current-folder-gallery': '打开画廊',
  'open-current-note-gallery': '打开画廊',
  'rotate-active-image-90': '顺时针旋转图片 90°',
  'flip-active-image-horizontal': '水平翻转图片',
  'resize-active-image-to-1920px': '缩放图片到 1920px 边界'
};

const EN_COMMANDS: Readonly<Record<string, string>> = {
  'a1-update-current-note-image-links': 'Update image links and folders',
  'a2-import-current-note-external-images': 'Download external images locally',
  'a3-convert-active-image-to-default-format': 'Convert images to default format',
  'a4-compress-active-image': 'Compress images',
  'a5-delete-current-note-extra-images': 'Delete extra image files',
  'b1-update-current-folder-image-links': 'Update image links and folders',
  'b2-import-current-folder-external-images': 'Download external images locally',
  'b3-convert-current-folder-images-to-default-format': 'Convert images to default format',
  'b4-compress-current-folder-images': 'Compress images',
  'b5-delete-current-folder-extra-images': 'Delete extra image files',
  'c1-update-vault-image-links': 'Update image links and folders',
  'c2-import-vault-external-images': 'Download external images locally',
  'c3-convert-vault-images-to-default-format': 'Convert images to default format',
  'c4-compress-vault-images': 'Compress images',
  'c5-delete-vault-extra-images': 'Delete extra image files',
  'd1-undo-last-image-manager-transaction': 'Undo last image change',
  'd2-redo-last-image-manager-transaction': 'Redo last image change',
  'open-current-folder-gallery': 'Open current folder image gallery',
  'open-current-note-gallery': 'Open current note image gallery',
  'rotate-active-image-90': 'Rotate image 90° clockwise',
  'flip-active-image-horizontal': 'Flip image horizontally',
  'resize-active-image-to-1920px': 'Resize image to 1920px boundary'
};

const ZH_UI: UiCopy = {
  common: {
    vaultRoot: '仓库根目录',
    platforms: {
      mobile: '移动端',
      desktop: '桌面端',
      mobileMode: '移动模式',
      desktopMode: '桌面模式'
    }
  },
  gallery: {
    titleForNote: (noteName) => `${noteName} 中的图片`,
    titleForFolder: (folderPath) => `${folderPath} 中的图片`,
    titleForImage: (fileName) => `图片：${fileName}`,
    searchPlaceholder: '按文件名筛选',
    sortBy: {
      date: '最新优先',
      name: '按名称',
      size: '大图优先'
    },
    viewMode: {
      grid: '网格',
      list: '列表'
    },
    emptyResults: '当前筛选条件下没有匹配的图片。',
    close: '关闭',
    previous: '上一张',
    next: '下一张',
    copyImage: '复制图片'
  },
  imageSelection: {
    clearSelection: '清空选区',
    cancel: '取消',
    dragHint: '在图片上按住鼠标左键拖拽，框出需要处理的区域。',
    selectionHint: (width, height) => `当前选区：${Math.round(width)} × ${Math.round(height)} 像素（预览坐标）`
  },
  contextMenu: {
    openInGallery: '在画廊中打开',
    copyImageToClipboard: '复制图片到剪贴板',
    convertToDefaultFormat: '转换为默认格式',
    compressImage: '压缩图片',
    cropBySelection: '拖拽裁剪',
    rotateClockwise90: '顺时针旋转 90°',
    rotateCounterClockwise90: '逆时针旋转 90°',
    flipHorizontal: '水平翻转',
    flipVertical: '垂直翻转',
    downloadExternalImage: '下载该外部图片',
    cropDialogTitle: (fileName) => `裁剪图片：${fileName}`,
    cropDialogDescription: '拖拽选择要保留的区域，确认后会按选区裁剪当前图片。',
    cropConfirm: '裁剪'
  },
  vaultOperation: {
    title: '确认整库操作',
    message: (actionName) => `${actionName}会处理整个库中的图片或笔记，可能产生大范围修改。是否继续？`,
    confirmText: '继续整库操作',
    cancelText: '取消',
    actionNames: {
      linkRewrite: '整库图片链接与目录更新',
      externalImport: '整库外部图片下载',
      orphanCleanup: '整库多余图片删除',
      formatConversion: '整库格式转换',
      compression: '整库压缩'
    }
  },
  conflicts: {
    featureLabels: {
      'paste-handler': '粘贴接管',
      'note-rename-sync': '笔记改名同步'
    },
    descriptions: {
      'paste-handler': '该插件也会处理图片粘贴、附件落盘或图片上传，可能与“粘贴接管”重复处理同一张图片。',
      'note-rename-sync': '该插件也可能改写附件目录或跟随笔记移动附件，可能与“笔记改名同步”发生重复搬移。'
    }
  },
  transactions: {
    pasteImport: (noteName) => `粘贴导入 ${noteName}`,
    rewriteActiveNoteImageLinks: (noteName) => `重写活动笔记图片链接 ${noteName}`,
    convertCurrentNoteImages: '转换当前文件引用图片',
    convertFolderImages: (folderPath) => `转换文件夹图片 ${folderPath}`,
    convertVaultImages: '转换整个仓库图片',
    compressCurrentNoteImages: '压缩当前文件引用图片',
    compressFolderImages: (folderPath) => `压缩文件夹图片 ${folderPath}`,
    compressVaultImages: '压缩整个仓库图片',
    batchUpdateNoteImageLinks: (noteName) => `批量更新笔记图片链接 ${noteName}`,
    importCurrentNoteExternalImages: '下载当前笔记外部图片',
    deleteCurrentNoteExtraImages: (noteName) => `删除笔记多余图片 ${noteName}`,
    batchUpdateFolderImageLinks: (folderPath) => `批量更新文件夹图片链接 ${folderPath}`,
    importFolderExternalImages: (folderPath) => `下载文件夹外部图片 ${folderPath}`,
    deleteFolderExtraImages: (folderPath) => `删除文件夹多余图片 ${folderPath}`,
    batchUpdateVaultImageLinks: '批量更新整个仓库图片链接',
    importVaultExternalImages: '下载整个仓库外部图片',
    deleteVaultExtraImages: '删除整个仓库多余图片',
    contextConvertImage: (fileName) => `右键转换图片 ${fileName}`,
    contextCompressImage: (fileName) => `右键压缩图片 ${fileName}`,
    contextCropImage: (fileName) => `右键裁剪图片 ${fileName}`,
    contextRotateImage: (fileName) => `右键旋转图片 ${fileName}`,
    contextFlipHorizontalImage: (fileName) => `右键水平翻转图片 ${fileName}`,
    contextFlipVerticalImage: (fileName) => `右键垂直翻转图片 ${fileName}`,
    contextDownloadExternalImage: (noteName) => `右键下载外部图片 ${noteName}`,
    rotateActiveImage: '旋转当前图片 90 度',
    flipActiveImageHorizontal: '水平翻转当前图片',
    resizeActiveImage: '缩放当前图片到 1920px',
    syncManagedImages: (noteName) => `同步笔记迁移图片 ${noteName}`
  }
};

const EN_UI: UiCopy = {
  common: {
    vaultRoot: 'vault root',
    platforms: {
      mobile: 'Mobile',
      desktop: 'Desktop',
      mobileMode: 'Mobile mode',
      desktopMode: 'Desktop mode'
    }
  },
  gallery: {
    titleForNote: (noteName) => `Images in ${noteName}`,
    titleForFolder: (folderPath) => `Images in ${folderPath}`,
    titleForImage: (fileName) => `Image: ${fileName}`,
    searchPlaceholder: 'Filter by file name',
    sortBy: {
      date: 'Newest first',
      name: 'By name',
      size: 'Largest first'
    },
    viewMode: {
      grid: 'Grid',
      list: 'List'
    },
    emptyResults: 'No images match the current filter.',
    close: 'Close',
    previous: 'Previous',
    next: 'Next',
    copyImage: 'Copy Image'
  },
  imageSelection: {
    clearSelection: 'Clear selection',
    cancel: 'Cancel',
    dragHint: 'Click and drag on the image to mark the area to process.',
    selectionHint: (width, height) => `Selection: ${Math.round(width)} × ${Math.round(height)} px (preview coordinates)`
  },
  contextMenu: {
    openInGallery: 'Open in gallery',
    copyImageToClipboard: 'Copy image to clipboard',
    convertToDefaultFormat: 'Convert to default format',
    compressImage: 'Compress image',
    cropBySelection: 'Crop by selection',
    rotateClockwise90: 'Rotate 90° clockwise',
    rotateCounterClockwise90: 'Rotate 90° counterclockwise',
    flipHorizontal: 'Flip horizontally',
    flipVertical: 'Flip vertically',
    downloadExternalImage: 'Download this external image locally',
    cropDialogTitle: (fileName) => `Crop image: ${fileName}`,
    cropDialogDescription: 'Drag to select the area to keep, then confirm to crop the current image.',
    cropConfirm: 'Crop'
  },
  vaultOperation: {
    title: 'Confirm vault-wide operation',
    message: (actionName) =>
      `${actionName} will process images or notes across the entire vault and may cause broad changes. Continue?`,
    confirmText: 'Continue',
    cancelText: 'Cancel',
    actionNames: {
      linkRewrite: 'Vault-wide image link and folder update',
      externalImport: 'Vault-wide external image download',
      orphanCleanup: 'Vault-wide extra image cleanup',
      formatConversion: 'Vault-wide format conversion',
      compression: 'Vault-wide compression'
    }
  },
  conflicts: {
    featureLabels: {
      'paste-handler': 'Paste handling',
      'note-rename-sync': 'Note rename sync'
    },
    descriptions: {
      'paste-handler':
        'This plugin also handles image paste, attachment persistence, or image upload and may process the same image twice.',
      'note-rename-sync':
        'This plugin may also rewrite attachment folders or move attachments with notes and can cause duplicate relocation.'
    }
  },
  transactions: {
    pasteImport: (noteName) => `Paste import ${noteName}`,
    rewriteActiveNoteImageLinks: (noteName) => `Rewrite active note image links ${noteName}`,
    convertCurrentNoteImages: 'Convert images referenced by the current note',
    convertFolderImages: (folderPath) => `Convert folder images ${folderPath}`,
    convertVaultImages: 'Convert all vault images',
    compressCurrentNoteImages: 'Compress images referenced by the current note',
    compressFolderImages: (folderPath) => `Compress folder images ${folderPath}`,
    compressVaultImages: 'Compress all vault images',
    batchUpdateNoteImageLinks: (noteName) => `Batch update note image links ${noteName}`,
    importCurrentNoteExternalImages: 'Import external images in the current note',
    deleteCurrentNoteExtraImages: (noteName) => `Delete extra note images ${noteName}`,
    batchUpdateFolderImageLinks: (folderPath) => `Batch update folder image links ${folderPath}`,
    importFolderExternalImages: (folderPath) => `Import folder external images ${folderPath}`,
    deleteFolderExtraImages: (folderPath) => `Delete extra folder images ${folderPath}`,
    batchUpdateVaultImageLinks: 'Batch update vault image links',
    importVaultExternalImages: 'Import vault external images',
    deleteVaultExtraImages: 'Delete extra vault images',
    contextConvertImage: (fileName) => `Context convert image ${fileName}`,
    contextCompressImage: (fileName) => `Context compress image ${fileName}`,
    contextCropImage: (fileName) => `Context crop image ${fileName}`,
    contextRotateImage: (fileName) => `Context rotate image ${fileName}`,
    contextFlipHorizontalImage: (fileName) => `Context flip image horizontally ${fileName}`,
    contextFlipVerticalImage: (fileName) => `Context flip image vertically ${fileName}`,
    contextDownloadExternalImage: (noteName) => `Context import external image ${noteName}`,
    rotateActiveImage: 'Rotate current image 90°',
    flipActiveImageHorizontal: 'Flip current image horizontally',
    resizeActiveImage: 'Resize current image to 1920px',
    syncManagedImages: (noteName) => `Sync managed images for ${noteName}`
  }
};

const ZH_NOTICES: NoticeCopy = {
  loaded: 'Image Manager 已加载',
  failedToProcessPastedImages: '处理粘贴图片失败',
  failedToSavePastedImages: '保存粘贴图片失败',
  failedToSavePastedImage: (fileName) => `保存粘贴图片失败：${fileName}`,
  processedPastedImages: (successCount, failedCount) => `已处理 ${successCount} 张粘贴图片，失败 ${failedCount} 张`,
  noActiveFolder: '没有当前文件夹',
  noActiveNote: '没有当前笔记',
  noActiveImageFile: '请先打开一个图片文件',
  noActiveNoteFile: '请先打开一个笔记文件',
  galleryDisabled: '设置中已禁用画廊功能',
  convertedToFormat: (format) => `已转换为 ${format}`,
  noImagesFound: '没有找到可处理的图片',
  batchJobAlreadyActive: '已有图片批处理任务正在运行',
  imageResized: '图片已缩放',
  imageCompressed: '图片已压缩',
  imageRotated: '图片已旋转',
  imageFlippedHorizontal: '图片已水平翻转',
  imageFlippedVertical: '图片已垂直翻转',
  imageCropped: '图片已裁剪',
  copyImageUnavailable: '当前平台不支持复制图片',
  imageCopied: '图片已复制',
  failedToCopyImage: '复制图片到剪贴板失败',
  imageFileUnavailable: '图片文件已不存在',
  noUndoTransaction: '没有可恢复的图片管理事务',
  undoCompleted: (label) => `已恢复：${label}`,
  undoFailed: '撤销上一条图片管理事务失败',
  noRedoTransaction: '没有可重做的图片管理事务',
  redoCompleted: (label) => `已重做：${label}`,
  redoFailed: '重做上一条图片管理事务失败',
  managedImagesSynced: (count) => `已同步 ${count} 个受管图片文件`,
  failedToSyncManagedImages: '同步改名或移动笔记的受管图片失败',
  commandFailed: (commandName) => `命令执行失败：${commandName}`,
  batchLinkRewriteFailed: '批量更新图片链接失败',
  batchExternalImageImportFailed: '批量下载外部图片失败',
  orphanCleanupFailed: '清理多余图片失败',
  recoveryHistoryReset: 'Image Manager 恢复历史损坏，已自动重置',
  selectAreaFirst: '请先拖拽选择一个区域',
  compressionSummary: (before, after, ratio, direction, label) => `${label}：${before} -> ${after}（${ratio} ${direction}）`,
  compressionDirectionReduction: '减小',
  compressionDirectionIncrease: '增大',
  noImagesSaved: '没有保存任何图片',
  savedSingleImage: (path) => `图片已保存到 ${path}`,
  savedImagesToFolder: (count, folder) => `已保存 ${count} 张图片到 ${folder}`,
  savedImagesAcrossFolders: (count, folderCount) => `已保存 ${count} 张图片，分布在 ${folderCount} 个文件夹`,
  conversionIgnored: (fileName, pattern) => `已跳过转换 ${fileName}：匹配忽略规则“${pattern}”`,
  compressionIgnored: (fileName, pattern) => `已跳过压缩 ${fileName}：匹配忽略规则“${pattern}”`,
  compressionBelowThreshold: (fileName) => `已跳过压缩 ${fileName}：低于体积阈值`,
  compressionAlreadyProcessed: (fileName) => `已跳过压缩 ${fileName}：当前版本已压缩过`,
  compressionShouldNotRecompress: (fileName) => `已跳过压缩 ${fileName}：当前版本不应重复压缩`,
  compressionNoGain: (fileName) => `已跳过压缩 ${fileName}：没有生成更小的输出`,
  noAutoConvertFallback: '没有粘贴图片回退到原始格式',
  autoConvertFallbackMixed: (total, ignoredCount, failedCount) =>
    `${total} 张粘贴图片未转换：${ignoredCount} 张命中忽略规则，${failedCount} 张转换失败`,
  autoConvertFallbackIgnored: (ignoredCount) => `${ignoredCount} 张粘贴图片未转换：命中转换忽略规则`,
  autoConvertFallbackFailed: (failedCount) => `${failedCount} 张粘贴图片未转换：未能转换到目标格式`,
  batchLinkUpdateEmptyWithDeletes: (deletedImages, deletedFolders, failedCount) => {
    const extras = [`删除 ${deletedImages} 张图片`];
    if (deletedFolders > 0) {
      extras.push(`删除 ${deletedFolders} 个空文件夹`);
    }
    if (failedCount > 0) {
      extras.push(`失败 ${failedCount} 项`);
    }
    return `批量更新图片链接完成：0 个文件，0 个链接更新；${extras.join('，')}`;
  },
  batchLinkUpdateEmptyFailed: (failedCount) => `批量更新图片链接完成：0 个文件更新，失败 ${failedCount} 项`,
  noImageLinksUpdated: '没有需要更新的图片链接',
  batchLinkPreviewItem: (notePath, replaced) => `${notePath}（${replaced} 个链接）`,
  batchLinkMore: (count) => `另有 ${count} 项`,
  batchLinkMoved: (count) => `移动 ${count} 张图片`,
  batchLinkDownloaded: (count) => `下载 ${count} 张图片`,
  batchLinkDeleted: (count) => `删除 ${count} 张图片`,
  batchLinkRemovedFolders: (count) => `删除 ${count} 个空文件夹`,
  batchFailedCount: (count) => `失败 ${count} 项`,
  batchLinkUpdateFinished: (fileCount, linkCount, previews, suffix) =>
    `批量更新图片链接完成：${fileCount} 个文件，${linkCount} 个链接更新：${previews}${suffix}`,
  batchCompressionNone: '没有需要压缩的图片',
  batchCompressionFinished: (fileCount) => `批量压缩完成：${fileCount} 张图片`,
  batchCompressionFinishedWithDelta: (fileCount, before, after, ratio, direction) =>
    `批量压缩完成：${fileCount} 张图片，${before} -> ${after}（${ratio} ${direction}）`,
  externalImportEmptyFailed: (failedCount) => `外部图片导入完成：0 个文件，失败 ${failedCount} 项`,
  noExternalImageLinksFound: '没有找到外部图片链接',
  externalImportDownloaded: (count) => `下载 ${count} 张图片`,
  externalImportFinished: (fileCount, linkCount, previews, suffix) =>
    `外部图片导入完成：${fileCount} 个文件，${linkCount} 个链接更新：${previews}${suffix}`,
  noMatchingExternalImageLink: '笔记中没有找到匹配的外部图片链接',
  singleExternalImportFinished: (replaced, downloaded) => `外部图片导入完成：更新 ${replaced} 个链接，下载 ${downloaded} 张图片`,
  batchConversionFinished: (imageCount, targetFormat) => `批量转换完成：${imageCount} 张图片 -> ${targetFormat}`,
  orphanCleanupEmptyFailed: (failedCount) => `清理多余图片完成：删除 0 张图片，失败 ${failedCount} 项`,
  noExtraImagesFound: '没有找到多余图片文件',
  orphanCleanupRemovedImages: (count) => `删除 ${count} 张图片`,
  orphanCleanupRelocatedImages: (count) => `移动 ${count} 张图片到被引用笔记所在文件夹`,
  orphanCleanupPreservedImages: (count) => `保留 ${count} 张仍被其他笔记引用的图片`,
  orphanCleanupRemovedFolders: (count) => `删除 ${count} 个空文件夹`,
  orphanCleanupFinished: (segments) => `清理多余图片完成：${segments}`,
  pluginConflictPreviewItem: (featureLabel, pluginName) => `${featureLabel} vs ${pluginName}`,
  pluginConflictMore: (count) => `；另有 ${count} 项`,
  pluginConflictSummary: (preview, suffix) => `检测到潜在插件冲突：${preview}${suffix}。可在 Image Manager 设置的“兼容性与冲突规避”中查看。`
};

const EN_NOTICES: NoticeCopy = {
  loaded: 'Image Manager loaded',
  failedToProcessPastedImages: 'Failed to process pasted images',
  failedToSavePastedImages: 'Failed to save pasted images',
  failedToSavePastedImage: (fileName) => `Failed to save pasted image: ${fileName}`,
  processedPastedImages: (successCount, failedCount) => `Processed ${successCount} pasted image(s), failed ${failedCount}`,
  noActiveFolder: 'No active folder',
  noActiveNote: 'No active note',
  noActiveImageFile: 'Open an image file first',
  noActiveNoteFile: 'Open a note file first',
  galleryDisabled: 'Gallery is disabled in settings',
  convertedToFormat: (format) => `Converted to ${format}`,
  noImagesFound: 'No images found',
  batchJobAlreadyActive: 'An image batch job is already active',
  imageResized: 'Image resized',
  imageCompressed: 'Image compressed',
  imageRotated: 'Image rotated',
  imageFlippedHorizontal: 'Image flipped horizontally',
  imageFlippedVertical: 'Image flipped vertically',
  imageCropped: 'Image cropped',
  copyImageUnavailable: 'Copy image is not available on this platform',
  imageCopied: 'Image copied',
  failedToCopyImage: 'Failed to copy image to clipboard',
  imageFileUnavailable: 'Image file is no longer available',
  noUndoTransaction: 'No recoverable Image Manager transaction is available',
  undoCompleted: (label) => `Restored: ${label}`,
  undoFailed: 'Failed to undo the last Image Manager transaction',
  noRedoTransaction: 'No redoable Image Manager transaction is available',
  redoCompleted: (label) => `Redone: ${label}`,
  redoFailed: 'Failed to redo the last Image Manager transaction',
  managedImagesSynced: (count) => `Synced ${count} managed image${count === 1 ? '' : 's'}`,
  failedToSyncManagedImages: 'Failed to sync managed images for the renamed or moved note',
  commandFailed: (commandName) => `Command failed: ${commandName}`,
  batchLinkRewriteFailed: 'Batch link rewrite failed',
  batchExternalImageImportFailed: 'Batch external image import failed',
  orphanCleanupFailed: 'Orphan image cleanup failed',
  recoveryHistoryReset: 'Image Manager recovery history is unreadable and has been reset',
  selectAreaFirst: 'Drag to select an area first',
  compressionSummary: (before, after, ratio, direction, label) => `${label}: ${before} -> ${after} (${ratio} ${direction})`,
  compressionDirectionReduction: 'reduction',
  compressionDirectionIncrease: 'increase',
  noImagesSaved: 'No images were saved',
  savedSingleImage: (path) => `Saved image to ${path}`,
  savedImagesToFolder: (count, folder) => `Saved ${count} image${count === 1 ? '' : 's'} to ${folder}`,
  savedImagesAcrossFolders: (count, folderCount) =>
    `Saved ${count} image${count === 1 ? '' : 's'} across ${folderCount} folder${folderCount === 1 ? '' : 's'}`,
  conversionIgnored: (fileName, pattern) => `Skipped conversion for ${fileName}: matched ignore rule "${pattern}"`,
  compressionIgnored: (fileName, pattern) => `Skipped compression for ${fileName}: matched ignore rule "${pattern}"`,
  compressionBelowThreshold: (fileName) => `Skipped compression for ${fileName}: below size threshold`,
  compressionAlreadyProcessed: (fileName) => `Skipped compression for ${fileName}: current file version was already compressed`,
  compressionShouldNotRecompress: (fileName) => `Skipped compression for ${fileName}: current file version should not be recompressed`,
  compressionNoGain: (fileName) => `Skipped compression for ${fileName}: no smaller output was produced`,
  noAutoConvertFallback: 'No pasted images fell back to their original format',
  autoConvertFallbackMixed: (total, ignoredCount, failedCount) =>
    `Pasted ${total} image(s) without conversion: ${ignoredCount} matched ignore rules, ${failedCount} failed to convert`,
  autoConvertFallbackIgnored: (ignoredCount) => `Pasted ${ignoredCount} image(s) without conversion: matched conversion ignore rules`,
  autoConvertFallbackFailed: (failedCount) =>
    `Pasted ${failedCount} image(s) without conversion: failed to convert to the requested format`,
  batchLinkUpdateEmptyWithDeletes: (deletedImages, deletedFolders, failedCount) => {
    const extras = [`deleted ${deletedImages} image(s)`];
    if (deletedFolders > 0) {
      extras.push(`removed ${deletedFolders} empty folder(s)`);
    }
    if (failedCount > 0) {
      extras.push(`${failedCount} failed`);
    }
    return `Batch link update finished: 0 file(s), 0 link(s) updated; ${extras.join(', ')}`;
  },
  batchLinkUpdateEmptyFailed: (failedCount) => `Batch link update finished: 0 file(s) updated, ${failedCount} failed`,
  noImageLinksUpdated: 'No image links needed updating',
  batchLinkPreviewItem: (notePath, replaced) => `${notePath} (${replaced} link${replaced === 1 ? '' : 's'})`,
  batchLinkMore: (count) => `+${count} more`,
  batchLinkMoved: (count) => `moved ${count} image(s)`,
  batchLinkDownloaded: (count) => `downloaded ${count} image(s)`,
  batchLinkDeleted: (count) => `deleted ${count} image(s)`,
  batchLinkRemovedFolders: (count) => `removed ${count} empty folder(s)`,
  batchFailedCount: (count) => `${count} failed`,
  batchLinkUpdateFinished: (fileCount, linkCount, previews, suffix) =>
    `Batch link update finished: ${fileCount} file(s), ${linkCount} link(s) updated: ${previews}${suffix}`,
  batchCompressionNone: 'No images required compression',
  batchCompressionFinished: (fileCount) => `Batch compression finished: ${fileCount} image(s)`,
  batchCompressionFinishedWithDelta: (fileCount, before, after, ratio, direction) =>
    `Batch compression finished: ${fileCount} image(s), ${before} -> ${after} (${ratio} ${direction})`,
  externalImportEmptyFailed: (failedCount) => `External image import finished: 0 file(s), ${failedCount} failed`,
  noExternalImageLinksFound: 'No external image links found',
  externalImportDownloaded: (count) => `downloaded ${count} image(s)`,
  externalImportFinished: (fileCount, linkCount, previews, suffix) =>
    `External image import finished: ${fileCount} file(s), ${linkCount} link(s) updated: ${previews}${suffix}`,
  noMatchingExternalImageLink: 'No matching external image link found in the note',
  singleExternalImportFinished: (replaced, downloaded) =>
    `External image import finished: ${replaced} link(s) updated, downloaded ${downloaded} image(s)`,
  batchConversionFinished: (imageCount, targetFormat) => `Batch conversion finished: ${imageCount} image(s) -> ${targetFormat}`,
  orphanCleanupEmptyFailed: (failedCount) => `Extra image cleanup finished: 0 image(s) removed, ${failedCount} failed`,
  noExtraImagesFound: 'No extra image files found',
  orphanCleanupRemovedImages: (count) => `removed ${count} image(s)`,
  orphanCleanupRelocatedImages: (count) => `moved ${count} image(s) to referenced note folder(s)`,
  orphanCleanupPreservedImages: (count) => `kept ${count} image(s) still referenced by other notes`,
  orphanCleanupRemovedFolders: (count) => `removed ${count} empty folder(s)`,
  orphanCleanupFinished: (segments) => `Extra image cleanup finished: ${segments}`,
  pluginConflictPreviewItem: (featureLabel, pluginName) => `${featureLabel} vs ${pluginName}`,
  pluginConflictMore: (count) => `; ${count} more`,
  pluginConflictSummary: (preview, suffix) =>
    `Potential plugin conflicts detected: ${preview}${suffix}. Review them in Image Manager settings under Compatibility.`
};

const LOCALES: Readonly<Record<UiLanguage, LocaleBundle>> = {
  'zh-CN': {
    settingsTab: ZH_SETTINGS_TAB,
    commands: ZH_COMMANDS,
    ui: ZH_UI,
    notices: ZH_NOTICES
  },
  en: {
    settingsTab: EN_SETTINGS_TAB,
    commands: EN_COMMANDS,
    ui: EN_UI,
    notices: EN_NOTICES
  }
};

export { DEFAULT_UI_LANGUAGE, getUiLanguageOptions };
export type { UiLanguage };

export function getCommandScopeCopy(language: UiLanguage): CommandScopeCopy {
  return COMMAND_SCOPE_COPIES[resolveUiLanguage(language)];
}

export function getCommandScopeAliases(): Readonly<Record<CommandScopeLabelKey, readonly string[]>> {
  const aliases: Record<CommandScopeLabelKey, string[]> = {
    FILE: [],
    FOLDER: [],
    VAULT: []
  };

  for (const copy of Object.values(COMMAND_SCOPE_COPIES)) {
    for (const scope of Object.keys(aliases) as CommandScopeLabelKey[]) {
      aliases[scope].push(...copy.aliases[scope]);
    }
  }

  return aliases;
}

export function getCommandScopeDisplayLabels(): readonly string[] {
  return Object.values(COMMAND_SCOPE_COPIES).flatMap((copy) => Object.values(copy.displayLabels));
}

export function getLocaleBundle(language: UiLanguage): LocaleBundle {
  return LOCALES[language] ?? LOCALES[DEFAULT_UI_LANGUAGE];
}

export function getSettingTabCopy(language: UiLanguage): SettingTabCopy {
  return getLocaleBundle(language).settingsTab;
}

export function getLocalizedCommandName(commandId: string, language: UiLanguage): string | null {
  return getLocaleBundle(language).commands[commandId] ?? null;
}

export function getDefaultCommandName(commandId: string): string {
  return getLocalizedCommandName(commandId, DEFAULT_UI_LANGUAGE) ?? commandId;
}

export function getLocalizedCommandIds(): readonly LocalizedCommandId[] {
  return LOCALIZED_COMMAND_IDS;
}

export function getUiCopy(language: UiLanguage): UiCopy {
  return getLocaleBundle(language).ui;
}

export function getNoticeCopy(language: UiLanguage): NoticeCopy {
  return getLocaleBundle(language).notices;
}
