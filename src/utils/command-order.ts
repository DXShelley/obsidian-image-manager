export interface CommandLike {
  readonly id: string;
  readonly name: string;
}

const enum CommandScopeOrder {
  FILE = 0,
  FOLDER = 1,
  VAULT = 2,
  OTHER = 3
}

export function sortCommandsByScope<T extends CommandLike>(commands: readonly T[]): T[] {
  return commands
    .map((command, index) => ({
      command,
      index,
      scope: getCommandScopeOrder(command)
    }))
    .sort((left, right) => left.scope - right.scope || left.index - right.index)
    .map((entry) => entry.command);
}

function getCommandScopeOrder(command: CommandLike): CommandScopeOrder {
  const normalizedId = command.id.toLowerCase();
  if (normalizedId.includes('current-folder')) {
    return CommandScopeOrder.FOLDER;
  }
  if (normalizedId.includes('vault')) {
    return CommandScopeOrder.VAULT;
  }
  if (normalizedId.includes('current-note') || normalizedId.includes('current-file') || normalizedId.includes('active-image')) {
    return CommandScopeOrder.FILE;
  }

  if (command.name.startsWith('当前文件夹：')) {
    return CommandScopeOrder.FOLDER;
  }
  if (command.name.startsWith('整个仓库：')) {
    return CommandScopeOrder.VAULT;
  }
  if (command.name.startsWith('当前文件：') || command.name.startsWith('当前笔记：') || command.name.startsWith('图片：')) {
    return CommandScopeOrder.FILE;
  }

  return CommandScopeOrder.OTHER;
}
