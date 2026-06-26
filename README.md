[中文](README.zh-CN.md) | English

# Note Image Manager

[![Release](https://github.com/DXShelley/obsidian-image-manager/actions/workflows/release.yml/badge.svg)](https://github.com/DXShelley/obsidian-image-manager/actions/workflows/release.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Obsidian](https://img.shields.io/badge/Obsidian-desktop%20only-7c3aed.svg)](manifest.json)

`Note Image Manager` is an image-management plugin for Obsidian. It keeps image import, naming, conversion, compression, lightweight editing, gallery browsing, and recovery in one controlled workflow.

Current version: `4.0.6`<br>
Minimum Obsidian version: `1.13.1`<br>
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

## Source And Documentation

The `main` branch keeps the release surface small: README files, release notes, plugin install artifacts, version metadata, and the GitHub Pages website. Full source, tests, development configuration, and detailed documentation live on the [`develop`](https://github.com/DXShelley/obsidian-image-manager/tree/develop) branch.

| Goal | Link |
| --- | --- |
| Browse the full documentation set | [Docs Index](https://github.com/DXShelley/obsidian-image-manager/blob/develop/docs/README.en.md) |
| Learn commands, settings, galleries, diagnostic logging, and recovery | [User Guide](https://github.com/DXShelley/obsidian-image-manager/blob/develop/docs/user-guide.en.md) |
| Configure naming and folder variables | [Variable Reference](https://github.com/DXShelley/obsidian-image-manager/blob/develop/docs/variables.en.md) |
| Review source code and tests | [develop branch](https://github.com/DXShelley/obsidian-image-manager/tree/develop) |
| Read version history | [Changelog](CHANGELOG.en.md) |

## Disclosure And Limits

- The plugin does not collect telemetry, does not include ads, and does not silently upload vault content.
- Remote images are downloaded only when the relevant external-image import flow is enabled or explicitly triggered by the user.
- `file://` local-image import runs only when the user explicitly pastes or imports such sources.
- Formats such as `GIF`, `SVG`, `TIFF`, `HEIC`, and `AVIF` use layered compatibility: they may be recognized, imported, or accepted as conversion input, but that does not guarantee every in-place edit or compression path is stable.
- Compression history and recovery snapshots are stored under `.obsidian/plugins/note-image-manager/` so the plugin can avoid duplicate compression and support undo / redo.
- Vault-wide conversion, compression, and orphan-image cleanup commands require confirmation before running.

## Acknowledgements

This project is built on the [Obsidian](https://obsidian.md/) plugin API and is developed with [TypeScript](https://www.typescriptlang.org/), [esbuild](https://esbuild.github.io/), [ESLint](https://eslint.org/), and [Vitest](https://vitest.dev/).

Image handling and product boundaries were informed by parts of [piexifjs](https://github.com/hMatoba/piexifjs), [Custom Attachment Location](https://github.com/mnaoumov/obsidian-custom-attachment-location), and [obsidian-image-converter](https://github.com/xRyul/obsidian-image-converter). Mentioning a reference project is not a promise of full compatibility.

## Support The Project

If `Note Image Manager` saves you time managing images, you can support ongoing maintenance through WeChat Pay or Alipay:

[Support with WeChat Pay / Alipay](https://dxshelley.github.io/obsidian-image-manager/#support)
