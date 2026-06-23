import { Notice, Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, type ImageManagerSettings } from '@/types/index';

export default class ImageManagerPlugin extends Plugin {
  pluginSettings!: ImageManagerSettings;

  override async onload(): Promise<void> {
    await this.loadSettings();
    new Notice('Image Manager loaded');
  }

  override onunload(): void {
    // No runtime resources to release in the TypeScript baseline.
  }

  async loadSettings(): Promise<void> {
    this.pluginSettings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) };
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.pluginSettings);
  }
}
