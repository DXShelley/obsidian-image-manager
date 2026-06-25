import { describe, expect, it } from 'vitest';
import { applyScopedCommandSortKey, sortCommandsByScope, stripScopedCommandSortKey } from '@/utils/command-order';

describe('command ordering', () => {
  it('groups same-action commands by file, folder, vault, and then other commands', () => {
    const commands = [
      { id: 'c4-compress-vault-images', name: '压缩图片' },
      { id: 'a4-compress-active-image', name: '压缩图片' },
      { id: 'c3-convert-vault-images-to-default-format', name: '转换图片为默认格式' },
      { id: 'b4-compress-current-folder-images', name: '压缩图片' },
      { id: 'custom-command', name: '其他命令' }
    ] as const;

    expect(sortCommandsByScope(commands).map((command) => command.id)).toEqual([
      'a4-compress-active-image',
      'b4-compress-current-folder-images',
      'c3-convert-vault-images-to-default-format',
      'c4-compress-vault-images',
      'custom-command'
    ]);
  });

  it('groups all scoped commands by file, folder, and vault, then sorts by action priority inside each scope', () => {
    const commands = [
      { id: 'b3-convert-current-folder-images-to-default-format', name: '转换图片为默认格式' },
      { id: 'a4-compress-active-image', name: '压缩图片' },
      { id: 'a1-update-current-note-image-links', name: '更新图片链接与目录' },
      { id: 'a2-import-current-note-external-images', name: '下载外部图片到本地' },
      { id: 'a3-convert-active-image-to-default-format', name: '转换图片为默认格式' },
      { id: 'a5-delete-current-note-extra-images', name: '删除多余图片文件' },
      { id: 'c4-compress-vault-images', name: '压缩图片' },
      { id: 'c5-delete-vault-extra-images', name: '删除多余图片文件' },
      { id: 'b4-compress-current-folder-images', name: '压缩图片' },
      { id: 'b1-update-current-folder-image-links', name: '更新图片链接与目录' },
      { id: 'b2-import-current-folder-external-images', name: '下载外部图片到本地' },
      { id: 'b5-delete-current-folder-extra-images', name: '删除多余图片文件' }
    ] as const;

    expect(sortCommandsByScope(commands).map((command) => command.id)).toEqual([
      'a1-update-current-note-image-links',
      'a2-import-current-note-external-images',
      'a3-convert-active-image-to-default-format',
      'a4-compress-active-image',
      'a5-delete-current-note-extra-images',
      'b1-update-current-folder-image-links',
      'b2-import-current-folder-external-images',
      'b3-convert-current-folder-images-to-default-format',
      'b4-compress-current-folder-images',
      'b5-delete-current-folder-extra-images',
      'c4-compress-vault-images',
      'c5-delete-vault-extra-images'
    ]);
  });

  it('keeps unscoped commands after scoped command groups', () => {
    const commands = [
      { id: 'd1-undo-last-image-manager-transaction', name: '撤销图片修改' },
      { id: 'd2-redo-last-image-manager-transaction', name: '重做图片修改' },
      { id: 'a4-compress-active-image', name: '压缩图片' },
      { id: 'c4-compress-vault-images', name: '压缩图片' },
      { id: 'custom-command', name: '其他命令' }
    ] as const;

    expect(sortCommandsByScope(commands).map((command) => command.id)).toEqual([
      'a4-compress-active-image',
      'c4-compress-vault-images',
      'd1-undo-last-image-manager-transaction',
      'd2-redo-last-image-manager-transaction',
      'custom-command'
    ]);
  });

  it('adds hidden sort keys so Obsidian name-based sorting still groups by scope', () => {
    const commands = [
      { id: 'custom-command', name: '其他命令' },
      { id: 'c4-compress-vault-images', name: '压缩图片' },
      { id: 'b4-compress-current-folder-images', name: '压缩图片' },
      { id: 'a4-compress-active-image', name: '压缩图片' }
    ]
      .map((command) => applyScopedCommandSortKey(command))
      .sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0));

    expect(commands.map((command) => stripScopedCommandSortKey(command.name))).toEqual([
      '压缩图片【单文件】',
      '压缩图片【单文件夹】',
      '压缩图片【整库】',
      '其他命令'
    ]);
  });

  it('normalizes existing scoped prefixes to suffixes for palette display', () => {
    expect(stripScopedCommandSortKey(applyScopedCommandSortKey({ id: 'a4-compress-active-image', name: '【单文件】压缩图片' }).name)).toBe(
      '压缩图片【单文件】'
    );
    expect(
      stripScopedCommandSortKey(applyScopedCommandSortKey({ id: 'b4-compress-current-folder-images', name: '压缩图片【单文件夹】' }).name)
    ).toBe('压缩图片【单文件夹】');
    expect(stripScopedCommandSortKey(applyScopedCommandSortKey({ id: 'c4-compress-vault-images', name: '【整库】压缩图片' }).name)).toBe(
      '压缩图片【整库】'
    );
  });

  it('only treats bracketed scope labels as supported suffixes', () => {
    expect(stripScopedCommandSortKey(applyScopedCommandSortKey({ id: 'custom-command', name: '整理当前笔记：' }).name)).toBe('整理当前笔记：');
  });

  it('uses localized English scope suffixes when requested', () => {
    const commands = [
      { id: 'c4-compress-vault-images', name: 'Compress images' },
      { id: 'b4-compress-current-folder-images', name: 'Compress images' },
      { id: 'a4-compress-active-image', name: 'Compress images' }
    ].map((command) => applyScopedCommandSortKey(command, 'en'));

    expect(commands.map((command) => stripScopedCommandSortKey(command.name))).toEqual([
      'Compress images【Vault】',
      'Compress images【Folder】',
      'Compress images【File】'
    ]);
  });

  it('falls back to default scope labels for invalid language values', () => {
    const command = applyScopedCommandSortKey(
      { id: 'a4-compress-active-image', name: '压缩图片' },
      'fr' as never
    );

    expect(stripScopedCommandSortKey(command.name)).toBe('压缩图片【单文件】');
  });
});
