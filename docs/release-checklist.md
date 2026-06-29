[中文](release-checklist.md) | [English](release-checklist.en.md) | [文档索引](README.md)

# 发布前清单

## community.obsidian.md 首次提交

- 使用 `community.obsidian.md` 的 `Plugins -> New plugin` 入口提交，不再走旧的 `obsidian-releases` PR 教程。
- 仓库必须公开，且能正常访问默认分支上的 `README.md`、`LICENSE`、`manifest.json`。
- GitHub 仓库描述、README 首屏文案、Pages 首页文案保持同一口径，不要出现能力、版本或平台定位不一致。
- README 至少明确：插件用途、安装方式、核心命令、限制与披露、需要联网或访问外部文件的场景。

## Release 附件与版本

- `manifest.json.version`、`package.json.version`、`versions.json`、网站版本文案保持一致。
- Git tag 必须与 `manifest.json.version` 完全一致，例如 `4.0.4`，不要写成 `v4.0.4`。
- 因为 Release workflow 需要完整源码树和 `package-lock.json`，tag 必须打在 `develop` 的发布提交上；不要把 tag 打在精简的 `main` 发布面提交上。
- GitHub Release 附件必须包含：`manifest.json`、`main.js`、`styles.css`、`note-image-manager.zip`。
- Release 前必须重新执行 `npm run validate` 与 `npm run build`。
- 推送 tag 后必须确认 `gh release view <version>` 能看到公开 Release 和四个附件；只推送 tag 不等于已经发布 GitHub Release。
- 如果 `gh run list` 显示 Release workflow 失败，先用 `gh run view <run-id> --log-failed` 看失败原因，再修复或手工补发 Release。
- 从 `develop` 同步发布面文件到 `main` 前，先检查 `main` 是否有尚未回流到 `develop` 的发布面热修复，避免覆盖网站资源路径、稳定 asset 文件名等只在 `main` 修过的问题。
- 发布工作流应自动校验 tag 与 `manifest.json.version` 一致，并自动上传附件。

## 支持与付款

- 自愿赞助使用 `manifest.json.fundingUrl` 指向网站支持页，例如 `https://dxshelley.github.io/obsidian-image-manager/#support`。
- 只有自愿赞助、没有付费解锁功能或付费服务时，Obsidian Payments 分类选择 `Free`。
- `Optional payment` 仅用于可选付费功能、付费服务或付费 API，不用于纯打赏或赞助。
- README、Pages 首页和社区目录说明应明确支持链接是自愿赞助，不暗示安装、使用或核心功能需要付款。

## 审核风险高频项

- `name` 不包含 `Obsidian` 或 `Plugin`，`id` 仅使用小写字母和连字符，且不包含 `obsidian`。
- `isDesktopOnly: true` 与实际代码行为一致；如果依赖 Node / Electron API，不要宣称支持移动端。
- 不包含客户端 telemetry、广告、隐藏逻辑或难以审查的混淆构建。
- README 中明确披露网络下载、`file://` 本地文件导入、恢复快照落盘等敏感能力。
- 优先使用 Obsidian API 与受管注册方式，确保资源能在卸载时清理。
