[中文](README.zh-CN.md) | English

# Note Image Manager

[![CI](https://github.com/DXShelley/obsidian-image-manager/actions/workflows/ci.yml/badge.svg)](https://github.com/DXShelley/obsidian-image-manager/actions/workflows/ci.yml)
[![Release](https://github.com/DXShelley/obsidian-image-manager/actions/workflows/release.yml/badge.svg)](https://github.com/DXShelley/obsidian-image-manager/actions/workflows/release.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Obsidian](https://img.shields.io/badge/Obsidian-desktop%20only-7c3aed.svg)](manifest.json)

`Note Image Manager` is an image-management plugin for Obsidian. It keeps image import, naming, conversion, compression, lightweight editing, gallery browsing, and recovery in one controlled workflow.

Current version: `4.0.9`<br>
Minimum Obsidian version: `1.12.4`<br>
Release target: desktop plugin, with `isDesktopOnly` set to `true` in `manifest.json`

## Highlights

- Automatically handles pasted images, stores them in a configurable folder, and generates file names from variable templates.
- Supports note-scoped managed folders such as `./assets/${noteFileName}`.
- Imports image sources from `URL`, `file://`, and `data:image/...;base64,...` into the local vault and rewrites them as local image links.
- Runs external-image import, format conversion, compression, link cleanup, and orphan-image cleanup against the current note, current folder, or whole vault.
- Supports Obsidian Wiki links and standard Markdown links, with encoded, readable-wrapped, and automatic path-output strategies.
- Adds image context-menu actions for copy, compress, convert, rotate, flip, and drag-to-crop.
- Provides current-image, note-level, and folder-level galleries with filtering, sorting, and grid / list views.
- Persists recovery transactions for image and Markdown changes, with undo / redo support for recent Note Image Manager operations.
- Supports Simplified Chinese and English in the settings page and feature-status panel, with Chinese as the default.

## Installation

### Community Marketplace

After marketplace approval, install it from **Settings -> Community plugins** by searching for `Note Image Manager`.

### Manual Install

1. Open [Releases](https://github.com/DXShelley/obsidian-image-manager/releases).
2. Download `manifest.json`, `main.js`, and `styles.css` for the target version, or download `note-image-manager.zip`.
3. Place the files in your vault under `.obsidian/plugins/note-image-manager/`.
4. Enable **Note Image Manager** in **Settings -> Community plugins**.

## Documentation

| Goal | Document |
| --- | --- |
| Browse the full documentation set | [Docs Index](docs/README.en.md) |
| Learn commands, settings, galleries, and recovery | [User Guide](docs/user-guide.en.md) |
| Configure naming and folder variables | [Variable Reference](docs/variables.en.md) |
| Understand layering, runtime flow, and module boundaries | [Architecture](docs/architecture.en.md) |
| Review core service and batch API summaries | [API Reference](docs/api-reference.en.md) |
| Run manual validation and regression checks | [Test Cases](docs/test-cases.en.md) |
| Prepare community submission and GitHub Releases | [Release Checklist](docs/release-checklist.en.md) |
| Read version history | [Changelog](CHANGELOG.en.md) |

## Disclosure And Limits

- The plugin does not collect telemetry, does not include ads, and does not silently upload vault content.
- Remote images are downloaded only when the relevant external-image import flow is enabled or explicitly triggered by the user.
- `file://` local-image import runs only when the user explicitly pastes or imports such sources.
- Formats such as `GIF`, `SVG`, `TIFF`, `HEIC`, and `AVIF` use layered compatibility: they may be recognized, imported, or accepted as conversion input, but that does not guarantee every in-place edit or compression path is stable.
- Compression history and recovery snapshots are stored under `.obsidian/plugins/note-image-manager/` so the plugin can avoid duplicate compression and support undo / redo.
- Vault-wide conversion, compression, and orphan-image cleanup commands require confirmation before running.

## Development

Node.js `22` is recommended to match the CI and Release workflows.

```bash
npm install
npm run validate
npm run build
```

Common commands:

- `npm run dev`: development build.
- `npm run type-check`: TypeScript type check.
- `npm run lint`: ESLint check.
- `npm run test`: Vitest unit tests.
- `npm run validate`: type check, lint, and tests.

See [Contributing](CONTRIBUTING.en.md) for the contribution workflow.

## Repository Layout

```text
src/app        plugin runtime wiring and feature catalog
src/core       settings, events, registry, recovery, and compression history
src/features   rename, compress, convert, preview, editor, gallery, batch, and related modules
src/services   image processing, file management, variable resolution, and link formatting
src/ui         settings tab and modals
src/utils      platform, path, link, validation, and Obsidian compatibility helpers
docs           user, development, testing, and release documentation
website        GitHub Pages website
tests          Vitest unit tests
```

## Release

- Keep `manifest.json.version`, `package.json.version`, `versions.json`, and the website version copy aligned.
- The Git tag must exactly match `manifest.json.version`, for example `4.0.4`, without a `v` prefix.
- GitHub Release assets should include `manifest.json`, `main.js`, `styles.css`, and `note-image-manager.zip`.
- See the [Release Checklist](docs/release-checklist.en.md) for the full checklist.

## Acknowledgements

This project is built on the [Obsidian](https://obsidian.md/) plugin API and is developed with [TypeScript](https://www.typescriptlang.org/), [esbuild](https://esbuild.github.io/), [ESLint](https://eslint.org/), and [Vitest](https://vitest.dev/).

Image handling and product boundaries were informed by parts of [piexifjs](https://github.com/hMatoba/piexifjs), [Custom Attachment Location](https://github.com/mnaoumov/obsidian-custom-attachment-location), and [obsidian-image-converter](https://github.com/xRyul/obsidian-image-converter). Mentioning a reference project is not a promise of full compatibility.

## Support The Project

If `Note Image Manager` saves you time managing images, you can support ongoing maintenance through WeChat Pay or Alipay:

[Support with WeChat Pay / Alipay](https://dxshelley.github.io/obsidian-image-manager/#support)
