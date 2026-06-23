# User Guide

## Commands

- `当前文件：压缩图片`
- `当前文件夹：压缩图片`
- `整个仓库：压缩图片`
- `当前文件：批量转换所有图片为默认格式`
- `当前文件夹：转换为默认格式`
- `整个仓库：转换为默认格式`
- `当前笔记：更新图片链接与目录`
- `当前文件夹：更新图片链接与目录`
- `整个仓库：更新图片链接与目录`
- `当前笔记：打开图片画廊`
- `当前文件夹：打开图片画廊`
- `图片：顺时针旋转 90°`
- `图片：水平翻转`
- `图片：缩放到 1920px 边界`

## Context menu

Right-click an image file in the file explorer to access:

- Copy image to clipboard
- Compress image
- Convert to WebP
- Rotate 90 degrees
- Flip horizontal
- Flip vertical

## Gallery

- Open note or folder galleries from the command palette.
- Use the search box to filter image names.
- Use the sort dropdown to switch between newest, name, and size order.
- Use the grid/list toggle to switch presentation.

## Rename and save rules

- `renamePattern` supports variables from `docs/variables.md`.
- `outputFolder` supports note-scoped templates such as `./assets/${noteFileName}`.
- `outputFolder` is only used when `enablePasteHandler` is enabled and this plugin is handling the image paste flow.
- If `{noteName}` and `{date}` resolve to the same value, adjacent duplicates are collapsed automatically.
- If `renamePattern` contains `{time}`, collision handling uses ordered suffixes such as `-01`, `-02`, and `-03`.
- If a note is renamed or moved, managed image folders can be synchronized automatically.

## Settings page

- The save-location editor and generated-file-name editor are shown at the top of the settings page.
- Both fields include a live preview block.
- On older Obsidian builds, the plugin skips inline field-error rendering instead of crashing the entire settings page.

## Refresh behavior

- Rotate, flip, resize, compress, and convert operations update the image file immediately.
- If the image is embedded in a Markdown note, the plugin attempts to rerender the note preview automatically.
- Current-file conversion operates on the active Markdown note and processes each referenced image at most once.

## Deployment note

- After rebuilding locally, recopy `manifest.json`, `main.js`, and `styles.css` into `.obsidian/plugins/obsidian-image-manager/` before retesting inside Obsidian.
