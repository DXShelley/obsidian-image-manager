import { describe, expect, it, vi } from 'vitest';
import { FeatureRegistry } from '@/core/registry/feature-registry';
import type { ImageManagerFeature, ImageManagerFeatureContext } from '@/types/index';

function createFeature(id: string, calls: string[]): ImageManagerFeature {
  return {
    id,
    name: id,
    state: 'implemented',
    summary: `${id} summary`,
    register: async (_context: ImageManagerFeatureContext) => {
      calls.push(id);
    }
  };
}

describe('FeatureRegistry', () => {
  it('activates registered features in insertion order', async () => {
    const calls: string[] = [];
    const registry = new FeatureRegistry();
    registry.register(createFeature('rename', calls));
    registry.register(createFeature('gallery', calls));

    await registry.activateAll({
      app: {} as never,
      plugin: {} as never,
      services: {
        settings: {} as never,
        eventBus: {} as never,
        logger: {} as never,
        variableResolver: {} as never,
        fileManager: {} as never,
        recovery: {} as never,
        imageProcessor: {} as never,
        linkFormatter: {} as never,
        batchProcessor: {} as never
      }
    });

    expect(calls).toEqual(['rename', 'gallery']);
  });

  it('lists feature metadata', () => {
    const registry = new FeatureRegistry();
    registry.register(createFeature('batch', []));

    expect(registry.list().map((feature) => feature.id)).toEqual(['batch']);
  });
});
