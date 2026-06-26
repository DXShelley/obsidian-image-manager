中文 | [English](README.md)

# Note Image Manager

[![CI](https://github.com/DXShelley/obsidian-image-manager/actions/workflows/ci.yml/badge.svg)](https://github.com/DXShelley/obsidian-image-manager/actions/workflows/ci.yml)
[![Release](https://github.com/DXShelley/obsidian-image-manager/actions/workflows/release.yml/badge.svg)](https://github.com/DXShelley/obsidian-image-manager/actions/workflows/release.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Obsidian](https://img.shields.io/badge/Obsidian-desktop%20only-7c3aed.svg)](manifest.json)

`Note Image Manager` 是一个面向 Obsidian 的图片管理插件，用于把笔记图片的导入、命名、转换、压缩、轻量编辑、画廊浏览和恢复回退收敛到一条可控流程。

当前版本：`4.0.6`<br>
最低 Obsidian 版本：`1.13.1`<br>
发布形态：桌面端插件，`manifest.json` 中 `isDesktopOnly` 为 `true`

## 核心能力

- 自动接管图片粘贴，将图片保存到可配置目录，并按变量模板生成文件名。
- 支持 `./assets/${noteFileName}` 这类按笔记组织的受管目录规则。
- 将 `URL`、`file://` 与 `data:image/...;base64,...` 图片源导入到本地 vault，并改写为本地图片链接。
- 在当前笔记、当前文件夹或整库范围内执行外部图片导入、格式转换、压缩、链接整理和孤立图片清理。
- 支持 Obsidian Wiki 链接与标准 Markdown 链接，并提供编码、可读包裹和自动路径输出策略。
- 提供图片右键菜单，用于复制、压缩、转换、旋转、翻转和拖拽裁剪。
- 提供当前图片、当前笔记和当前文件夹画廊，支持筛选、排序、网格 / 列表切换。
- 持久化记录图片和 Markdown 修改的恢复事务，支持撤销 / 重做最近的 Note Image Manager 操作。
- 设置页和功能状态支持简体中文与 English 切换，默认使用简体中文。

## 安装

### 社区市场

插件通过 Obsidian 社区市场审核后，可在 **Settings -> Community plugins** 中搜索 `Note Image Manager` 并安装。

### 手动安装

1. 打开 [Releases](https://github.com/DXShelley/obsidian-image-manager/releases)。
2. 下载对应版本的 `manifest.json`、`main.js`、`styles.css`，或下载 `note-image-manager.zip`。
3. 将文件放入你的 vault：`.obsidian/plugins/note-image-manager/`。
4. 在 **Settings -> Community plugins** 中启用 **Note Image Manager**。

## 文档入口

| 目标 | 文档 |
| --- | --- |
| 快速了解全部文档 | [文档索引](docs/README.md) |
| 安装后如何使用命令、设置、画廊与恢复 | [用户指南](docs/user-guide.md) |
| 命名模板和保存路径变量 | [变量参考](docs/variables.md) |
| 代码分层、运行流程和模块边界 | [架构说明](docs/architecture.md) |
| 核心服务与批处理接口摘要 | [API 参考](docs/api-reference.md) |
| 手工验证矩阵和回归范围 | [测试用例](docs/test-cases.md) |
| 社区提交和 GitHub Release 收口 | [发布前清单](docs/release-checklist.md) |
| 版本变化 | [更新日志](CHANGELOG.md) |

## 披露与限制

- 插件不会收集遥测数据，不包含广告，也不会在后台静默上传 vault 内容。
- 仅当用户启用或触发外部图片导入相关能力时，插件才会访问网络下载远程图片。
- `file://` 本地图片导入只会在用户显式粘贴或导入这类来源时执行。
- `GIF`、`SVG`、`TIFF`、`HEIC`、`AVIF` 等格式属于分层兼容：可识别、可导入或可作为转换输入，不代表所有原位编辑和压缩操作都稳定可用。
- 插件会在 `.obsidian/plugins/note-image-manager/` 下保存压缩历史与恢复快照，用于避免重复压缩并支持撤销 / 重做。
- 整库转换、整库压缩、整库删除多余图片文件等高风险操作都会先弹出确认。

## 开发

推荐使用 Node.js `22`，与 CI 和 Release workflow 保持一致。

```bash
npm install
npm run validate
npm run build
```

常用命令：

- `npm run dev`：开发构建。
- `npm run type-check`：TypeScript 类型检查。
- `npm run lint`：ESLint 检查。
- `npm run test`：运行 Vitest 单元测试。
- `npm run validate`：依次运行类型检查、lint 和测试。

贡献流程见 [贡献指南](CONTRIBUTING.md)。

## 仓库结构

```text
src/app        插件运行时装配与功能目录
src/core       设置、事件、注册中心、恢复和压缩历史等基础能力
src/features   重命名、压缩、转换、预览、编辑、画廊、批处理等功能模块
src/services   图片处理、文件管理、变量解析与链接格式化服务
src/ui         设置页与模态框
src/utils      平台、路径、链接、校验与 Obsidian 兼容工具
docs           用户、开发、测试和发布文档
website        GitHub Pages 展示站点
tests          Vitest 单元测试
```

## 发布

- `manifest.json.version`、`package.json.version`、`versions.json` 和展示站点版本文案应保持一致。
- Git tag 必须与 `manifest.json.version` 完全一致，例如 `4.0.4`，不要添加 `v` 前缀。
- GitHub Release 附件应包含 `manifest.json`、`main.js`、`styles.css` 和 `note-image-manager.zip`。
- 详细检查项见 [发布前清单](docs/release-checklist.md)。

## 致谢

本项目基于 [Obsidian](https://obsidian.md/) 插件 API 构建，并使用 [TypeScript](https://www.typescriptlang.org/)、[esbuild](https://esbuild.github.io/)、[ESLint](https://eslint.org/) 与 [Vitest](https://vitest.dev/) 等工具链开发和验证。

图片处理和产品边界参考了 [piexifjs](https://github.com/hMatoba/piexifjs)、[Custom Attachment Location](https://github.com/mnaoumov/obsidian-custom-attachment-location) 与 [obsidian-image-converter](https://github.com/xRyul/obsidian-image-converter) 的部分能力和交互思路。提到参考项目不代表本插件与其保持完全兼容。

## 支持项目

如果 `Note Image Manager` 节省了你的图片整理时间，可以通过微信或支付宝支持项目维护：

[微信 / 支付宝支持项目](https://dxshelley.github.io/obsidian-image-manager/#support)
