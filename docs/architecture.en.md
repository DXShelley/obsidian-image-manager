[中文](architecture.md) | [English](architecture.en.md) | [Docs Index](README.en.md)

# Architecture

## Layering

- `src/main.ts`: plugin composition root, service wiring, and feature registry bootstrap.
- `src/core`: cross-cutting infrastructure for settings persistence, event dispatch, and feature registration.
- `src/core/recovery`: persisted transaction snapshots and undo orchestration.
- `src/features`: user-facing feature modules grouped by business capability.
- `src/services`: reusable services for file operations, image processing, variable resolution, and link formatting.
- `src/ui`: settings-tab and modal components.
- `src/types`: shared enums, interfaces, result helpers, batch contracts, and feature metadata.
- `src/utils`: pure helper functions.

## Implemented Flow

1. `main.ts` loads persisted settings into `SettingsManager`.
2. Core services are instantiated once and exposed through `ImageManagerFeatureContext`.
3. `FeatureRegistry` activates each feature module.
4. Features register commands, workspace / vault listeners, post processors, and UI entry points.
5. Managed write operations record recovery snapshots before changing Markdown or image files.
6. Batch work emits progress through `EventBus`.

## Delivered Modules

- Rename and relocation sync
- Compression
- Format conversion
- Preview decoration
- Image editor quick actions
- Note / folder gallery
- Batch compression queue
- Resize preset
- Context-menu integration

## Deferred Extension Points

- Markdown image-alignment transforms
- Interactive canvas editor UI
- OCR, search, and classification
- Worker-based off-main-thread processing
