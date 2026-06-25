[中文](CONTRIBUTING.md) | [English](CONTRIBUTING.en.md)

# Contributing

Thank you for improving `Note Image Manager`. This project is a desktop-only Obsidian plugin, so changes should keep workflows recoverable, behavior verifiable, and documentation aligned.

## Development Environment

- Node.js `22`
- npm
- Obsidian desktop test vault

```bash
npm install
npm run validate
npm run build
```

## Branches And Commits

- Base regular development on the `develop` branch.
- Keep each change focused: avoid mixing features, fixes, docs, and release prep in one commit.
- Do not commit local vault data, recovery snapshots, temporary screenshots, or private test material.
- For releases, merge according to the project branch policy and create a Git tag that exactly matches `manifest.json.version`.

## Change Requirements

- User-visible behavior changes should update the [README](README.en.md) or [User Guide](docs/user-guide.en.md).
- Variable, naming-template, or path-template changes should update the [Variable Reference](docs/variables.en.md).
- Architecture, service API, or batch contract changes should update [Architecture](docs/architecture.en.md) or the [API Reference](docs/api-reference.en.md).
- Release, review, artifact, and tag rule changes should update the [Release Checklist](docs/release-checklist.en.md).
- Chinese docs and their English `.en.md` mirrors should be maintained together.

## Verification

Before submitting, run at least:

```bash
npm run validate
npm run build
```

Changes involving image processing, batch commands, link rewriting, or recovery transactions should also run the relevant manual checks from [Test Cases](docs/test-cases.en.md).

## Pull Request Notes

Recommended PR description:

- Goal of the change.
- Main implementation points.
- Commands run and manual validation scope.
- Whether user-visible behavior, compatibility, or release flow is affected.

## Release Notes

- `manifest.json.version`, `package.json.version`, `versions.json`, and website version copy must stay aligned.
- Use a plain version Git tag, for example `4.0.3`, without a `v` prefix.
- GitHub Release assets should include `manifest.json`, `main.js`, `styles.css`, and `note-image-manager-<version>.zip`.
- See the [Release Checklist](docs/release-checklist.en.md) for details.
