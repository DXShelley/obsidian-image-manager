import { beforeEach, describe, expect, it, vi } from 'vitest';
import { stripScopedCommandSortKey } from '@/utils/command-order';

const showOperationNoticeMock = vi.fn();

interface TestCommand {
  readonly id: string;
  readonly name: string;
}

vi.mock('@/app/feature-catalog', () => ({
  createBuiltInFeatures: vi.fn(() => [
    {
      id: 'test-feature',
      name: 'Test Feature',
      summary: 'test',
      state: 'implemented',
      register: vi.fn(async (context: { plugin: { addCommand: (command: unknown) => unknown } }) => {
        context.plugin.addCommand({
          id: 'open-current-note-gallery',
          name: '打开图片画廊',
          callback: () => undefined
        });
        context.plugin.addCommand({
          id: 'a4-compress-active-image',
          name: '压缩图片',
          callback: () => undefined
        });
        context.plugin.addCommand({
          id: 'd1-undo-last-image-manager-transaction',
          name: '撤销图片修改',
          callback: () => undefined
        });
        context.plugin.addCommand({
          id: 'd2-redo-last-image-manager-transaction',
          name: '重做图片修改',
          callback: () => undefined
        });
        context.plugin.addCommand({
          id: 'custom-unlocalized-command',
          name: 'Note Image Manager: Note Image Manager: Legacy command',
          callback: () => undefined
        });
      })
    }
  ])
}));

vi.mock('@/app/plugin-runtime', () => ({
  createPluginFeatureContext: vi.fn((app, plugin, services) => ({ app, plugin, services })),
  createPluginFeatureRegistry: vi.fn((features) => ({
    activateAll: async (context: { plugin: unknown }) => {
      for (const feature of features) {
        await feature.register(context as never);
      }
    },
    list: () => features
  })),
  createPluginServices: vi.fn(() => ({
    compressionTracker: { initialize: vi.fn(async () => undefined) },
    recovery: { initialize: vi.fn(async () => undefined) },
    logger: {
      refreshMode: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    },
    eventBus: { clear: vi.fn() }
  })),
  getChangedSettingKeys: vi.fn((before: Record<string, unknown>, after: Record<string, unknown>) =>
    Object.keys(after).filter((key) => before[key] !== after[key])
  )
}));

vi.mock('@/utils/operation-feedback', () => ({
  formatAutoConvertFallbackNotice: vi.fn(() => ''),
  formatSavedLocationNotice: vi.fn(() => ''),
  showOperationNotice: showOperationNoticeMock
}));

vi.mock('@/utils/plugin-conflicts', () => ({
  detectPluginConflicts: vi.fn(() => []),
  formatPluginConflictNotice: vi.fn(() => '')
}));

describe('ImageManagerPlugin command localization', () => {
  beforeEach(() => {
    vi.resetModules();
    showOperationNoticeMock.mockReset();
  });

  it('re-registers commands with English names after uiLanguage changes', async () => {
    const { default: ImageManagerPlugin } = await import('@/main');
    const plugin = new ImageManagerPlugin();
    const addCommand = vi.fn();
    const removeCommand = vi.fn();

    plugin.app = {
      workspace: {
        on: vi.fn(() => ({ off: vi.fn() })),
        getActiveViewOfType: vi.fn(() => null)
      },
      vault: {
        getFiles: vi.fn(() => [])
      },
      loadLocalStorage: vi.fn(() => null)
    } as never;
    plugin.addCommand = addCommand as never;
    plugin.removeCommand = removeCommand as never;
    plugin.addSettingTab = vi.fn() as never;
    plugin.registerEvent = vi.fn() as never;

    await plugin.onload();

    addCommand.mockClear();
    removeCommand.mockClear();
    await plugin.updateSettings((draft) => {
      draft.uiLanguage = 'en';
    });

    expect(removeCommand).toHaveBeenCalledWith('open-current-note-gallery');
    expect(removeCommand).toHaveBeenCalledWith('a4-compress-active-image');
    expect(removeCommand).toHaveBeenCalledWith('d1-undo-last-image-manager-transaction');
    expect(removeCommand).toHaveBeenCalledWith('d2-redo-last-image-manager-transaction');
    expect(removeCommand).toHaveBeenCalledWith('custom-unlocalized-command');
    expect(addCommand).toHaveBeenCalledTimes(5);
    expect(addCommand.mock.calls.map(([command]) => stripScopedCommandSortKey(command.name))).toEqual([
      'Compress images【File】',
      'Open current note image gallery【File】',
      'Undo last image change',
      'Redo last image change',
      'Legacy command'
    ]);
  });

  it('does not duplicate recovery commands when switching between Chinese and English', async () => {
    const { default: ImageManagerPlugin } = await import('@/main');
    const plugin = new ImageManagerPlugin();
    const commandRegistry = new Map<string, TestCommand>();
    const duplicateCommandIds: string[] = [];
    const addCommand = vi.fn((command: TestCommand) => {
      if (commandRegistry.has(command.id)) {
        duplicateCommandIds.push(command.id);
      }
      commandRegistry.set(command.id, command);
      return command;
    });
    const removeCommand = vi.fn((commandId: string) => {
      commandRegistry.delete(commandId);
    });

    plugin.app = {
      workspace: {
        on: vi.fn(() => ({ off: vi.fn() })),
        getActiveViewOfType: vi.fn(() => null)
      },
      vault: {
        getFiles: vi.fn(() => [])
      },
      loadLocalStorage: vi.fn(() => null)
    } as never;
    plugin.addCommand = addCommand as never;
    plugin.removeCommand = removeCommand as never;
    plugin.addSettingTab = vi.fn() as never;
    plugin.registerEvent = vi.fn() as never;

    await plugin.onload();
    expect(commandRegistry).toHaveProperty('size', 5);

    addCommand.mockClear();
    removeCommand.mockClear();
    await plugin.updateSettings((draft) => {
      draft.uiLanguage = 'en';
    });
    await plugin.updateSettings((draft) => {
      draft.uiLanguage = 'zh-CN';
    });

    expect(duplicateCommandIds).toEqual([]);
    expect([...commandRegistry.keys()].filter((id) => id === 'd1-undo-last-image-manager-transaction')).toHaveLength(1);
    expect([...commandRegistry.keys()].filter((id) => id === 'd2-redo-last-image-manager-transaction')).toHaveLength(1);
    expect(stripScopedCommandSortKey(commandRegistry.get('d1-undo-last-image-manager-transaction')?.name ?? '')).toBe(
      '撤销图片修改'
    );
    expect(stripScopedCommandSortKey(commandRegistry.get('d2-redo-last-image-manager-transaction')?.name ?? '')).toBe(
      '重做图片修改'
    );
    expect(commandRegistry.get('custom-unlocalized-command')?.name).toBe('Legacy command');
    expect(removeCommand.mock.calls.map(([commandId]) => commandId)).toEqual([
      'open-current-note-gallery',
      'a4-compress-active-image',
      'd1-undo-last-image-manager-transaction',
      'd2-redo-last-image-manager-transaction',
      'custom-unlocalized-command',
      'open-current-note-gallery',
      'a4-compress-active-image',
      'd1-undo-last-image-manager-transaction',
      'd2-redo-last-image-manager-transaction',
      'custom-unlocalized-command'
    ]);
  });
});
