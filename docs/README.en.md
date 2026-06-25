[中文](README.md) | [English](README.en.md)

# Docs Index

This directory uses a bilingual layout:

- Chinese docs use the base file name, such as `user-guide.md`.
- English mirrors use the `.en.md` suffix, such as `user-guide.en.md`.
- When a document is added or updated, both language versions should be maintained together to avoid drift.

## Recommended Reading Order

1. [User Guide](user-guide.en.md)
2. [Architecture](architecture.en.md)
3. [API Reference](api-reference.en.md)
4. [Variable Reference](variables.en.md)
5. [Test Cases](test-cases.en.md)
6. [Task Status](task-status.en.md)
7. [Release Checklist](release-checklist.en.md)
8. [TypeScript Guide](typescript-guide.en.md)
9. [Archived User Prompts](user-prompts.en.md)

## Document Descriptions

- [User Guide](user-guide.en.md): end-user commands, settings behavior, and recovery guidance.
- [Architecture](architecture.en.md): layering, runtime flow, and current module boundaries.
- [API Reference](api-reference.en.md): public-facing summaries of core services and batch capabilities.
- [Variable Reference](variables.en.md): supported variables for naming and path templates.
- [Test Cases](test-cases.en.md): validation matrix, execution rules, and regression checklist for the current release.
- [Task Status](task-status.en.md): completed, partial, and deferred items for the current version.
- [Release Checklist](release-checklist.en.md): final checks for first submission through `community.obsidian.md` and later GitHub Releases.
- [TypeScript Guide](typescript-guide.en.md): type-check commands and type conventions.
- [Archived User Prompts](user-prompts.en.md): preserved user prompts from the visible project session.

## Acknowledgements and References

- [Obsidian](https://obsidian.md/): the host application and plugin API provider.
- [piexifjs](https://github.com/hMatoba/piexifjs): runtime dependency for JPEG EXIF-related handling.
- [TypeScript](https://www.typescriptlang.org/), [esbuild](https://esbuild.github.io/), [ESLint](https://eslint.org/), [typescript-eslint](https://typescript-eslint.io/), [Vitest](https://vitest.dev/), [@vitest/coverage-v8](https://vitest.dev/guide/coverage.html), [happy-dom](https://github.com/capricorn86/happy-dom), [@faker-js/faker](https://fakerjs.dev/), and [type-coverage](https://github.com/plantain-00/type-coverage): development, build, linting, testing, and coverage tooling.
- [React](https://react.dev/), [React DOM](https://react.dev/reference/react-dom), [Vite](https://vite.dev/), and [pnpm](https://pnpm.io/): technology stack for the GitHub Pages website.
- [Custom Attachment Location](https://github.com/mnaoumov/obsidian-custom-attachment-location): a key reference for attachment-folder rules and cleanup semantics.
- [obsidian-image-converter](https://github.com/xRyul/obsidian-image-converter): a key reference for image-processing interaction boundaries, command organization, and scope decisions.
- When the docs say a behavior is "modeled after" or "inspired by" another plugin, that describes intent rather than exact implementation parity.
