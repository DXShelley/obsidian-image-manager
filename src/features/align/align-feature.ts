import type { ImageManagerFeature, ImageManagerFeatureContext } from '@/types/index';

export class AlignFeature implements ImageManagerFeature {
  readonly id = 'align';
  readonly name = 'Image Alignment';
  readonly summary = 'Apply configurable default alignment styles to rendered note images.';
  readonly state = 'implemented' as const;

  async register(_context: ImageManagerFeatureContext): Promise<void> {
    // Alignment styling is applied through the preview feature's markdown post-processor.
  }
}
