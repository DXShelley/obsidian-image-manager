import { describe, expect, it } from 'vitest';
import { getLocalizedCommandIds, getLocalizedCommandName, getSettingTabCopy, getUiLanguageOptions } from '@/i18n';
import { createBuiltInFeatures } from '@/app/feature-catalog';

describe('i18n module', () => {
  it('serves settings-tab copy from a centralized locale bundle', () => {
    expect(getSettingTabCopy('zh-CN').header.title).toBe('Image Manager 设置');
    expect(getSettingTabCopy('en').header.title).toBe('Image Manager Settings');
  });

  it('serves localized command labels from the same locale bundle', () => {
    expect(getLocalizedCommandName('a4-compress-active-image', 'zh-CN')).toBe('压缩图片');
    expect(getLocalizedCommandName('a4-compress-active-image', 'en')).toBe('Compress images');
  });

  it('exposes language options for the selector independently from individual views', () => {
    expect(getUiLanguageOptions()).toEqual({
      'zh-CN': '简体中文',
      en: 'English'
    });
  });

  it('covers every command registered by built-in features', async () => {
    const registeredCommandIds = new Set<string>();
    const context = {
      app: {
        workspace: {
          on: () => ({ off: () => undefined })
        },
        vault: {
          on: () => ({ off: () => undefined })
        }
      },
      plugin: {
        addCommand: (command: { id: string }) => {
          registeredCommandIds.add(command.id);
          return command;
        },
        registerEvent: () => undefined,
        registerMarkdownPostProcessor: () => undefined
      },
      services: {
        settings: {
          getSettings: () => ({
            uiLanguage: 'zh-CN',
            enableContextMenu: true
          })
        }
      }
    };

    for (const feature of createBuiltInFeatures()) {
      await feature.register(context as never);
    }

    expect([...registeredCommandIds].sort()).toEqual([...getLocalizedCommandIds()].sort());
  });
});
