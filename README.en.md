[中文](README.md) | [English](README.en.md)

# Obsidian Image Manager

`Obsidian Image Manager` is an image-management plugin for Obsidian. `v3.1.0` focuses on practical image workflows, bilingual settings, and a clearer release-facing presentation.

## Philosophy

- Solve the image problems that appear frequently in real Obsidian use, and solve them well enough to stay out of the way.
- Keep the experience pleasant, but do not drag the project into maintenance entropy through over-design.
- Ship features only when their quality is acceptable; keep the rest explicitly marked as planned.

## Project Overview

- `src/app`: plugin runtime composition, built-in feature catalog, and startup wiring.
- `src/core`: settings management, event bus, and feature registry.
- `src/features`: rename, compress, convert, preview, editor, gallery, batch, resize, align, and context menu modules.
- `src/services`: image processing, file management, variable resolution, and link formatting services.
- `src/types`: settings, images, batch jobs, runtime contracts, and shared result types.
- `src/ui`: settings-tab and modal components.
- `src/utils`: platform, path, and lightweight validation helpers.

## Current Capabilities

- Automatically save images pasted into notes to a configurable folder.
- Support note-scoped folder rules such as `./assets/${noteFileName}`.
- Convert pasted images to the configured default format.
- Generate file names with variables such as `{noteName}`, `{fileName}`, `{date}`, `{time}`, and `{random}`.
- Insert image links as either Obsidian Wiki links or standard Markdown links.
- Batch-convert all images referenced by the current note.
- Run link-update, format-conversion, compression, and orphan-image cleanup commands against the current file, current folder, or entire vault.
- Sort scoped commands by the `a1-a4`, `b1-b4`, and `c1-c4` `id` order, while displaying them as `【单文件】`, `【单文件夹】`, and `【整库】` in the command palette.
- Prompt for confirmation before any vault-wide command runs.
- Make current-note conversion and compression commands process every image referenced by the active Markdown note instead of only the active image file.
- Provide active-image commands for rotate, flip, and resize-to-1920px so the current image can also be processed from the command palette.
- Pause, resume, or cancel active batch jobs.
- Use image context-menu actions for copy, compress, convert, rotate, horizontal or vertical flip, and drag-to-crop.
- Open current-image, note-level, or folder-level galleries with filtering, sorting, grid/list toggles, and reading-view double-click entry points.
- Sync managed image folders when notes are renamed or moved, with optional image file renaming.
- During orphan cleanup, relocate images that still have a single external note referrer into that note's managed folder instead of deleting them.
- Handle name collisions safely with ordered suffixes such as `-01` and `-02` when time-based naming is used.
- When format conversion would collapse different source formats into the same name, such as `aaa.png` and `aaa.jpg` to `webp`, generate unique names like `aaa.webp` and `aaa-1.webp`.
- Support encoded, readable-wrapped, and automatic Markdown path presentation strategies so Chinese, spaces, parentheses, and already-encoded paths can coexist.
- Persist compression history for the current file version to avoid recompressing already-processed or non-beneficial outputs.
- Persist recovery transactions for image and Markdown changes, and support undo / redo for recent Image Manager operations.
- Switch the settings page and feature-status panel between Simplified Chinese and English, with Chinese as the default.

## Planned Capabilities

- Drag-to-resize image display inside the editor
- Watermark removal / object repair, only after quality and interaction reach a practical bar
- OCR, search, and categorization
- Worker-based background processing

## Documentation

- [Docs Index](docs/README.en.md)
- [User Guide](docs/user-guide.en.md)
- [Architecture](docs/architecture.en.md)
- [API Reference](docs/api-reference.en.md)
- [Variable Reference](docs/variables.en.md)
- [Test Cases](docs/test-cases.en.md)
- [Task Status](docs/task-status.en.md)
- [TypeScript Guide](docs/typescript-guide.en.md)
- [Changelog](CHANGELOG.en.md)

## Acknowledgements and References

- [Obsidian](https://obsidian.md/): provides the plugin runtime, editor surface, and vault model that this project builds on.
- [Custom Attachment Location](https://github.com/mnaoumov/obsidian-custom-attachment-location): several attachment-folder template and cleanup behaviors in this plugin were designed with reference to parts of its UX semantics.
- [obsidian-image-converter](https://github.com/xRyul/obsidian-image-converter): this project also learned from its product thinking around image-processing boundaries, command organization, and practical scope.
- These references document inspiration and behavioral intent, not a promise of full compatibility.

## Release

- Version: `3.1.0`
- Minimum Obsidian version: `0.15.0`
- Release workflow: push a `v*` tag to trigger `.github/workflows/release.yml`
- Release artifacts: `manifest.json`, `main.js`, `styles.css`

## Recovery

- Recovery snapshots are stored under `.obsidian/plugins/obsidian-image-manager/recovery/`.
- `.gitignore` ignores `.obsidian/plugins/obsidian-image-manager/recovery/` by default so local recovery snapshots are not committed.
- History retention is capped to the newest `10` transactions and transactions older than `24` hours are pruned.
- Use `恢复：撤销上一步图片管理修改` to roll back the latest Image Manager transaction.
- Use `恢复：重做上一步图片管理修改` to reapply the latest undone transaction.

## Development

```bash
npm install
npm run validate
npm run build
```

## Manual Verification

1. Copy `manifest.json`, `main.js`, and `styles.css` into `.obsidian/plugins/obsidian-image-manager/`.
2. Enable **Image Manager** in **Settings -> Community plugins** and reload after each rebuild.
3. Open **Settings -> Image Manager** and confirm the settings page renders without console errors, including save-path and file-name previews.
4. Switch `界面语言 / Interface Language` at the top of the settings page and confirm that section titles, field descriptions, and feature status update immediately.
5. Paste an image into a note and verify that the save path, generated name, link format, and cursor placement follow your settings.
6. Rotate or flip an image referenced by a Markdown note and verify that both the file and the rendered preview refresh.
7. Right-click an image file in the file explorer and verify the plugin context-menu actions.
8. If Obsidian still shows old behavior after a rebuild, recopy `manifest.json`, `main.js`, and `styles.css` into the plugin directory and reload the plugin.
9. Run the batch compression commands and confirm pause, resume, and cancel behave as expected.
10. Open the note and folder galleries and verify filtering, sorting, and grid/list toggles.
11. Run the current-file conversion command from a Markdown note and verify each referenced image is converted only once.
12. Run any vault-wide command and verify that a risk confirmation appears first.
13. Perform several image edits and verify that undo and redo can move back and forth across recent operations.
