[中文](CONTRIBUTING.md) | [English](CONTRIBUTING.en.md)

# 贡献指南

感谢你愿意改进 `Note Image Manager`。本项目是 Obsidian 桌面端插件，提交变更时请优先保持功能可恢复、行为可验证、文档口径一致。

## 开发环境

- Node.js `22`
- npm
- Obsidian 桌面版测试 vault

```bash
npm install
npm run validate
npm run build
```

## 分支与提交

- 日常开发默认基于 `develop` 分支。
- 每个变更尽量聚焦一个问题：功能、修复、文档或发布准备不要混在一个提交里。
- 不要提交本地 vault 数据、恢复快照、临时截图或私有测试资料。
- 发布前再按项目约定合并到 `main` 并创建与 `manifest.json.version` 完全一致的 Git tag。

## 变更要求

- 用户可见行为变更应同步更新 [README](README.md) 或 [用户指南](docs/user-guide.md)。
- 变量、命名模板或路径模板变更应同步更新 [变量参考](docs/variables.md)。
- 架构、服务接口或批处理契约变更应同步更新 [架构说明](docs/architecture.md) 或 [API 参考](docs/api-reference.md)。
- 发布、审核、附件和 tag 规则变更应同步更新 [发布前清单](docs/release-checklist.md)。
- 中文文档和英文 `.en.md` 镜像需要一起维护。

## 验证

提交前至少运行：

```bash
npm run validate
npm run build
```

涉及图片处理、批量命令、链接改写或恢复事务的变更，还应按 [测试用例](docs/test-cases.md) 执行相关手工验证。

## Pull Request 建议

PR 描述建议包含：

- 变更目标。
- 主要实现点。
- 已运行的命令和手工验证范围。
- 用户可见行为、兼容性或发布流程是否受影响。

## 发布注意事项

- `manifest.json.version`、`package.json.version`、`versions.json` 和展示站点版本文案必须一致。
- Git tag 使用纯版本号，例如 `4.0.3`，不要加 `v` 前缀。
- GitHub Release 附件应包含 `manifest.json`、`main.js`、`styles.css` 和 `note-image-manager-<version>.zip`。
- 详细规则见 [发布前清单](docs/release-checklist.md)。
