[中文](CHANGELOG.md) | [English](CHANGELOG.en.md)

# Changelog

## Unreleased

## 3.0.0

- Added context-menu driven drag-to-crop and selection-based watermark removal, both wrapped in recovery transactions so edits can be undone and redone safely.
- Tightened gallery and directory-management details, including reading-view double-click entry, current-image preselection inside the source-note gallery, and empty-folder cleanup that stays within image attachment branches.
- Restored registration for the active-image rotate, flip, and resize-to-1920px commands, fixing mismatches between feature status, toggle semantics, and actual delivered capabilities.
- Added unit coverage for crop, watermark removal, feature-catalog registration, and toggle-driven context-menu visibility, while cleaning up outdated docs and test descriptions.
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

- First stable release of `Obsidian Image Manager`.
- Modularized the plugin into `app`, `core`, `features`, `services`, `types`, `ui`, and `utils`.
- Added configurable paste handling, save-path templates, rename templates, and live settings previews.
- Added current-file, current-folder, and vault-wide commands where applicable.
- Added batch image-link rewriting with managed-folder relocation support.
- Added image compression, format conversion, resize preset, rotate, and flip commands.
- Added note and folder gallery views with sorting, filtering, and grid-size controls.
- Added context-menu integration, preview refresh after image replacement, and CI / release workflows.
