[中文](task-status.md) | [English](task-status.en.md) | [Docs Index](README.en.md)

# Refactor Status

## Release

- `v4.0.10` fixes cleanup for note-owned managed folders after Markdown deletion, batch deletion with cross-references, and stale attachment races.
- Package metadata, manifest metadata, release workflow, marketing site, and user-facing documentation are aligned for the 4.0.10 release.

## Completed

- Core settings manager, event bus, and feature registry
- Feature-based command and listener registration
- Split settings UI and modal UI into `src/ui`
- CI and release workflow scaffolding
- Updated README and architecture documentation
- Compatibility fallback for Obsidian builds that do not expose `Setting.setErrorMessage()`
- Moved save-path and generated-file-name previews to the top of the settings page
- Automatically collapse adjacent duplicate rename fragments when expressions such as `{noteName}-{date}` resolve to the same value
- Rerender Markdown preview after in-place rotate, flip, crop, compress, or convert operations
- Note and folder gallery modal with filtering, sorting, grid / list modes, and lightbox preview
- Batch image-link rewriting for the current note, current folder, and entire vault, with image relocation into configured directories
- Image compression for the current file, current folder, and entire vault
- Image format conversion for the current file, current folder, and entire vault
- File context-menu actions with a dedicated enable / disable setting
- Operation notifications with a dedicated enable / disable setting
- Compression and conversion ignore-regex settings with inline validation and examples
- Bilingual settings-page and feature-status copy, with Simplified Chinese as the default UI language
- Default rendered-image alignment, plus an option to suppress Obsidian image selection on click
- Auto-rename toggle that preserves original file names when disabled
- Auto-download support for pasted image text sources, including image URLs, `file://` paths, and `data:image/...;base64,...`
- Command-palette external-image import for current note, current folder, and whole-vault scopes
- Reading-view right-click import that pulls in only the selected external image
- Explicit external-image import that can recognize extensionless or dynamic image endpoints by response `content-type`, while adding `AVIF` to recognition, import, and conversion-input flows
- Persisted recovery transactions for image rewrites, path moves, note-link rewrites, and paste / import flows
- Automatic convergence of note-owned managed folders after Markdown deletion, with metadata timeouts limited to truly empty folder deletion

## Partially Completed

- Image editing: rotate, flip, and crop are delivered from the file context menu; command-palette rotate / flip shortcuts are not registered
- Resize: the command-palette preset resize command is deferred, and the editor drag-resize UI is still pending

## Recent Integration Notes

- If the settings page appears incomplete inside Obsidian, first verify that the vault plugin directory contains the latest `main.js`, `manifest.json`, and `styles.css`.
- `outputFolder` affects only images saved through this plugin's paste-handling flow. If `enablePasteHandler` is disabled, Obsidian or another plugin controls the save location.
- Rotate and flip operations rewrite the underlying image file immediately; Markdown preview refresh depends on the current note still referencing that file path.
- Ignore-regex settings match against `file.path`, support one regex per line, and allow comment lines prefixed with `#`.
- Markdown image path resolution now uses a raw-path-first strategy with decoded-path fallback so the same note can safely mix `%E6...`-encoded Chinese paths and readable Chinese paths.
- `AVIF` currently uses layered compatibility: recognition, import, and conversion-input support are available, but in-place compress, crop, rotate, flip, and resize should happen only after converting to `PNG`, `JPEG`, or `WebP`.
- Deleted-note auto-cleanup only targets note-owned folders such as `./assets/${noteFileName}` or `./assets/{noteName}`. Empty output paths, `Attachments/Images`, and `./assets` shared locations should be cleaned through manual scoped commands.

## Deferred

- Watermark removal / object repair remains planned only until quality and interaction are acceptable
- OCR, search, and classification
- Worker-based background processing
- Interactive drag-to-resize inside the editor
