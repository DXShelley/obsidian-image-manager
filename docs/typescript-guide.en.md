[中文](typescript-guide.md) | [English](typescript-guide.en.md) | [Docs Index](README.en.md)

# TypeScript Guide

This project uses TypeScript as the source of truth for public settings, service contracts, and image-operation inputs.

## Commands

```bash
npm run type-check
npm run type-check:watch
npm run type-coverage
npm run validate
```

## Conventions

- Prefer `import type` for type-only imports.
- Keep user-facing settings in `src/types/index.ts`.
- Use runtime validators from `src/utils/type-validators.ts` for untrusted input.
- Support both Obsidian Wiki image links and standard Markdown image links.
