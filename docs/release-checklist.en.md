[中文](release-checklist.md) | [English](release-checklist.en.md) | [Docs Index](README.en.md)

# Release Checklist

## First Submission Through community.obsidian.md

- Submit through `community.obsidian.md` under `Plugins -> New plugin`; do not rely on the old `obsidian-releases` PR tutorials.
- The repository must be public and expose `README.md`, `LICENSE`, and `manifest.json` from the default branch.
- Keep the GitHub repository description, README hero copy, and Pages landing-page copy aligned so capability, version, and platform messaging do not drift.
- The README should clearly state: plugin purpose, installation path, core commands, limitations and disclosures, and any cases that use network access or external files.

## Release Assets And Versioning

- Keep `manifest.json.version`, `package.json.version`, `versions.json`, and website version copy aligned.
- The Git tag must exactly match `manifest.json.version`, for example `4.0.4`, without a `v` prefix.
- Because the Release workflow needs the full source tree and `package-lock.json`, the tag must point to the release commit on `develop`; do not tag the slim `main` release-surface commit.
- GitHub Release assets must include `manifest.json`, `main.js`, `styles.css`, and `note-image-manager.zip`.
- Re-run `npm run validate` and `npm run build` before cutting the release.
- After pushing the tag, confirm that `gh release view <version>` shows a public Release with all four assets; pushing a tag is not the same as publishing a GitHub Release.
- If `gh run list` shows a failed Release workflow, inspect it with `gh run view <run-id> --log-failed` before deciding whether to fix the workflow or publish the Release manually.
- Before syncing release-surface files from `develop` to `main`, check whether `main` has release-surface hotfixes that have not been backported to `develop`, so website asset paths, stable asset filenames, or similar fixes are not overwritten.
- The release workflow should verify tag/version consistency and upload the required assets automatically.

## Support And Payments

- Voluntary sponsorship uses `manifest.json.fundingUrl` and points to the website support section, for example `https://dxshelley.github.io/obsidian-image-manager/#support`.
- When the plugin only offers voluntary sponsorship and has no paid unlocks or paid services, select `Free` for the Obsidian Payments category.
- `Optional payment` is only for optional paid features, paid services, or paid APIs. It is not for pure tipping or sponsorship.
- README files, the Pages site, and community-directory copy should make clear that the support link is voluntary and does not gate installation, usage, or core features.

## Common Review Risks

- `name` should not include `Obsidian` or `Plugin`; `id` should use lowercase letters and hyphens only, and should not include `obsidian`.
- `isDesktopOnly: true` must match actual behavior; if the plugin depends on Node / Electron APIs, do not claim mobile support.
- Do not ship client-side telemetry, ads, hidden logic, or builds that are difficult to audit.
- Disclose sensitive capabilities in the README, including network downloads, `file://` local file import, and recovery snapshots written to disk.
- Prefer Obsidian APIs and managed registration patterns so resources are cleaned up on unload.
