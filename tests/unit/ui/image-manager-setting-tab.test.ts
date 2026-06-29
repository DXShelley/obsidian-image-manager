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

  it('styles the reset button as destructive', () => {
    const setDestructive = vi.fn();
    vi.spyOn(Setting.prototype, 'addButton').mockImplementation(function (callback) {
      const button = {
        setButtonText: vi.fn(() => button),
        setDestructive: vi.fn(() => {
          setDestructive();
          return button;
        }),
        onClick: vi.fn(() => button)
      };

      callback(button as never);
      return this;
    });

    expect(() => createSettingTab().display()).not.toThrow();
    expect(setDestructive).toHaveBeenCalledTimes(1);
  });

  it('falls back to the warning class when destructive buttons are unavailable', () => {
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

  it('updates the settings tab after resetting settings', async () => {
    let resetHandler: (() => Promise<void>) | undefined;
    vi.spyOn(Setting.prototype, 'addButton').mockImplementation(function (callback) {
      const button = {
        setButtonText: vi.fn(() => button),
        setDestructive: vi.fn(() => button),
        onClick: vi.fn((handler: () => Promise<void>) => {
          resetHandler = handler;
          return button;
        })
      };

      callback(button as never);
      return this;
    });
    const update = vi.spyOn(ImageManagerSettingTab.prototype, 'update');

    createSettingTab().display();

    expect(resetHandler).toBeDefined();
    await resetHandler?.();
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('falls back to display after resetting settings when update is unavailable', async () => {
    let resetHandler: (() => Promise<void>) | undefined;
    vi.spyOn(Setting.prototype, 'addButton').mockImplementation(function (callback) {
      const button = {
        setButtonText: vi.fn(() => button),
        setDestructive: vi.fn(() => button),
        onClick: vi.fn((handler: () => Promise<void>) => {
          resetHandler = handler;
          return button;
        })
      };

      callback(button as never);
      return this;
    });
    const updateDescriptor = Object.getOwnPropertyDescriptor(ImageManagerSettingTab.prototype, 'update');
    Object.defineProperty(ImageManagerSettingTab.prototype, 'update', {
      configurable: true,
      value: undefined
    });
    const display = vi.spyOn(ImageManagerSettingTab.prototype, 'display');

    createSettingTab().display();

    expect(resetHandler).toBeDefined();
    await resetHandler?.();
    expect(display).toHaveBeenCalledTimes(2);

    if (updateDescriptor) {
      Object.defineProperty(ImageManagerSettingTab.prototype, 'update', updateDescriptor);
    }
  });

  it('renders when inline setting errors are unavailable', () => {
    vi.spyOn(Setting.prototype, 'setErrorMessage').mockImplementation(undefined as never);

    expect(() => createSettingTab().display()).not.toThrow();
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
