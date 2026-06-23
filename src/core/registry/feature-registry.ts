import type { ImageManagerFeature, ImageManagerFeatureContext } from '@/types/index';

export class FeatureRegistry {
  private readonly features = new Map<string, ImageManagerFeature>();

  register(feature: ImageManagerFeature): void {
    this.features.set(feature.id, feature);
  }

  async activateAll(context: ImageManagerFeatureContext): Promise<void> {
    for (const feature of this.features.values()) {
      await feature.register(context);
    }
  }

  list(): ImageManagerFeature[] {
    return [...this.features.values()];
  }
}
