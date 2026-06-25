[中文](release-checklist.md) | [English](release-checklist.en.md) | [文档索引](README.md)

# 发布前清单

## community.obsidian.md 首次提交

- 使用 `community.obsidian.md` 的 `Plugins -> New plugin` 入口提交，不再走旧的 `obsidian-releases` PR 教程。
- 仓库必须公开，且能正常访问默认分支上的 `README.md`、`LICENSE`、`manifest.json`。
- GitHub 仓库描述、README 首屏文案、Pages 首页文案保持同一口径，不要出现能力、版本或平台定位不一致。
- README 至少明确：插件用途、安装方式、核心命令、限制与披露、桌面端定位、需要联网或访问外部文件的场景。

## Release 附件与版本

- `manifest.json.version`、`package.json.version`、`versions.json`、网站版本文案保持一致。
- Git tag 必须与 `manifest.json.version` 完全一致，例如 `3.1.1`，不要写成 `v3.1.1`。
- GitHub Release 附件必须包含：`manifest.json`、`main.js`、`styles.css`。
- Release 前必须重新执行 `npm run validate` 与 `npm run build`。
- 发布工作流建议自动校验 tag 与 `manifest.json.version` 一致，并自动上传附件。

## 审核风险高频项

- `name` 不包含 `Obsidian` 或 `Plugin`，`id` 仅使用小写字母和连字符，且不包含 `obsidian`。
- `isDesktopOnly: true` 与实际代码行为一致；如果依赖 Node / Electron API，不要宣称支持移动端。
- 不包含客户端 telemetry、广告、隐藏逻辑或难以审查的混淆构建。
- README 中明确披露网络下载、`file://` 本地文件导入、恢复快照落盘等敏感能力。
- 优先使用 Obsidian API 与受管注册方式，确保资源能在卸载时清理。
