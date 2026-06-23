import { describe, expect, it, vi } from 'vitest';
import { SettingsManager } from '@/core/settings/settings-manager';

describe('SettingsManager', () => {
  it('merges stored settings with defaults', async () => {
    const manager = new SettingsManager(
      async () => ({ renamePattern: '{fileName}', enableGallery: false }),
      vi.fn(async () => undefined)
    );

    const settings = await manager.load();

    expect(settings.renamePattern).toBe('{fileName}');
    expect(settings.enableGallery).toBe(false);
    expect(settings.defaultFormat).toBeDefined();
  });

  it('persists updates', async () => {
    const save = vi.fn(async () => undefined);
    const manager = new SettingsManager(async () => ({}), save);
    await manager.load();

    await manager.update((draft) => {
      draft.outputFolder = './assets';
    });

    expect(save).toHaveBeenCalledTimes(1);
    expect(manager.getSettings().outputFolder).toBe('./assets');
  });
});
