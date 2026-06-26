[中文](maintenance-notes.md) | [English](maintenance-notes.en.md) | [Docs Index](README.en.md)

# Maintenance Notes

This file records durable maintenance decisions distilled from the visible, non-archived Codex Desktop sessions for this project. The source scope is limited to project sessions under `~/.codex/sessions` that match `/Users/dxshelley/git/obsidian-image-manager`; `~/.codex/archived_sessions` is intentionally excluded. If sessions conflict, the newest non-archived session wins.

## Commands And Interaction

- Scope-based commands should sort by stable ID prefixes, while display names hide those prefixes and keep only the scope suffixes: `【单文件】`, `【单文件夹】`, and `【整库】`.
- Recovery commands stay in their own group instead of mixing with compression, conversion, cleanup, or other scoped commands.
- After switching the interface language, remove and re-register commands by stable command ID to avoid duplicates or stale language labels.
- Whole-vault commands must keep risk confirmation. Batch tasks should prefer one summary notice and avoid repeated Markdown preview refreshes.

## Internationalization

- Keep all user-visible copy in `src/i18n` or the settings-page copy module.
- When adding UI, commands, notices, confirmation dialogs, context menus, gallery copy, or feature-status labels, update both Chinese and English text.
- Keep README files, docs, the Pages site, and community-directory copy aligned on capabilities, version, and platform positioning.

## Image Processing

- The single-file scope means all referenced images in the current Markdown note, not only the image under the cursor or current selection.
- Compression should skip repeated compression of the same version and skip cases without size benefit.
- When different source formats convert to the same target format and would collide, generate a unique suffix instead of overwriting an existing image.
- Clipboard writes should fall back from unreliable `image/webp` writes to `image/png`.

## Links And Cleanup

- Resolve paths with the raw link text first, then use decoded fallback when needed. Mixed encoded and unencoded Chinese paths must have test coverage.
- Orphan cleanup must not expand its scope: migrate and relink a single external reference, keep multi-reference files, and delete only files with no references.
- Deletes, migrations, conversions, and Markdown relinks should enter recovery transactions so batch changes can be undone.

## Galleries

- Double-clicking an image in reading view should open the current-image gallery and preselect that image.
- The current-image gallery may load all images from the source note and focus the selected image.
- After Lightbox zoom, dragging should let users inspect details instead of only centering a scaled image.

## Release And Review

- The default release flow is: validate and commit on `develop`, merge to `main`, create the tag, push `develop`, `main`, and the tag, then switch back to `develop`.
- The Git tag must exactly equal `manifest.json.version` and must not use a `v` prefix.
- GitHub Release assets are fixed: `manifest.json`, `main.js`, `styles.css`, and `note-image-manager.zip`; the zip filename does not include the version.
- `manifest.json.description` should not mention `Obsidian`; avoid direct style assignment and native heading creation; keep `minAppVersion` aligned with actual API usage.
- Keep `isDesktopOnly` only when required, and make it match Node / Electron API dependencies.

## Support And Payments

- Voluntary sponsorship uses `manifest.json.fundingUrl` and points to the website support section, for example `https://dxshelley.github.io/obsidian-image-manager/#support`.
- When the plugin only offers voluntary sponsorship, select `Free` for the Obsidian Payments category.
- `Optional payment` is only for optional paid features, paid services, or paid APIs. It is not for pure tipping or sponsorship.
