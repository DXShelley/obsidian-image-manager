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
7. [TypeScript Guide](typescript-guide.en.md)
8. [Archived User Prompts](user-prompts.en.md)

## Document Descriptions

- [User Guide](user-guide.en.md): end-user commands, settings behavior, and recovery guidance.
- [Architecture](architecture.en.md): layering, runtime flow, and current module boundaries.
- [API Reference](api-reference.en.md): public-facing summaries of core services and batch capabilities.
- [Variable Reference](variables.en.md): supported variables for naming and path templates.
- [Test Cases](test-cases.en.md): validation matrix, execution rules, and regression checklist for the current release.
- [Task Status](task-status.en.md): completed, partial, and deferred items for the current version.
- [TypeScript Guide](typescript-guide.en.md): type-check commands and type conventions.
- [Archived User Prompts](user-prompts.en.md): preserved user prompts from the visible project session.

## Acknowledgements and References

- [Obsidian](https://obsidian.md/): the host application and plugin API provider.
- [Custom Attachment Location](https://github.com/mnaoumov/obsidian-custom-attachment-location): a key reference for attachment-folder rules and cleanup semantics.
- When the docs say a behavior is "modeled after" or "inspired by" another plugin, that describes intent rather than exact implementation parity.
