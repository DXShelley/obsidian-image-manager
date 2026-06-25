import { describe, expect, it } from 'vitest';
import { createBuiltInFeatures } from '@/app/feature-catalog';

describe('createBuiltInFeatures', () => {
  it('keeps planned items while excluding removed command-only features', () => {
    const features = createBuiltInFeatures();
    const ids = features.map((feature) => feature.id);

    expect(ids).not.toContain('editor');
    expect(ids).not.toContain('resize');
    expect(ids).toContain('watermark-removal');
    expect(ids).toContain('drag-resize');

    const dragResize = features.find((feature) => feature.id === 'drag-resize');
    expect(dragResize?.state).toBe('scaffolded');
    const watermarkRemoval = features.find((feature) => feature.id === 'watermark-removal');
    expect(watermarkRemoval?.state).toBe('scaffolded');
  });
});
