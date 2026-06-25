import { describe, expect, it } from 'vitest';
import { Alignment, GalleryGridSize, GallerySortBy, ImageFormat, LinkFormat, MarkdownPathEncodingStrategy, PathFormat, type ImageManagerSettings } from '@/types/index';
import { detectPluginConflicts, formatPluginConflictNotice } from '@/utils/plugin-conflicts';

const settings: ImageManagerSettings = {
  uiLanguage: 'zh-CN',
  defaultFormat: ImageFormat.WEBP,
  defaultQuality: 80,
  defaultLinkFormat: LinkFormat.WIKI,
  defaultPathFormat: PathFormat.SHORTEST,
  markdownPathEncodingStrategy: MarkdownPathEncodingStrategy.ENCODED,
  renamePattern: '{noteName}-{date}-{random}',
  outputFolder: '',
  enablePasteHandler: true,
  enableAutoDownloadImagesFromText: true,
  enableAutoConvert: true,
  enableAutoRename: true,
  enableGallery: true,
  enableContextMenu: true,
  enableImageAlign: true,
  imageAlignmentDefaultAlignment: Alignment.NONE,
  disableObsidianImageSelectionOnClick: false,
  dropPasteCursorLocation: 'back',
  showOperationNotifications: true,
  showSpaceSavedNotification: true,
  enableNoteRenameSync: true,
  renameImagesOnNoteRelocate: false,
  deleteEmptyFolders: true,
  deleteOrphanImages: false,
  galleryGridSize: GalleryGridSize.MEDIUM,
  gallerySortBy: GallerySortBy.DATE,
  compressionQuality: 80,
  compressionIgnorePattern: '',
  conversionIgnorePattern: '',
  compressionThresholdKB: 100
};

describe('plugin conflict detection', () => {
  it('detects enabled plugins that may conflict with paste handling and note rename sync', () => {
    const app = {
      plugins: {
        enabledPlugins: new Set(['obsidian-paste-image-rename', 'custom-attachment-location']),
        manifests: {
          'obsidian-paste-image-rename': {
            id: 'obsidian-paste-image-rename',
            name: 'Paste Image Rename',
            description: 'Rename pasted images automatically.'
          },
          'custom-attachment-location': {
            id: 'custom-attachment-location',
            name: 'Custom Attachment Location',
            description: 'Move attachments with notes.'
          }
        }
      }
    };

    const conflicts = detectPluginConflicts(app as never, settings);

    expect(conflicts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          feature: 'paste-handler',
          pluginId: 'obsidian-paste-image-rename'
        }),
        expect.objectContaining({
          feature: 'paste-handler',
          pluginId: 'custom-attachment-location'
        }),
        expect.objectContaining({
          feature: 'note-rename-sync',
          pluginId: 'custom-attachment-location'
        })
      ])
    );
  });

  it('formats a single startup notice summarizing the first conflicts', () => {
    const message = formatPluginConflictNotice([
      {
        feature: 'paste-handler',
        featureLabel: '粘贴接管',
        pluginId: 'obsidian-paste-image-rename',
        pluginName: 'Paste Image Rename',
        description: 'x'
      },
      {
        feature: 'note-rename-sync',
        featureLabel: '笔记改名同步',
        pluginId: 'custom-attachment-location',
        pluginName: 'Custom Attachment Location',
        description: 'y'
      }
    ]);

    expect(message).toBe(
      '检测到潜在插件冲突：粘贴接管 vs Paste Image Rename；笔记改名同步 vs Custom Attachment Location。可在 Image Manager 设置的“兼容性与冲突规避”中查看。'
    );
  });
});
