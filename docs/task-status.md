# Refactor Status

## Release

- `v1.0.0` is the first stable baseline.
- Package metadata, manifest metadata, release workflow, and user-facing documentation are aligned for the 1.0.0 release.

## Completed

- Core settings manager, event bus, and feature registry
- Feature-based command and listener registration
- Split settings UI and modal UI into `src/ui`
- CI and release workflow scaffolding
- Updated README and architecture documentation
- Settings compatibility fallback for Obsidian builds that do not expose `Setting.setErrorMessage()`
- Save-path and generated-file-name previews moved into the top of the settings page
- Duplicate adjacent rename variables such as `{noteName}-{date}` collapse automatically when both resolve to the same value
- Markdown preview rerender after in-place image rotate, flip, resize, compress, or convert operations
- Note and folder gallery modal with filter, sort, and grid/list modes, including lightbox preview
- Batch image-link rewrite for current note, current folder, and entire vault, with image relocation into configured directories
- Scope-based image compression for current file, current folder, and entire vault
- Scope-based image conversion for current file, current folder, and entire vault
- File context menu actions with dedicated enable/disable setting
- Operation notification enable/disable setting
- Compression and conversion ignore-regex settings with inline validation and examples
- Default rendered-image alignment and optional suppression of Obsidian image selection on click
- Auto-rename toggle that preserves original filenames when disabled
- Auto-download for pasted image text sources, including image URLs, `file://` paths, and `data:image/...;base64,...`
- Persisted recovery transactions for image rewrites, path moves, note link rewrites, and paste/import flows

## Partially completed

- Image editor: quick rotate/flip actions are implemented, but interactive canvas editing UI is still pending
- Resize: preset resize command is implemented, but advanced presets and UI are pending
- Fabric-based editing pipeline: dependency is retained, but the current processing path still relies on Canvas-first execution

## Recent integration notes

- If the settings page appears incomplete inside Obsidian, first verify the vault plugin directory has the latest `main.js`, `manifest.json`, and `styles.css`.
- `outputFolder` only affects images saved through this plugin's paste-handling flow. If `enablePasteHandler` is disabled, Obsidian or another plugin controls the save location.
- Rotate and flip operations rewrite the underlying image file immediately; Markdown preview refresh now depends on the note still referencing that file path.
- Ignore-regex settings match against `file.path`, support one regex per line, and allow comment lines prefixed with `#`.

## Deferred

- OCR, search, and classification
- Worker-based background processing
- Interactive drag-to-resize inside the editor
