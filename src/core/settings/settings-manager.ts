import { DEFAULT_SETTINGS, type ImageManagerSettings } from '@/types/index';

type LoadData = () => Promise<unknown>;
type SaveData = (data: ImageManagerSettings) => Promise<void>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export class SettingsManager {
  private settings: ImageManagerSettings = { ...DEFAULT_SETTINGS };

  constructor(
    private readonly loadData: LoadData,
    private readonly saveData: SaveData
  ) {}

  async load(): Promise<ImageManagerSettings> {
    const loaded = await this.loadData();
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...(isRecord(loaded) ? loaded : {})
    };

    return this.getSettings();
  }

  getSettings(): ImageManagerSettings {
    return { ...this.settings };
  }

  async update(mutator: (draft: ImageManagerSettings) => void): Promise<ImageManagerSettings> {
    const draft = this.getSettings();
    mutator(draft);
    this.settings = draft;
    await this.saveData(draft);
    return this.getSettings();
  }
}
