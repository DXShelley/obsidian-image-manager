import { getNoticeCopy, getUiCopy } from '@/i18n';
import type { App } from 'obsidian';
import { resolveUiLanguage, type ImageManagerSettings } from '@/types/index';

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
  readonly enabled: (settings: ImageManagerSettings) => boolean;
  readonly patterns: readonly RegExp[];
}

const CONFLICT_RULES: readonly ConflictRule[] = [
  {
    feature: 'paste-handler',
    enabled: (settings) => settings.enablePasteHandler,
    patterns: [
      /paste image rename/i,
      /image auto upload/i,
      /local images plus/i,
      /custom attachment location/i,
      /attachment management/i,
      /paste[-\s]?image/i
    ]
  },
  {
    feature: 'note-rename-sync',
    enabled: (settings) => settings.enableNoteRenameSync,
    patterns: [
      /custom attachment location/i,
      /attachment management/i,
      /file organizer/i,
      /folder notes/i,
      /attachments?/i
    ]
  }
] as const;

export function detectPluginConflicts(app: App, settings: ImageManagerSettings): PluginConflict[] {
  const manifests = getEnabledPluginManifests(app);
  const conflicts: PluginConflict[] = [];
  const ui = getUiCopy(resolveUiLanguage(settings.uiLanguage));

  for (const manifest of manifests) {
    const searchable = `${manifest.id} ${manifest.name} ${manifest.description}`.toLowerCase();
    for (const rule of CONFLICT_RULES) {
      if (!rule.enabled(settings) || !rule.patterns.some((pattern) => pattern.test(searchable))) {
        continue;
      }

      conflicts.push({
        feature: rule.feature,
        featureLabel: ui.conflicts.featureLabels[rule.feature],
        pluginId: manifest.id ?? manifest.name ?? 'unknown-plugin',
        pluginName: manifest.name ?? manifest.id ?? 'unknown-plugin',
        description: ui.conflicts.descriptions[rule.feature]
      });
    }
  }

  return dedupePluginConflicts(conflicts);
}

export function formatPluginConflictNotice(
  conflicts: readonly PluginConflict[],
  language: ImageManagerSettings['uiLanguage'] = 'zh-CN'
): string | null {
  if (conflicts.length === 0) {
    return null;
  }

  const notices = getNoticeCopy(resolveUiLanguage(language));
  const preview = conflicts
    .slice(0, 2)
    .map((conflict) => notices.pluginConflictPreviewItem(conflict.featureLabel, conflict.pluginName))
    .join(resolveUiLanguage(language) === 'en' ? '; ' : '；');
  const suffix = conflicts.length > 2 ? notices.pluginConflictMore(conflicts.length - 2) : '';
  return notices.pluginConflictSummary(preview, suffix);
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
