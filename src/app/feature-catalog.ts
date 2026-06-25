import { AlignFeature } from '@/features/align';
import { BatchFeature } from '@/features/batch';
import { CompressFeature } from '@/features/compress';
import { ContextMenuFeature } from '@/features/context-menu';
import { ConvertFeature } from '@/features/convert';
import { EditorFeature } from '@/features/editor';
import { GalleryFeature } from '@/features/gallery';
import { PreviewFeature } from '@/features/preview';
import { RecoveryFeature } from '@/features/recovery';
import { RenameFeature } from '@/features/rename';
import { ResizeFeature } from '@/features/resize';
import type { ImageManagerFeature } from '@/types/index';

function createScaffoldedFeature(id: string, name: string, summary: string): ImageManagerFeature {
  return {
    id,
    name,
    summary,
    state: 'scaffolded',
    register: () => undefined
  };
}

export function createBuiltInFeatures(): ImageManagerFeature[] {
  return [
    new RenameFeature(),
    new RecoveryFeature(),
    new CompressFeature(),
    new ConvertFeature(),
    new EditorFeature(),
    new PreviewFeature(),
    new GalleryFeature(),
    new BatchFeature(),
    new ResizeFeature(),
    new AlignFeature(),
    new ContextMenuFeature(),
    createScaffoldedFeature(
      'watermark-removal',
      '去水印',
      '规划中的局部修复能力，仅在效果和交互达到可用标准后再恢复。'
    ),
    createScaffoldedFeature(
      'drag-resize',
      '拖拽调整尺寸',
      '后续会补上编辑器内直接拖拽调整图片显示尺寸的交互。'
    )
  ];
}
