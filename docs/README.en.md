[中文](README.md) | [English](README.en.md) | [Back to project home](../README.en.md)

# Docs Index

This directory contains user, development, testing, and release documentation for `Note Image Manager`. Chinese docs use the base file name, while English mirrors use the `.en.md` suffix. Keep both versions updated together so the README, Pages site, and community-directory copy do not drift.

## User Docs

| Document | Contents |
| --- | --- |
| [User Guide](user-guide.en.md) | Commands, context menus, galleries, settings, compatibility strategy, diagnostic logging, and recovery. |
| [Variable Reference](variables.en.md) | Naming and path variables supported by `renamePattern` and `outputFolder`. |
| [Changelog](../CHANGELOG.en.md) | Versioned feature additions, behavior changes, and review-related fixes. |

## Development Docs

| Document | Contents |
| --- | --- |
| [Architecture](architecture.en.md) | Layering, runtime flow, delivered modules, and deferred extension points. |
| [API Reference](api-reference.en.md) | Summaries for core services, recovery management, image processing, link formatting, and batch processing. |
| [TypeScript Guide](typescript-guide.en.md) | Type-check commands, type coverage, and project typing conventions. |
| [Contributing](../CONTRIBUTING.en.md) | Development environment, branch conventions, verification commands, documentation sync, and PR notes. |

## Testing And Release

| Document | Contents |
| --- | --- |
| [Test Cases](test-cases.en.md) | Manual validation matrix, test environment, regression scope, and deferred cases. |
| [Release Checklist](release-checklist.en.md) | First submission through `community.obsidian.md`, GitHub Release assets, versioning, and common review risks. |
| [Task Status](task-status.en.md) | Completed items, partial work, recent integration notes, and deferred work for the current version. |

## Project Records

| Document | Contents |
| --- | --- |
| [Archived User Prompts](user-prompts.en.md) | User prompts from non-archived and archived sessions that match the current project, kept only as project context. |
| [Maintenance Notes](maintenance-notes.en.md) | Durable maintenance decisions distilled from current non-archived project sessions; newest sessions win conflicts. |

## Recommended Reading Paths

1. Regular users: start with the [User Guide](user-guide.en.md), then open the [Variable Reference](variables.en.md) and [Changelog](../CHANGELOG.en.md) as needed.
2. Plugin developers or maintainers: start with [Contributing](../CONTRIBUTING.en.md) and [Architecture](architecture.en.md), then read the [API Reference](api-reference.en.md) and [TypeScript Guide](typescript-guide.en.md).
3. Release or review work: run the regression checks in [Test Cases](test-cases.en.md), then close out the [Release Checklist](release-checklist.en.md).

## Documentation Rules

- Keep the root README focused on the project entry point, installation, highlights, disclosures, limits, and key documentation links; move detailed behavior into `docs/`.
- Put user-visible behavior in the [User Guide](user-guide.en.md), not only in the changelog or task-status notes.
- Keep configuration templates, naming variables, and path variables in the [Variable Reference](variables.en.md).
- Keep release, review, artifact, and tag rules in the [Release Checklist](release-checklist.en.md).
- Keep test steps, acceptance criteria, and regression matrices in [Test Cases](test-cases.en.md).
- Keep cross-session maintenance decisions in [Maintenance Notes](maintenance-notes.en.md), using only non-archived project sessions; newest sessions win conflicts.
- When adding a Chinese document, add the `.en.md` mirror as well; when deleting or renaming docs, update this index and the root README together.

## Acknowledgements And References

- [Obsidian](https://obsidian.md/): the host application and plugin API provider.
- [piexifjs](https://github.com/hMatoba/piexifjs): runtime dependency for JPEG EXIF-related handling.
- [TypeScript](https://www.typescriptlang.org/), [esbuild](https://esbuild.github.io/), [ESLint](https://eslint.org/), [typescript-eslint](https://typescript-eslint.io/), [Vitest](https://vitest.dev/), [@vitest/coverage-v8](https://vitest.dev/guide/coverage.html), [happy-dom](https://github.com/capricorn86/happy-dom), [@faker-js/faker](https://fakerjs.dev/), and [type-coverage](https://github.com/plantain-00/type-coverage): development, build, linting, testing, and coverage tooling.
- [React](https://react.dev/), [React DOM](https://react.dev/reference/react-dom), [Vite](https://vite.dev/), and [pnpm](https://pnpm.io/): technology stack for the GitHub Pages website.
- [Custom Attachment Location](https://github.com/mnaoumov/obsidian-custom-attachment-location): a key reference for attachment-folder rules and cleanup semantics.
- [obsidian-image-converter](https://github.com/xRyul/obsidian-image-converter): a key reference for image-processing interaction boundaries, command organization, and scope decisions.
- When the docs say a behavior is "modeled after" or "inspired by" another plugin, that describes intent rather than exact implementation parity.
