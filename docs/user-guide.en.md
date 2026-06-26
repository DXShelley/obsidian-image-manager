[中文](user-guide.md) | [English](user-guide.en.md) | [Docs Index](README.en.md)

# User Guide

## Commands

- Scoped commands are ordered by the `a1-a5`, `b1-b5`, and `c1-c5` `id` groups and display `【单文件】`, `【单文件夹】`, and `【整库】` as command-name suffixes, with `update links -> import external images -> convert format -> compress -> delete extra image files` inside each scope.
- `更新图片链接与目录【单文件】`
- `下载外部图片到本地【单文件】`
- `转换图片为默认格式【单文件】`
- `压缩图片【单文件】`
- `删除多余图片文件【单文件】`
- `更新图片链接与目录【单文件夹】`
- `下载外部图片到本地【单文件夹】`
- `转换图片为默认格式【单文件夹】`
- `压缩图片【单文件夹】`
- `删除多余图片文件【单文件夹】`
- `更新图片链接与目录【整库】`
- `下载外部图片到本地【整库】`
- `转换图片为默认格式【整库】`
- `压缩图片【整库】`
- `删除多余图片文件【整库】`
- `恢复：撤销上一步图片管理修改`
- `恢复：重做上一步图片管理修改`
- `打开当前图片画廊`
- `打开图片画廊【单文件】`
- `打开图片画廊【单文件夹】`

## Context Menu

Right-click an image file in the file explorer to access:

- Copy image to clipboard
- Compress image
- Convert to default format
- Drag-to-crop
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
- `Download external images to local` imports `URL`, `file://`, and `data:image/...;base64,...` sources from a note into the managed folder and rewrites those links to local image links; explicit import flows also accept extensionless or dynamic image endpoints when the response headers confirm an image payload.
- The command-palette `下载外部图片到本地【单文件】` command processes every external image link in the current note.
- In reading view, right-clicking a rendered external image shows `下载该外部图片到本地`, which imports only that selected image source.

## Compatibility Strategy

- Treat image paste as a single-owner workflow. If `enablePasteHandler` is on, let Note Image Manager own paste capture, file placement, and auto-convert; if you rely more on Obsidian's native attachment flow or another paste plugin, turn this plugin's paste takeover off.
- Treat note rename or move follow-up as another single-owner workflow. If another attachment-management plugin is already relocating folders or rewriting links, turn off `enableNoteRenameSync` to avoid duplicate moves and renames.
- Prefer safely relocatable managed-folder templates such as `./assets/${noteFileName}` or `./assets/{noteName}`. Relative or note-scoped templates are easier to keep in sync when notes move and safer for scoped cleanup.
- If `outputFolder` points to a fixed shared library such as `Attachments/Images`, use it as a shared pool instead of enabling note-rename sync. That reduces overlap with plugins such as `Attachment Management`, `Custom Attachment Location`, and `File Organizer`.
- When you need better compatibility with external Markdown tooling, publishing pipelines, or sync flows, prefer `Markdown` links with the `AUTO` or `ENCODED` path strategy. Use `Wiki` links and shortest-unique paths mainly for Obsidian-first vaults.
- Keep asset detection separate from in-place editing guarantees. Formats such as `AVIF`, `HEIC`, `TIFF`, and `SVG` can be recognized, imported, or used as conversion inputs without implying that every in-place compress, crop, rotate, or resize path is equally safe.
- Reading-view image enhancements should stay additive rather than replacing native behavior. If you rely on Obsidian's default image click selection, keep `disableObsidianImageSelectionOnClick` turned off and use double-click gallery entry as the extra interaction.
- Turn on `deleteOrphanImages` only after your attachment boundaries and reference patterns are stable. If your vault still uses Canvas, nonstandard embeds, or external scripts that read images directly, leave it off.
- Start with commands ending in `【单文件】` and `【单文件夹】` before running commands ending in `【整库】` so you can verify link rewrites and folder moves incrementally.
- Use the settings page's compatibility section as the routine checkpoint. When paste, attachment-management, or file-organization plugins are enabled together, decide which plugin owns each workflow before you run bulk cleanup.

## Settings Page

- The top of the settings page now includes an `Interface Language` switch for Simplified Chinese and English.
- The save-location editor and generated-file-name editor appear at the top of the settings page.
- Both fields include a live preview block.
- `Enable detailed debug logging` is off by default. When enabled, the plugin writes developer-console logs prefixed with `[Note Image Manager]` for command start, completion, skip, failure, and key processing branches. Error logs pass the `Error` object as a direct console argument so the stack is easy to expand.
- The `Feature Status` section shows both shipped and planned capabilities; watermark removal is currently listed only as planned.
- On older Obsidian builds, the plugin skips inline field-error rendering instead of crashing the entire settings page.

## Diagnostic Logging

- Detailed debug logging is a Note Image Manager setting and does not depend on Obsidian debug mode.
- When enabled, normal commands write `Command started` and `Command completed`; failed commands write `Command failed` with the error object and command context.
- Paste, compression, conversion, batch processing, context menus, recovery transactions, note rename sync, and other key paths add extra context such as command ID, note path, image path, ignore regex, skip reason, or failure reason.
- After the setting is turned off, detailed logs stop. A single `Debug logging disabled` line is written when the setting changes so you can confirm the toggle took effect.

## Refresh Behavior

- Rotate, flip, crop, compress, and convert operations update the image file immediately.
- For `AVIF`, the plugin currently guarantees recognition, import, and conversion input only. Convert it to `PNG`, `JPEG`, or `WebP` before trying in-place crop, compress, rotate, flip, or resize operations.
- If the image is embedded in a Markdown note, the plugin attempts to rerender that note preview automatically.
- Scoped batch-style commands defer Markdown rerenders so a run ends with one summary notice and one preview refresh.
- The current-file conversion command operates on the active Markdown note and processes each referenced image at most once.
- If different source formats would convert to the same target name, such as `aaa.png` and `aaa.jpg` to `webp`, the plugin appends suffixes like `-1` and `-2` automatically.
- All `...【整库】` commands show a risk confirmation before execution.

## Recovery

- Note Image Manager records snapshots for file-content changes, path changes, and Markdown rewrites before applying a managed operation.
- The undo command restores the latest transaction in reverse order, including images, note links, and files created by paste / import flows.
- The redo command reapplies the most recently undone transaction so you can move back and forth across recent operations.
- Recovery history is stored in `.obsidian/plugins/note-image-manager/recovery/`.
- `.gitignore` ignores `.obsidian/plugins/note-image-manager/recovery/` by default so local recovery snapshots do not enter version control.
- To save space, only the newest 10 transactions are retained and transactions older than 24 hours are pruned automatically.

## Deployment Note

- After rebuilding locally, recopy `manifest.json`, `main.js`, and `styles.css` into `.obsidian/plugins/note-image-manager/` before retesting in Obsidian.
