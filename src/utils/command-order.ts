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

const SCOPED_COMMAND_DISPLAY_LABEL = {
  FILE: '【单文件】',
  FOLDER: '【单文件夹】',
  VAULT: '【整库】'
} as const;

const enum CommandScopeOrder {
  FILE = 0,
  FOLDER = 1,
  VAULT = 2,
  RECOVERY = 3,
  OTHER = 4
}

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

export function applyScopedCommandSortKey<T extends CommandLike>(command: T): T {
  const meta = getCommandSortMeta(command);
  const prefix = getScopedCommandSortKey(meta.scope);
  const displayName = formatScopedCommandNameForPalette(command.name, meta.scope);
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

function formatScopedCommandNameForPalette(commandName: string, scope: CommandScopeOrder): string {
  const label = getScopedCommandDisplayLabel(scope);
  const trimmedName = stripVisibleScopedCommandPrefix(stripExplicitCommandOrderPrefix(commandName)).trim();
  if (!label) {
    return trimmedName;
  }

  return trimmedName.startsWith(label) ? trimmedName : `${label}${trimmedName}`;
}

function getScopedCommandDisplayLabel(scope: CommandScopeOrder): string {
  switch (scope) {
    case CommandScopeOrder.FILE:
      return SCOPED_COMMAND_DISPLAY_LABEL.FILE;
    case CommandScopeOrder.FOLDER:
      return SCOPED_COMMAND_DISPLAY_LABEL.FOLDER;
    case CommandScopeOrder.VAULT:
      return SCOPED_COMMAND_DISPLAY_LABEL.VAULT;
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
  prefix: string;
} | null {
  const scopePrefixes: readonly {
    readonly prefixes: readonly string[];
    readonly scope: CommandScopeOrder;
  }[] = [
    {
      prefixes: ['【单文件】', '单文件：', '当前文件：', '当前笔记：', '图片：'],
      scope: CommandScopeOrder.FILE
    },
    {
      prefixes: ['【单文件夹】', '单文件夹：', '当前文件夹：'],
      scope: CommandScopeOrder.FOLDER
    },
    {
      prefixes: ['【整库】', '整库：', '整个仓库：'],
      scope: CommandScopeOrder.VAULT
    }
  ];

  for (const { prefixes, scope } of scopePrefixes) {
    for (const prefix of prefixes) {
      if (commandName.startsWith(prefix)) {
        return {
          scope,
          prefix
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
    return commandName.slice(parsed.prefix.length);
  }

  for (const label of Object.values(SCOPED_COMMAND_DISPLAY_LABEL)) {
    if (commandName.startsWith(label)) {
      return commandName.slice(label.length);
    }
  }

  return commandName;
}
