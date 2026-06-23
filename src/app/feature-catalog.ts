import { AlignFeature } from '@/features/align';
import { BatchFeature } from '@/features/batch';
import { CompressFeature } from '@/features/compress';
import { ContextMenuFeature } from '@/features/context-menu';
import { ConvertFeature } from '@/features/convert';
import { EditorFeature } from '@/features/editor';
import { GalleryFeature } from '@/features/gallery';
import { PreviewFeature } from '@/features/preview';
import { RenameFeature } from '@/features/rename';
import { ResizeFeature } from '@/features/resize';
import type { ImageManagerFeature } from '@/types/index';

export function createBuiltInFeatures(): ImageManagerFeature[] {
  return [
    new RenameFeature(),
    new CompressFeature(),
    new ConvertFeature(),
    new PreviewFeature(),
    new EditorFeature(),
    new GalleryFeature(),
    new BatchFeature(),
    new ResizeFeature(),
    new AlignFeature(),
    new ContextMenuFeature()
  ];
}
