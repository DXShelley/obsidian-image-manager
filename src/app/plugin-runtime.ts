import type { App, Plugin } from 'obsidian';
import { DebugLogger } from '@/core/debug/debug-logger';
import { EventBus } from '@/core/events/event-bus';
import { FeatureRegistry } from '@/core/registry/feature-registry';
import type { SettingsManager } from '@/core/settings/settings-manager';
import { BatchProcessor } from '@/features/batch';
import { FileManager } from '@/services/file-manager';
import { ImageProcessor } from '@/services/image-processor';
import { LinkFormatter } from '@/services/link-formatter';
import { VariableResolver } from '@/services/variable-resolver';
import type {
  ImageManagerEventMap,
  ImageManagerFeature,
  ImageManagerFeatureContext,
  ImageManagerServices,
  ImageManagerSettings
} from '@/types/index';

export function createPluginServices(app: App, settingsManager: SettingsManager): ImageManagerServices {
  const eventBus = new EventBus<ImageManagerEventMap>();
  const logger = new DebugLogger(app);
  const variableResolver = new VariableResolver();
  const linkFormatter = new LinkFormatter(app);

  return {
    settings: settingsManager,
    eventBus,
    logger,
    variableResolver,
    linkFormatter,
    fileManager: new FileManager(app, () => settingsManager.getSettings(), variableResolver, linkFormatter),
    imageProcessor: new ImageProcessor(app, () => settingsManager.getSettings()),
    batchProcessor: new BatchProcessor(eventBus)
  };
}

export function createPluginFeatureRegistry(features: ImageManagerFeature[]): FeatureRegistry {
  const registry = new FeatureRegistry();
  for (const feature of features) {
    registry.register(feature);
  }
  return registry;
}

export function createPluginFeatureContext(
  app: App,
  plugin: Plugin,
  services: ImageManagerServices
): ImageManagerFeatureContext {
  return {
    app,
    plugin,
    services
  };
}

export function getChangedSettingKeys(before: ImageManagerSettings, after: ImageManagerSettings): string[] {
  const changedKeys: string[] = [];
  for (const key of Object.keys(after) as (keyof ImageManagerSettings)[]) {
    if (before[key] !== after[key]) {
      changedKeys.push(key);
    }
  }
  return changedKeys;
}
