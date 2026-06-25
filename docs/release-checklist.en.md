[中文](release-checklist.md) | [English](release-checklist.en.md) | [Docs Index](README.en.md)

# Release Checklist

## First Submission Through community.obsidian.md

- Submit through `community.obsidian.md` under `Plugins -> New plugin`; do not rely on the old `obsidian-releases` PR tutorials.
- The repository must be public and expose `README.md`, `LICENSE`, and `manifest.json` from the default branch.
- Keep the GitHub repository description, README hero copy, and Pages landing-page copy aligned so capability, version, and platform messaging do not drift.
- The README should clearly state: plugin purpose, installation path, core commands, limitations and disclosures, desktop-only positioning, and any cases that use network access or external files.

## Release Assets And Versioning

- Keep `manifest.json.version`, `package.json.version`, `versions.json`, and website version copy aligned.
- The Git tag must exactly match `manifest.json.version`, for example `4.0.3`, without a `v` prefix.
- GitHub Release assets must include `manifest.json`, `main.js`, `styles.css`, and `note-image-manager.zip`.
- Re-run `npm run validate` and `npm run build` before cutting the release.
- The release workflow should verify tag/version consistency and upload the required assets automatically.

## Common Review Risks

- `name` should not include `Obsidian` or `Plugin`; `id` should use lowercase letters and hyphens only, and should not include `obsidian`.
- `isDesktopOnly: true` must match actual behavior; if the plugin depends on Node / Electron APIs, do not claim mobile support.
- Do not ship client-side telemetry, ads, hidden logic, or builds that are difficult to audit.
- Disclose sensitive capabilities in the README, including network downloads, `file://` local file import, and recovery snapshots written to disk.
- Prefer Obsidian APIs and managed registration patterns so resources are cleaned up on unload.
