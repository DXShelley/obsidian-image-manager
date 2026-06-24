import { describe, expect, it } from 'vitest';
import { applyScopedCommandSortKey, sortCommandsByScope, stripScopedCommandSortKey } from '@/utils/command-order';

describe('command ordering', () => {
  it('groups same-action commands by file, folder, vault, and then other commands', () => {
    const commands = [
      { id: 'c3-compress-vault-images', name: '压缩图片' },
      { id: 'a3-compress-active-image', name: '压缩图片' },
      { id: 'c2-convert-vault-images-to-default-format', name: '转换图片为默认格式' },
      { id: 'b3-compress-current-folder-images', name: '压缩图片' },
      { id: 'custom-command', name: '其他命令' }
    ] as const;

    expect(sortCommandsByScope(commands).map((command) => command.id)).toEqual([
      'a3-compress-active-image',
      'b3-compress-current-folder-images',
      'c2-convert-vault-images-to-default-format',
      'c3-compress-vault-images',
      'custom-command'
    ]);
  });

  it('groups all scoped commands by file, folder, and vault, then sorts by action priority inside each scope', () => {
    const commands = [
      { id: 'b2-convert-current-folder-images-to-default-format', name: '转换图片为默认格式' },
      { id: 'a3-compress-active-image', name: '压缩图片' },
      { id: 'a1-update-current-note-image-links', name: '更新图片链接与目录' },
      { id: 'a2-convert-active-image-to-default-format', name: '转换图片为默认格式' },
      { id: 'c3-compress-vault-images', name: '压缩图片' },
      { id: 'b3-compress-current-folder-images', name: '压缩图片' },
      { id: 'b1-update-current-folder-image-links', name: '更新图片链接与目录' }
    ] as const;

    expect(sortCommandsByScope(commands).map((command) => command.id)).toEqual([
      'a1-update-current-note-image-links',
      'a2-convert-active-image-to-default-format',
      'a3-compress-active-image',
      'b1-update-current-folder-image-links',
      'b2-convert-current-folder-images-to-default-format',
      'b3-compress-current-folder-images',
      'c3-compress-vault-images'
    ]);
  });

  it('keeps unscoped commands after scoped command groups', () => {
    const commands = [
      { id: 'd1-undo-last-image-manager-transaction', name: '恢复：撤销上一步图片管理修改' },
      { id: 'd2-redo-last-image-manager-transaction', name: '恢复：重做上一步图片管理修改' },
      { id: 'a3-compress-active-image', name: '压缩图片' },
      { id: 'c3-compress-vault-images', name: '压缩图片' },
      { id: 'custom-command', name: '其他命令' }
    ] as const;

    expect(sortCommandsByScope(commands).map((command) => command.id)).toEqual([
      'a3-compress-active-image',
      'c3-compress-vault-images',
      'd1-undo-last-image-manager-transaction',
      'd2-redo-last-image-manager-transaction',
      'custom-command'
    ]);
  });

  it('adds hidden sort keys so Obsidian name-based sorting still groups by scope', () => {
    const commands = [
      { id: 'custom-command', name: '其他命令' },
      { id: 'c3-compress-vault-images', name: '压缩图片' },
      { id: 'b3-compress-current-folder-images', name: '压缩图片' },
      { id: 'a3-compress-active-image', name: '压缩图片' }
    ]
      .map((command) => applyScopedCommandSortKey(command))
      .sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0));

    expect(commands.map((command) => stripScopedCommandSortKey(command.name))).toEqual([
      '【单文件】压缩图片',
      '【单文件夹】压缩图片',
      '【整库】压缩图片',
      '其他命令'
    ]);
  });
});
