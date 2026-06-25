[中文](CHANGELOG.md) | [English](CHANGELOG.en.md)

# Changelog

## 4.0.4

- Fixed settings-page rendering on older Obsidian builds where `ButtonComponent.setDestructive()` is unavailable; the reset button now falls back to `setWarning()` or the `mod-warning` class.
- Added settings-page compatibility regression tests and expanded the test Obsidian mock so release validation covers the older button API path.
- Updated `manifest.json`, `package.json`, `versions.json`, README, task status, and website version copy for a `4.0.4` tag release.

## 4.0.3

- Updated the `manifest.json` description to remove the redundant `Obsidian` wording flagged by plugin review.
- Raised `minAppVersion` to `1.13.1` so the manifest matches the Obsidian API version used by the codebase.
- Addressed community-plugin review feedback by replacing direct style assignment, native heading elements, `fetch`, permanent deletes, global `document` usage, and deprecated setting-control APIs, while respecting `event.defaultPrevented` before handling paste events.
- Expanded README and docs-index acknowledgements for open-source dependencies, frameworks, tooling, and reference projects.

## 4.0.1

- Renamed the community-directory display name from the generic `Image Manager` to the more specific `Note Image Manager` to reduce review risk from an existing plugin with the same name.
- Added an install zip release asset so users can download the complete package directly.
- Rendered the settings-page header with Obsidian's recommended `Setting.setHeading()` API to reduce UI-guideline review comments.

## 4.0.0

- Added centralized bilingual copy so settings, feature status, command names, notices, context menus, and vault-risk confirmations follow the selected UI language.
- Refresh registered commands after language changes, keeping scoped command ordering and command-palette labels aligned with the settings page.
- Improved external-image import: reading view can import only the selected external image from the context menu, pasted text sources report clearer fallback details, and explicit import can identify extensionless or dynamic image URLs from response `content-type`.
- Added conversion ignore regexes, conversion-skip notices, and batch-conversion summaries; `AVIF` now participates in image detection, external import, and conversion input while still requiring conversion before in-place edit / compression paths.
- Persist compression history per current file version to avoid recompressing the same version or repeating non-beneficial compression attempts.
- Unified image-link resolution, preview refreshes, gallery lightbox close behavior, and operation feedback for mixed encoded Chinese paths, preview-cache refreshes, and failure notices.
- Added regression coverage for i18n, command refresh, preview external-image import, compression, conversion, file management, and feedback copy, with README, user-guide, task-status, and test-case documentation updated together.

## 3.1.0

- Moved watermark removal into the planned-feature list so the project no longer ships an implementation that fails the quality bar.
- Added bilingual settings-page and feature-status copy, defaulting to Simplified Chinese, and tightened configuration wording across the plugin.
- Rewrote the bilingual website copy, typography, and information hierarchy, and added the project's "useful without entropy" philosophy.
- Updated README, user guides, task status, test cases, and acknowledgements, including thanks to `obsidian-image-converter`.

## 3.0.0

- Added context-menu driven drag-to-crop, wrapped in recovery transactions so edits can be undone and redone safely.
- Tightened gallery and directory-management details, including reading-view double-click entry, current-image preselection inside the source-note gallery, and empty-folder cleanup that stays within image attachment branches.
- Restored registration for the active-image rotate, flip, and resize-to-1920px commands, fixing mismatches between feature status, toggle semantics, and actual delivered capabilities.
- Added unit coverage for crop, feature-catalog registration, and toggle-driven context-menu visibility, while cleaning up outdated docs and test descriptions.
- Added a standalone `website/` marketing site that presents shipped features, planned items, and release-facing product messaging.

## 2.0.0

- Changed current-note conversion and compression commands to process every image referenced by the active Markdown note, with deferred preview rerenders for scoped batch-style runs.
- Reordered scoped command-palette entries into `【单文件】`, `【单文件夹】`, and `【整库】` groups while keeping `a/b/c/d` prefixes only in command IDs.
- Added risk confirmation before every vault-wide command.
- Extended recovery to support undo / redo for recent transactions and to persist before / after transaction-state snapshots.
- Added compression-history tracking so the plugin skips already-processed file versions and reports no-gain compression attempts clearly.
- Added orphan-cleanup controls plus current-note, current-folder, and vault-wide `remove extra image files` commands.
- Changed orphan cleanup to relocate images into the managed folder of their single remaining external note referrer, while preserving files that still have multiple external referrers.
- Added encoded, readable-wrapped, and automatic Markdown path presentation strategies so Chinese, spaces, parentheses, and already-encoded paths can coexist safely.
- Expanded gallery entry points with current-image, reading-view double-click, and context-menu actions, while preselecting the chosen image inside the source-note gallery when available.
- Added English and Chinese documentation indexes, guides, architecture notes, test cases, and release notes.

## 1.0.0

- First stable release of `Note Image Manager`.
- Modularized the plugin into `app`, `core`, `features`, `services`, `types`, `ui`, and `utils`.
- Added configurable paste handling, save-path templates, rename templates, and live settings previews.
- Added current-file, current-folder, and vault-wide commands where applicable.
- Added batch image-link rewriting with managed-folder relocation support.
- Added image compression, format conversion, resize preset, rotate, and flip commands.
- Added note and folder gallery views with sorting, filtering, and grid-size controls.
- Added context-menu integration, preview refresh after image replacement, and CI / release workflows.
