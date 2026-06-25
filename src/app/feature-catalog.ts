import { AlignFeature } from '@/features/align';
import { BatchFeature } from '@/features/batch';
import { CompressFeature } from '@/features/compress';
import { ContextMenuFeature } from '@/features/context-menu';
import { ConvertFeature } from '@/features/convert';
import { GalleryFeature } from '@/features/gallery';
import { PreviewFeature } from '@/features/preview';
import { RecoveryFeature } from '@/features/recovery';
import { RenameFeature } from '@/features/rename';
import { DEFAULT_UI_LANGUAGE, getSettingTabCopy } from '@/i18n';
import type { ImageManagerFeature } from '@/types/index';

function createScaffoldedFeature(id: string): ImageManagerFeature {
  const copy = getSettingTabCopy(DEFAULT_UI_LANGUAGE);
  return {
    id,
    name: copy.featureLabels[id] ?? id,
    summary: copy.featureSummaries[id] ?? '',
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
    new PreviewFeature(),
    new GalleryFeature(),
    new BatchFeature(),
    new AlignFeature(),
    new ContextMenuFeature(),
    createScaffoldedFeature('watermark-removal'),
    createScaffoldedFeature('drag-resize')
  ];
}
