# Obsidian Image Manager

Obsidian 图片管理插件，`v1.0.0` 为首个稳定版本。

## Architecture

- `src/app`: plugin runtime composition, built-in feature catalog, and startup wiring
- `src/core`: settings, event bus, and feature registry
- `src/features`: rename, compress, convert, preview, editor, gallery, batch, resize, align, and context menu modules
- `src/services`: image processor, file manager, variable resolver, and link formatter
- `src/types`: split domain types for settings, images, batch jobs, runtime contracts, and shared results
- `src/ui`: settings tab and modal components
- `src/utils`: platform/path helpers and lightweight validators

See:

- `docs/architecture.md`
- `docs/api-reference.md`
- `docs/test-cases.md`
- `docs/user-guide.md`
- `docs/variables.md`
- `docs/task-status.md`

## Current capabilities

- Paste images into notes and auto-save them into a configurable folder
- Support note-scoped folder rules such as `./assets/${noteFileName}`
- Convert pasted images to the configured default format
- Generate names with variables such as `{noteName}`, `{fileName}`, `{date}`, `{time}`, and `{random}`
- Format inserted image links as either Obsidian Wiki links or standard Markdown links
- Batch-convert all images referenced in the current note
- Run compression and link-update commands against the current file, current folder, or entire vault
- Pause, resume, or cancel active batch jobs
- Use image context menu actions for copy, compress, convert, rotate, and horizontal or vertical flip
- Open note and folder galleries with filtering, sorting, and grid/list toggles
- Sync managed image folders when notes are renamed or moved, with optional image file renaming
- Use time-based naming safely with collision suffixes such as `-01`, `-02`
- Persist recovery transactions for image and Markdown changes, and undo the latest Image Manager operation

## Release

- Version: `1.0.0`
- Minimum Obsidian version: `0.15.0`
- Release workflow: push tag `v*` to trigger `.github/workflows/release.yml`
- Release artifacts: `manifest.json`, `main.js`, `styles.css`

## Recovery

- Recovery snapshots are stored under `.obsidian/plugins/obsidian-image-manager/recovery/`
- History retention is capped to the newest `10` transactions and transactions newer than `24` hours
- Use the command `恢复：撤销上一次图片管理修改` to roll back the most recent Image Manager transaction

## Development

```bash
npm install
npm run validate
npm run build
```

## Manual verification

1. Copy `manifest.json`, `main.js`, and `styles.css` into `.obsidian/plugins/obsidian-image-manager/`.
2. Enable **Image Manager** in **Settings -> Community plugins** and reload after each rebuild.
3. Open **Settings -> Image Manager** and confirm the settings page renders without console errors, including save path and file-name previews.
4. Paste an image into a note and verify save path, generated name, link format, and cursor placement follow your settings.
5. Rotate or flip an image referenced by a Markdown note and verify both the file and rendered note preview refresh.
6. Right-click an image file in the file explorer and verify the context menu actions.
7. If Obsidian still shows old behavior after a rebuild, recopy `manifest.json`, `main.js`, and `styles.css` into the vault plugin directory and reload the plugin.
8. Run the batch compression commands and confirm pause, resume, and cancel work as expected.
9. Open note and folder galleries and verify filter, sort, and grid/list toggles.
10. Run the current-file convert command from a Markdown note and verify all referenced images are converted once.
