import {
  DEFAULT_UI_LANGUAGE,
  getCommandScopeAliases,
  getCommandScopeCopy,
  getCommandScopeDisplayLabels,
  type CommandScopeLabelKey,
  type UiLanguage
} from '@/i18n';

export interface CommandLike {
  readonly id: string;
  readonly name: string;
}

interface CommandSortMeta {
  scope: CommandScopeOrder;
  actionOrder: number;
}

const SCOPED_COMMAND_SORT_PREFIX = {
  FILE: '\u200B',
  FOLDER: '\u200C',
  VAULT: '\u200D',
  OTHER: ''
} as const;

const enum CommandScopeOrder {
  FILE = 0,
  FOLDER = 1,
  VAULT = 2,
  RECOVERY = 3,
  OTHER = 4
}

const COMMAND_SCOPE_ORDER_BY_KEY: Readonly<Record<CommandScopeLabelKey, CommandScopeOrder>> = {
  FILE: CommandScopeOrder.FILE,
  FOLDER: CommandScopeOrder.FOLDER,
  VAULT: CommandScopeOrder.VAULT
};

export function sortCommandsByScope<T extends CommandLike>(commands: readonly T[]): T[] {
  return commands
    .map((command, index) => ({
      command,
      index,
      ...getCommandSortMeta(command)
    }))
    .sort((left, right) => {
      const leftGroupOrder = left.scope === CommandScopeOrder.OTHER ? 1 : 0;
      const rightGroupOrder = right.scope === CommandScopeOrder.OTHER ? 1 : 0;

      return (
        leftGroupOrder - rightGroupOrder ||
        left.scope - right.scope ||
        left.actionOrder - right.actionOrder ||
        left.index - right.index
      );
    })
    .map((entry) => entry.command);
}

export function applyScopedCommandSortKey<T extends CommandLike>(command: T, language: UiLanguage = DEFAULT_UI_LANGUAGE): T {
  const meta = getCommandSortMeta(command);
  const prefix = getScopedCommandSortKey(meta.scope);
  const displayName = formatScopedCommandNameForPalette(command.name, meta.scope, language);
  const nextName = `${prefix}${displayName}`;
  if (command.name === nextName) {
    return command;
  }

  return {
    ...command,
    name: nextName
  };
}

export function stripScopedCommandSortKey(commandName: string): string {
  return commandName.replace(/^[\u200B\u200C\u200D]+/, '');
}

function getScopedCommandSortKey(scope: CommandScopeOrder): string {
  switch (scope) {
    case CommandScopeOrder.FILE:
      return SCOPED_COMMAND_SORT_PREFIX.FILE;
    case CommandScopeOrder.FOLDER:
      return SCOPED_COMMAND_SORT_PREFIX.FOLDER;
    case CommandScopeOrder.VAULT:
      return SCOPED_COMMAND_SORT_PREFIX.VAULT;
    case CommandScopeOrder.OTHER:
    default:
      return SCOPED_COMMAND_SORT_PREFIX.OTHER;
  }
}

function formatScopedCommandNameForPalette(commandName: string, scope: CommandScopeOrder, language: UiLanguage): string {
  const label = getScopedCommandDisplayLabel(scope, language);
  const trimmedName = stripVisibleScopedCommandPrefix(stripExplicitCommandOrderPrefix(commandName)).trim();
  if (!label) {
    return trimmedName;
  }

  return trimmedName.endsWith(label) ? trimmedName : `${trimmedName}${label}`;
}

function getScopedCommandDisplayLabel(scope: CommandScopeOrder, language: UiLanguage): string {
  const labels = getCommandScopeCopy(language).displayLabels;
  switch (scope) {
    case CommandScopeOrder.FILE:
      return labels.FILE;
    case CommandScopeOrder.FOLDER:
      return labels.FOLDER;
    case CommandScopeOrder.VAULT:
      return labels.VAULT;
    case CommandScopeOrder.OTHER:
    default:
      return '';
  }
}

function getCommandSortMeta(command: CommandLike): {
  scope: CommandScopeOrder;
  actionOrder: number;
} {
  const explicitPrefix = parseExplicitCommandOrderPrefix(command.name) ?? parseExplicitCommandOrderPrefix(command.id);
  if (explicitPrefix) {
    return explicitPrefix;
  }

  const parsedName = parseScopedCommandName(command.name);
  if (parsedName) {
    return {
      scope: parsedName.scope,
      actionOrder: Number.MAX_SAFE_INTEGER
    };
  }

  const normalizedId = command.id.toLowerCase();
  if (normalizedId.includes('current-folder')) {
    return {
      scope: CommandScopeOrder.FOLDER,
      actionOrder: Number.MAX_SAFE_INTEGER
    };
  }
  if (normalizedId.includes('vault')) {
    return {
      scope: CommandScopeOrder.VAULT,
      actionOrder: Number.MAX_SAFE_INTEGER
    };
  }
  if (normalizedId.includes('current-note') || normalizedId.includes('current-file') || normalizedId.includes('active-image')) {
    return {
      scope: CommandScopeOrder.FILE,
      actionOrder: Number.MAX_SAFE_INTEGER
    };
  }

  return {
    scope: CommandScopeOrder.OTHER,
    actionOrder: Number.MAX_SAFE_INTEGER
  };
}

function parseExplicitCommandOrderPrefix(value: string): CommandSortMeta | null {
  const match = /^(a|b|c)(\d+)(?=$|[\s\-_/：:])/i.exec(value.trim());
  const recoveryMatch = /^(d)(\d+)(?=$|[\s\-_/：:])/i.exec(value.trim());
  const resolvedMatch = match ?? recoveryMatch;
  if (!resolvedMatch) {
    return null;
  }

  const [, rawScope, rawActionOrder] = resolvedMatch;
  if (!rawScope || !rawActionOrder) {
    return null;
  }

  const scopeMap: Record<string, CommandScopeOrder> = {
    a: CommandScopeOrder.FILE,
    b: CommandScopeOrder.FOLDER,
    c: CommandScopeOrder.VAULT,
    d: CommandScopeOrder.RECOVERY
  };
  const scope = scopeMap[rawScope.toLowerCase()];
  if (scope === undefined) {
    return null;
  }

  return {
    scope,
    actionOrder: Number.parseInt(rawActionOrder, 10)
  };
}

function parseScopedCommandName(commandName: string): {
  scope: CommandScopeOrder;
  marker: string;
} | null {
  const scopeAliases = getCommandScopeAliases();

  for (const scope of Object.keys(scopeAliases) as CommandScopeLabelKey[]) {
    for (const marker of scopeAliases[scope]) {
      if (commandName.startsWith(marker) || (isScopedDisplayLabel(marker) && commandName.endsWith(marker))) {
        return {
          scope: COMMAND_SCOPE_ORDER_BY_KEY[scope],
          marker
        };
      }
    }
  }

  return null;
}

function stripExplicitCommandOrderPrefix(value: string): string {
  return value.replace(/^(?:[a-d]\d+)(?=$|[\s\-_/：:])[\s：:]*/i, '');
}

function stripVisibleScopedCommandPrefix(commandName: string): string {
  const parsed = parseScopedCommandName(commandName);
  if (parsed) {
    if (commandName.startsWith(parsed.marker)) {
      return commandName.slice(parsed.marker.length);
    }

    return commandName.slice(0, -parsed.marker.length);
  }

  for (const label of getCommandScopeDisplayLabels()) {
    if (commandName.startsWith(label)) {
      return commandName.slice(label.length);
    }
    if (commandName.endsWith(label)) {
      return commandName.slice(0, -label.length);
    }
  }

  return commandName;
}

function isScopedDisplayLabel(value: string): boolean {
  return getCommandScopeDisplayLabels().includes(value);
}
