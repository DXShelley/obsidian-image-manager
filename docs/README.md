[中文](README.md) | [English](README.en.md) | [返回项目首页](../README.md)

# 文档索引

本目录保存 `Note Image Manager` 的用户、开发、测试和发布文档。中文文档使用基础文件名，英文镜像使用 `.en.md` 后缀；更新文档时应同步维护两个版本，避免 README、Pages 首页和社区目录说明出现口径漂移。

## 用户文档

| 文档 | 内容 |
| --- | --- |
| [用户指南](user-guide.md) | 命令、右键菜单、画廊、设置页、兼容性策略、诊断日志和恢复机制。 |
| [变量参考](variables.md) | `renamePattern` 与 `outputFolder` 支持的命名变量和路径变量。 |
| [更新日志](../CHANGELOG.md) | 各版本新增能力、行为变更和审核相关修正。 |

## 开发文档

| 文档 | 内容 |
| --- | --- |
| [架构说明](architecture.md) | 代码分层、运行流程、已交付模块和延后扩展点。 |
| [API 参考](api-reference.md) | 核心服务、恢复管理、图片处理、链接格式化和批处理接口摘要。 |
| [TypeScript 指南](typescript-guide.md) | 类型检查命令、类型覆盖率和项目类型约定。 |
| [贡献指南](../CONTRIBUTING.md) | 开发环境、分支约定、验证命令、文档同步和 PR 建议。 |

## 测试与发布

| 文档 | 内容 |
| --- | --- |
| [测试用例](test-cases.md) | 手工验证矩阵、测试环境、回归范围和延期用例。 |
| [发布前清单](release-checklist.md) | `community.obsidian.md` 首次提交、GitHub Release 附件、版本号和审核风险检查。 |
| [任务状态](task-status.md) | 当前版本已完成、部分完成、近期集成说明和延后项。 |

## 项目记录

| 文档 | 内容 |
| --- | --- |
| [用户提问归档](user-prompts.md) | 匹配当前项目的非归档与归档会话用户提问归档，仅用于保留上下文。 |
| [维护记录](maintenance-notes.md) | 从当前非归档项目会话中沉淀的长期维护约定；会话冲突时按最新时间为准。 |

## 建议阅读路径

1. 普通用户：先读 [用户指南](user-guide.md)，再按需查看 [变量参考](variables.md) 和 [更新日志](../CHANGELOG.md)。
2. 插件开发或维护：先读 [贡献指南](../CONTRIBUTING.md) 和 [架构说明](architecture.md)，再读 [API 参考](api-reference.md) 和 [TypeScript 指南](typescript-guide.md)。
3. 发版或提交审核：先执行 [测试用例](test-cases.md) 中的回归检查，再按 [发布前清单](release-checklist.md) 收口。

## 文档维护规则

- README 只保留项目入口、安装方式、核心能力、披露限制和关键文档链接；细节说明放入 `docs/`。
- 用户可见行为优先写入 [用户指南](user-guide.md)，不要只写在更新日志或任务状态中。
- 配置模板、命名变量和路径变量统一写入 [变量参考](variables.md)。
- 发布、审核、附件和 tag 规则统一写入 [发布前清单](release-checklist.md)。
- 测试步骤、验收标准和回归矩阵统一写入 [测试用例](test-cases.md)。
- 跨会话形成的长期维护约定统一写入 [维护记录](maintenance-notes.md)，只参考非归档项目会话；冲突时以最新会话为准。
- 新增中文文档时同步新增 `.en.md` 英文镜像；删除或改名文档时同步更新本索引和根目录 README。

## 致谢与参考

- [Obsidian](https://obsidian.md/)：插件宿主与 API 来源。
- [piexifjs](https://github.com/hMatoba/piexifjs)：JPEG EXIF 处理相关运行时依赖。
- [TypeScript](https://www.typescriptlang.org/)、[esbuild](https://esbuild.github.io/)、[ESLint](https://eslint.org/)、[typescript-eslint](https://typescript-eslint.io/)、[Vitest](https://vitest.dev/)、[@vitest/coverage-v8](https://vitest.dev/guide/coverage.html)、[happy-dom](https://github.com/capricorn86/happy-dom)、[@faker-js/faker](https://fakerjs.dev/)、[type-coverage](https://github.com/plantain-00/type-coverage)：开发、构建、检查、测试与覆盖率工具链。
- [React](https://react.dev/)、[React DOM](https://react.dev/reference/react-dom)、[Vite](https://vite.dev/) 与 [pnpm](https://pnpm.io/)：GitHub Pages 展示站点技术栈。
- [Custom Attachment Location](https://github.com/mnaoumov/obsidian-custom-attachment-location)：附件目录规则与清理行为的重要参考项目。
- [obsidian-image-converter](https://github.com/xRyul/obsidian-image-converter)：图片处理交互边界、命令组织和能力取舍的重要参考项目。
- 若文档中提到“模仿”或“参考”某插件，表示行为语义借鉴，不表示实现或配置完全一致。
