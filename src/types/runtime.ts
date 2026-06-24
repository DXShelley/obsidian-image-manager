import type { App, Plugin } from 'obsidian';
import type { CompressionTracker } from '@/core/compression/compression-tracker';
import type { DebugLogger } from '@/core/debug/debug-logger';
import type { EventBus } from '@/core/events/event-bus';
import type { RecoveryManager } from '@/core/recovery/recovery-manager';
import type { SettingsManager } from '@/core/settings/settings-manager';
import type { BatchProcessor } from '@/features/batch/batch-processor';
import type { FileManager } from '@/services/file-manager';
import type { ImageProcessor } from '@/services/image-processor';
import type { LinkFormatter } from '@/services/link-formatter';
import type { VariableResolver } from '@/services/variable-resolver';
import type { BatchReport } from './batch';

export type FeatureState = 'implemented' | 'scaffolded';

export interface ImageManagerEventMap {
  'batch:progress': BatchReport;
  'batch:completed': BatchReport;
  'batch:state-changed': BatchReport;
}

export interface ImageManagerServices {
  readonly settings: SettingsManager;
  readonly eventBus: EventBus<ImageManagerEventMap>;
  readonly logger: DebugLogger;
  readonly compressionTracker: CompressionTracker;
  readonly variableResolver: VariableResolver;
  readonly fileManager: FileManager;
  readonly recovery: RecoveryManager;
  readonly imageProcessor: ImageProcessor;
  readonly linkFormatter: LinkFormatter;
  readonly batchProcessor: BatchProcessor;
}

export interface ImageManagerFeatureContext {
  readonly app: App;
  readonly plugin: Plugin;
  readonly services: ImageManagerServices;
}

export interface ImageManagerFeature {
  readonly id: string;
  readonly name: string;
  readonly summary: string;
  readonly state: FeatureState;
  register(context: ImageManagerFeatureContext): Promise<void> | void;
}
