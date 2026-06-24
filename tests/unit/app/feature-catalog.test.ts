import { describe, expect, it } from 'vitest';
import { createBuiltInFeatures } from '@/app/feature-catalog';

describe('createBuiltInFeatures', () => {
  it('registers the delivered editor and resize features alongside planned items', () => {
    const features = createBuiltInFeatures();
    const ids = features.map((feature) => feature.id);

    expect(ids).toContain('editor');
    expect(ids).toContain('resize');
    expect(ids).toContain('drag-resize');

    const dragResize = features.find((feature) => feature.id === 'drag-resize');
    expect(dragResize?.state).toBe('scaffolded');
  });
});
