import { describe, expect, it } from 'vitest';
import { sortCommandsByScope } from '@/utils/command-order';

describe('command ordering', () => {
  it('groups plugin commands by file, folder, vault, and then other commands', () => {
    const commands = [
      { id: 'convert-vault-images-to-default-format', name: '整个仓库：转换为默认格式' },
      { id: 'open-current-note-gallery', name: '当前笔记：打开图片画廊' },
      { id: 'compress-current-folder-images', name: '当前文件夹：压缩图片' },
      { id: 'rotate-active-image-90', name: '图片：顺时针旋转 90°' },
      { id: 'custom-command', name: '其他命令' }
    ] as const;

    expect(sortCommandsByScope(commands).map((command) => command.id)).toEqual([
      'open-current-note-gallery',
      'rotate-active-image-90',
      'compress-current-folder-images',
      'convert-vault-images-to-default-format',
      'custom-command'
    ]);
  });

  it('preserves insertion order inside the same scope group', () => {
    const commands = [
      { id: 'compress-active-image', name: '当前文件：压缩图片' },
      { id: 'convert-active-image-to-default-format', name: '当前文件：批量转换所有图片为默认格式' },
      { id: 'resize-active-image-to-1920px', name: '图片：缩放到 1920px 边界' }
    ] as const;

    expect(sortCommandsByScope(commands).map((command) => command.id)).toEqual([
      'compress-active-image',
      'convert-active-image-to-default-format',
      'resize-active-image-to-1920px'
    ]);
  });
});
