[中文](maintenance-notes.md) | [English](maintenance-notes.en.md) | [文档索引](README.md)

# 维护记录

本文记录从本项目右侧非归档会话中沉淀出的长期维护约定。记录来源只包括 `~/.codex/sessions` 下匹配 `/Users/dxshelley/git/obsidian-image-manager` 的项目会话，不包括 `~/.codex/archived_sessions`。如果不同会话中的内容冲突，以时间最新的非归档会话为准。

## 命令与交互

- 范围型命令按固定 ID 前缀排序，展示名称不暴露排序前缀，只保留范围后缀：`【单文件】`、`【单文件夹】`、`【整库】`。
- 恢复命令独立成组，避免与压缩、转换、清理等范围型命令混在一起。
- 切换界面语言后，应按固定命令 ID 移除并重新注册命令，避免重复注册或残留旧语言名称。
- 整库范围命令必须保留风险确认；批量任务应优先给一次汇总提示，并尽量只刷新一次 Markdown 预览。

## 国际化

- 所有用户可见文案集中维护在 `src/i18n` 或设置页文案模块中。
- 新增 UI、命令、notice、确认弹窗、右键菜单、画廊文案和功能状态时，必须同步补齐中文与英文。
- 文档、README、Pages 首页和社区目录描述要保持能力、版本、平台定位一致。

## 图片处理

- 单文件范围指当前 Markdown 笔记中的所有引用图片，不是光标下或选中的单张图片。
- 压缩应跳过重复压缩同一版本或无收益压缩的情况。
- 不同源格式转换到同一目标格式时，如果目标文件名会冲突，必须生成唯一后缀，不能覆盖已有图片。
- 写入剪贴板时，`image/webp` 兼容性不可靠，应降级为 `image/png`。

## 链接与清理

- 路径解析优先使用原始链接文本，失败后再使用 decoded fallback；中文编码路径和未编码路径混用必须有测试覆盖。
- 孤立图片清理不能扩大清理范围：单个外部引用时迁移到引用笔记目录并回写，多引用时保留，无引用时才删除。
- 删除 md 后的自动清理只处理按笔记独占的受控目录，例如 `./assets/${noteFileName}` 或 `./assets/{noteName}`；留空、固定公共目录和同级共享目录不能因为删除单篇 md 而自动扫描。
- 删除事件里只同步记录待清理的受控目录目标；真正删除图片前要等待 `metadataCache.resolved`，超时则只删除真实空目录，不删除图片。
- 批量删除 md 时要把本批次删除的笔记路径作为同一个 scope 传入清理逻辑，并按受控目录去重，避免交叉引用造成误删或漏删。
- 删除、迁移、转换和回写 Markdown 的操作应进入恢复事务，避免批量操作无法撤回。

## 画廊

- 阅读视图双击图片应打开当前图片画廊，并预选被双击的图片。
- 当前图片画廊可加载来源笔记中的全部图片，并定位到当前选中图。
- Lightbox 放大后应支持拖拽查看细节，避免大图只居中缩放但无法检查局部。

## 发布与审核

- 本项目的 `main` 是精简发布面，不包含 `package-lock.json`、源码、测试和构建配置；Release workflow 会在 tag checkout 后执行 `npm ci`、`npm run validate` 与 `npm run build`，因此发布 tag 必须打在 `develop` 的完整源码提交上，不能打在 `main` 发布面提交上。
- 发布流程默认在 `develop` 验证并提交，给 `develop` 的发布提交创建 tag，推送 `develop` 和 tag 触发 Release workflow；再把必要发布面文件同步到 `main`、提交并推送，最后切回 `develop`。
- Git tag 必须等于 `manifest.json.version`，不使用 `v` 前缀。
- GitHub Release 附件固定为 `manifest.json`、`main.js`、`styles.css`、`note-image-manager.zip`；zip 文件名不带版本号。
- 发布前必须检查 `gh release view <version>` 和 Release workflow；如果 `manifest.json.version` 已更新但 GitHub Release 不存在，Obsidian 社区后台会提示 “manifest points at version ..., but no GitHub release with that version has been published yet”。
- 如果 Release workflow 因 tag 打在 `main` 等原因失败，可临时用 `zip -9 note-image-manager.zip manifest.json main.js styles.css` 和 `gh release create <version> manifest.json main.js styles.css note-image-manager.zip --title <version> --generate-notes` 补发 Release；之后仍要修正文档和发布流程，避免下次重复。
- `main` 上可能存在只影响发布面的热修复；从 `develop` 同步发布文件到 `main` 前，先比较 `git diff main develop -- <发布面文件>`，必要时先把 `main` 的热修复补回 `develop`，避免发布回退，例如网站支持图片 URL 的 `BASE_URL` 处理和 Vite 稳定 asset 文件名配置。
- `manifest.json.description` 不写 `Obsidian`；避免直接 style 赋值和原生 heading；`minAppVersion` 要与实际 API 使用一致。
- `isDesktopOnly` 只保留必要标注，必须与 Node / Electron API 依赖保持一致。

## 支持与付款

- 自愿赞助使用 `manifest.json.fundingUrl` 指向网站支持页，例如 `https://dxshelley.github.io/obsidian-image-manager/#support`。
- 仅提供自愿赞助时，Obsidian Payments 分类选择 `Free`。
- `Optional payment` 只用于可选付费功能、付费服务或付费 API，不用于纯打赏或赞助。
