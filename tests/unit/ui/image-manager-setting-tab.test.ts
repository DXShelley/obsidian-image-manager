import { afterEach, describe, expect, it, vi } from 'vitest';
import { Setting } from 'obsidian';
import { ImageManagerSettingTab } from '@/ui/settings/image-manager-setting-tab';
import { DEFAULT_SETTINGS, type ImageManagerSettings } from '@/types/index';

function createSettingTab(): ImageManagerSettingTab {
  const settings: ImageManagerSettings = { ...DEFAULT_SETTINGS };
  const app = {
    loadLocalStorage: vi.fn(() => null),
    vault: {
      getConfig: vi.fn(() => null)
    },
    plugins: {
      enabledPlugins: new Set<string>(),
      manifests: {}
    }
  };
  const plugin = {
    getSettings: () => settings,
    updateSettings: vi.fn(async (mutator: (draft: ImageManagerSettings) => void) => {
      mutator(settings);
    }),
    listFeatures: vi.fn(() => [])
  };

  return new ImageManagerSettingTab(app as never, plugin as never);
}

describe('ImageManagerSettingTab', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders when the Obsidian button API does not expose setDestructive', () => {
    const setWarning = vi.fn();
    vi.spyOn(Setting.prototype, 'addButton').mockImplementation(function (callback) {
      const button = {
        buttonEl: { addClass: vi.fn() },
        setButtonText: vi.fn(() => button),
        setWarning: vi.fn(() => {
          setWarning();
          return button;
        }),
        onClick: vi.fn(() => button)
      };

      callback(button as never);
      return this;
    });

    expect(() => createSettingTab().display()).not.toThrow();
    expect(setWarning).toHaveBeenCalledTimes(1);
  });

  it('falls back to the warning CSS class when no destructive button helpers exist', () => {
    const addClass = vi.fn();
    vi.spyOn(Setting.prototype, 'addButton').mockImplementation(function (callback) {
      const button = {
        buttonEl: { addClass },
        setButtonText: vi.fn(() => button),
        onClick: vi.fn(() => button)
      };

      callback(button as never);
      return this;
    });

    expect(() => createSettingTab().display()).not.toThrow();
    expect(addClass).toHaveBeenCalledWith('mod-warning');
  });
});
