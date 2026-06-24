import { AlignFeature } from '@/features/align';
import { BatchFeature } from '@/features/batch';
import { CompressFeature } from '@/features/compress';
import { ContextMenuFeature } from '@/features/context-menu';
import { ConvertFeature } from '@/features/convert';
import { GalleryFeature } from '@/features/gallery';
import { PreviewFeature } from '@/features/preview';
import { RecoveryFeature } from '@/features/recovery';
import { RenameFeature } from '@/features/rename';
import type { ImageManagerFeature } from '@/types/index';

export function createBuiltInFeatures(): ImageManagerFeature[] {
  return [
    new RenameFeature(),
    new RecoveryFeature(),
    new CompressFeature(),
    new ConvertFeature(),
    new PreviewFeature(),
    new GalleryFeature(),
    new BatchFeature(),
    new AlignFeature(),
    new ContextMenuFeature()
  ];
}
