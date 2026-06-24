[中文](user-guide.md) | [English](user-guide.en.md) | [Docs Index](README.en.md)

# User Guide

## Commands

- Scoped commands are ordered by the `a1-a3`, `b1-b3`, and `c1-c3` `id` groups for `【单文件】`, `【单文件夹】`, and `【整库】`, with `update links -> convert format -> compress` inside each scope.
- `【单文件】更新图片链接与目录`
- `【单文件】转换图片为默认格式`
- `【单文件】压缩图片`
- `【单文件夹】更新图片链接与目录`
- `【单文件夹】转换图片为默认格式`
- `【单文件夹】压缩图片`
- `【整库】更新图片链接与目录`
- `【整库】转换图片为默认格式`
- `【整库】压缩图片`
- `恢复：撤销上一步图片管理修改`
- `恢复：重做上一步图片管理修改`
- `打开当前图片画廊`
- `【单文件】打开图片画廊`
- `【单文件夹】打开图片画廊`

## Context Menu

Right-click an image file in the file explorer to access:

- Copy image to clipboard
- Compress image
- Convert to WebP
- Rotate 90 degrees
- Flip horizontal
- Flip vertical

## Gallery

- Open note-level or folder-level galleries from the command palette.
- You can also open the gallery from an image file, the file-explorer context menu, or by double-clicking an image in reading view.
- When the source note can be identified, the gallery loads every image from that note and preselects the current one.
- Use the search box to filter by image name.
- Use the sort dropdown to switch between newest, name, and size ordering.
- Use the grid / list toggle to switch presentation.

## Rename And Save Rules

- `renamePattern` supports the variables listed in [Variable Reference](variables.en.md).
- `outputFolder` supports note-scoped templates such as `./assets/${noteFileName}`.
- `outputFolder` is only used when `enablePasteHandler` is enabled and this plugin is handling the paste flow.
- If `{noteName}` and `{date}` resolve to the same value, adjacent duplicate fragments are collapsed automatically.
- If `renamePattern` contains `{time}`, collision handling uses ordered suffixes such as `-01`, `-02`, and `-03`.
- When a note is renamed or moved, managed image folders can be synchronized automatically.

## Settings Page

- The save-location editor and generated-file-name editor appear at the top of the settings page.
- Both fields include a live preview block.
- On older Obsidian builds, the plugin skips inline field-error rendering instead of crashing the entire settings page.

## Refresh Behavior

- Rotate, flip, resize, compress, and convert operations update the image file immediately.
- If the image is embedded in a Markdown note, the plugin attempts to rerender that note preview automatically.
- Scoped batch-style commands defer Markdown rerenders so a run ends with one summary notice and one preview refresh.
- The current-file conversion command operates on the active Markdown note and processes each referenced image at most once.
- If different source formats would convert to the same target name, such as `aaa.png` and `aaa.jpg` to `webp`, the plugin appends suffixes like `-1` and `-2` automatically.
- All `【整库】...` commands show a risk confirmation before execution.

## Recovery

- Image Manager records snapshots for file-content changes, path changes, and Markdown rewrites before applying a managed operation.
- The undo command restores the latest transaction in reverse order, including images, note links, and files created by paste / import flows.
- The redo command reapplies the most recently undone transaction so you can move back and forth across recent operations.
- Recovery history is stored in `.obsidian/plugins/obsidian-image-manager/recovery/`.
- `.gitignore` ignores `.obsidian/plugins/obsidian-image-manager/recovery/` by default so local recovery snapshots do not enter version control.
- To save space, only the newest 10 transactions are retained and transactions older than 24 hours are pruned automatically.

## Deployment Note

- After rebuilding locally, recopy `manifest.json`, `main.js`, and `styles.css` into `.obsidian/plugins/obsidian-image-manager/` before retesting in Obsidian.
