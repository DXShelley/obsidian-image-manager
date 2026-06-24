import type { App } from 'obsidian';
import type { ImageManagerSettings } from '@/types/index';

interface PluginManifestLike {
  readonly id?: string;
  readonly name?: string;
  readonly description?: string;
}

export interface PluginConflict {
  readonly feature: 'paste-handler' | 'note-rename-sync';
  readonly featureLabel: string;
  readonly pluginId: string;
  readonly pluginName: string;
  readonly description: string;
}

interface ConflictRule {
  readonly feature: PluginConflict['feature'];
  readonly featureLabel: string;
  readonly enabled: (settings: ImageManagerSettings) => boolean;
  readonly patterns: readonly RegExp[];
  readonly description: string;
}

const CONFLICT_RULES: readonly ConflictRule[] = [
  {
    feature: 'paste-handler',
    featureLabel: '粘贴接管',
    enabled: (settings) => settings.enablePasteHandler,
    patterns: [
      /paste image rename/i,
      /image auto upload/i,
      /local images plus/i,
      /custom attachment location/i,
      /attachment management/i,
      /paste[-\s]?image/i
    ],
    description: '该插件也会处理图片粘贴、附件落盘或图片上传，可能与“粘贴接管”重复处理同一张图片。'
  },
  {
    feature: 'note-rename-sync',
    featureLabel: '笔记改名同步',
    enabled: (settings) => settings.enableNoteRenameSync,
    patterns: [
      /custom attachment location/i,
      /attachment management/i,
      /file organizer/i,
      /folder notes/i,
      /attachments?/i
    ],
    description: '该插件也可能改写附件目录或跟随笔记移动附件，可能与“笔记改名同步”发生重复搬移。'
  }
] as const;

export function detectPluginConflicts(app: App, settings: ImageManagerSettings): PluginConflict[] {
  const manifests = getEnabledPluginManifests(app);
  const conflicts: PluginConflict[] = [];

  for (const manifest of manifests) {
    const searchable = `${manifest.id} ${manifest.name} ${manifest.description}`.toLowerCase();
    for (const rule of CONFLICT_RULES) {
      if (!rule.enabled(settings) || !rule.patterns.some((pattern) => pattern.test(searchable))) {
        continue;
      }

      conflicts.push({
        feature: rule.feature,
        featureLabel: rule.featureLabel,
        pluginId: manifest.id ?? manifest.name ?? 'unknown-plugin',
        pluginName: manifest.name ?? manifest.id ?? 'unknown-plugin',
        description: rule.description
      });
    }
  }

  return dedupePluginConflicts(conflicts);
}

export function formatPluginConflictNotice(conflicts: readonly PluginConflict[]): string | null {
  if (conflicts.length === 0) {
    return null;
  }

  const preview = conflicts
    .slice(0, 2)
    .map((conflict) => `${conflict.featureLabel} vs ${conflict.pluginName}`)
    .join('；');
  const suffix = conflicts.length > 2 ? `；另有 ${conflicts.length - 2} 项` : '';
  return `检测到潜在插件冲突：${preview}${suffix}。可在 Image Manager 设置的“兼容性与冲突规避”中查看。`;
}

function getEnabledPluginManifests(app: App): PluginManifestLike[] {
  const pluginsRuntime = app as App & {
    plugins?: {
      enabledPlugins?: unknown;
      manifests?: Record<string, PluginManifestLike | undefined>;
    };
  };
  const manifests = pluginsRuntime.plugins?.manifests ?? {};
  const enabledPluginIds = normalizeEnabledPluginIds(pluginsRuntime.plugins?.enabledPlugins);
  const results: PluginManifestLike[] = [];

  for (const pluginId of enabledPluginIds) {
    const manifest = manifests[pluginId];
    if (!manifest) {
      continue;
    }
    const resolvedPluginId = manifest.id ?? pluginId;
    const resolvedPluginName = manifest.name ?? pluginId;

    results.push({
      id: resolvedPluginId,
      name: resolvedPluginName,
      description: manifest.description ?? ''
    });
  }

  return results;
}

function normalizeEnabledPluginIds(value: unknown): string[] {
  if (value instanceof Set) {
    return [...value].filter((item): item is string => typeof item === 'string');
  }
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  if (value && typeof value === 'object') {
    return Object.entries(value)
      .filter((entry): entry is [string, boolean] => typeof entry[0] === 'string' && entry[1] === true)
      .map(([pluginId]) => pluginId);
  }
  return [];
}

function dedupePluginConflicts(conflicts: readonly PluginConflict[]): PluginConflict[] {
  const seen = new Set<string>();
  const results: PluginConflict[] = [];
  for (const conflict of conflicts) {
    const key = `${conflict.feature}:${conflict.pluginId}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    results.push(conflict);
  }
  return results;
}
