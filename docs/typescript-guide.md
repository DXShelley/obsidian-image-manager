[中文](typescript-guide.md) | [English](typescript-guide.en.md) | [文档索引](README.md)

# TypeScript 指南

本项目使用 TypeScript 作为公开设置、服务契约与图片操作输入的单一事实来源。

## 命令

```bash
npm run type-check
npm run type-check:watch
npm run type-coverage
npm run validate
```

## 约定

- 对纯类型导入优先使用 `import type`。
- 将面向用户的设置类型集中保存在 `src/types/index.ts`。
- 对不可信输入优先使用 `src/utils/type-validators.ts` 中的运行时校验器。
- 同时支持 Obsidian Wiki 图片链接和标准 Markdown 图片链接。
