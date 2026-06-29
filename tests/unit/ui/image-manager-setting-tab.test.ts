import { afterEach, describe, expect, it, vi } from 'vitest';
import { Setting } from 'obsidian';
import { ImageManagerSettingTab } from '@/ui/settings/image-manager-setting-tab';
import { DEFAULT_SETTINGS, type ImageManagerSettings } from '@/types/index';

function createSettingTab(): ImageManagerSettingTab {
  const settings: ImageManagerSettings = { ...DEFAULT_SETTINGS };
  const app = {
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

  it('renders debug logging in its own diagnostics section after conversion settings', () => {
    const names: string[] = [];
    vi.spyOn(Setting.prototype, 'setName').mockImplementation(function (name?: string) {
      if (typeof name === 'string') {
        names.push(name);
      }
      return this;
    });

    createSettingTab().display();

    const convertIndex = names.indexOf('转换与压缩');
    const thresholdIndex = names.indexOf('压缩阈值（KB）');
    const diagnosticsIndex = names.indexOf('诊断日志');
    const debugToggleIndex = names.indexOf('启用详细调试日志');
    const editorIndex = names.indexOf('粘贴与编辑');

    expect(convertIndex).toBeGreaterThanOrEqual(0);
    expect(thresholdIndex).toBeGreaterThan(convertIndex);
    expect(diagnosticsIndex).toBeGreaterThan(thresholdIndex);
    expect(debugToggleIndex).toBeGreaterThan(diagnosticsIndex);
    expect(editorIndex).toBeGreaterThan(debugToggleIndex);
  });
});
