[中文](README.md) | [English](README.en.md)

# Obsidian Image Manager

`Obsidian Image Manager` 是一个面向 Obsidian 的桌面端图片管理插件，`v4.0.0` 聚焦于集中式双语体验、更稳妥的外部图片导入、AVIF 分层兼容、压缩去重历史，以及恢复优先的图片工作流。

Desktop-only image workflow for Obsidian with managed import, conversion, compression, lightweight editing, and recovery-first batch operations.

## 项目理念

- 在 Obsidian 中把高频图片问题解决到够用、顺手、可恢复。
- 注重用户体验，但不拖泥带水，不为过度设计继续增加维护熵。
- 已验证效果稳定的能力直接交付；效果不达标的能力明确标记为规划中，而不是勉强上线。

## 项目概览

- `src/app`：插件运行时组合、内置功能目录与启动装配。
- `src/core`：设置管理、事件总线与功能注册中心。
- `src/features`：重命名、压缩、转换、预览、编辑、画廊、批处理、缩放、对齐与右键菜单模块。
- `src/services`：图片处理、文件管理、变量解析与链接格式化服务。
- `src/types`：设置、图片、批任务、运行时契约与通用结果类型。
- `src/ui`：设置页与模态框组件。
- `src/utils`：平台、路径与轻量校验工具。

## 当前能力

- 将粘贴进笔记的图片自动保存到可配置目录。
- 支持 `./assets/${noteFileName}` 这类基于笔记的保存目录规则。
- 将粘贴图片自动转换为设定的默认格式。
- 使用 `{noteName}`、`{fileName}`、`{date}`、`{time}`、`{random}` 等变量生成文件名。
- 按 Obsidian Wiki 链接或标准 Markdown 链接插入图片引用。
- 将笔记中的 `URL`、`file://` 与 `data:image/...;base64,...` 外部图片源导入到本地受管目录；显式导入时支持根据响应 `content-type` 识别无后缀或动态图片 URL。
- 批量转换当前笔记引用的全部图片。
- 对当前文件、当前文件夹或整个仓库执行压缩和链接更新命令。
- 对当前文件、当前文件夹或整个仓库执行“删除多余图片文件”命令，清理未被任何笔记引用的图片。
- 命令面板中的范围型命令按 `a1-a5`、`b1-b5`、`c1-c5` 的 `id` 顺序排序，并把 `【单文件】`、`【单文件夹】`、`【整库】` 作为命令名后缀展示。
- 执行整库命令前弹出风险确认，避免误操作。
- 当前笔记范围的转换和压缩命令会批量处理该笔记引用的所有图片，而不是只处理当前激活图片文件。
- 暂停、恢复或取消正在运行的批处理任务。
- 通过图片右键菜单执行复制、压缩、转换、旋转、水平或垂直翻转和拖拽裁剪。
- 打开当前图片、当前笔记或当前文件夹画廊，并支持筛选、排序、网格/列表切换，以及在阅读视图中双击图片直接打开画廊。
- 在阅读视图中右键外部图片，只导入当前选中的这一张，不误扩展到整篇笔记。
- 在笔记重命名或移动时同步受管图片目录，并可按规则重命名图片文件。
- 提供“删除空图片文件夹”和“删除孤立图片”设置，用于清理当前受管图片目录中的空附件目录和未引用图片。
- 孤立图片清理在检测到外部唯一引用时，会自动迁移到对应笔记的受管目录，而不是直接删除。
- 设置页与功能状态支持中英文切换，默认显示简体中文。
- 在使用基于时间的命名时，通过 `-01`、`-02` 等后缀安全处理重名。
- 在格式转换时，如 `aaa.png` 和 `aaa.jpg` 同时转为 `webp`，会自动生成 `aaa.webp`、`aaa-1.webp` 这类唯一名称。
- Markdown 图片链接支持编码、可读包裹和自动三种路径输出策略，兼容中文、空格、括号及已编码路径混用。
- `AVIF` 现已纳入图片识别、外链导入与转换输入链路；原位压缩、旋转、翻转、裁剪和缩放前需先转为 `PNG`、`JPEG` 或 `WebP`。
- 压缩历史会持久化记录当前文件版本，避免对同一版本重复压缩或重复尝试无收益压缩。
- 持久化记录图片和 Markdown 修改的恢复事务，并支持撤销 / 重做最近的 Image Manager 操作。

## 限制与披露

- 当前发布目标为桌面端，`manifest.json` 中明确标记 `isDesktopOnly: true`。
- 插件不会收集遥测数据，不包含广告，也不会在后台静默上传 vault 内容。
- 当启用“自动下载文本图片源”等相关能力时，插件会按用户触发去访问网络下载远程图片。
- 插件支持读取 `file://` 指向的本地图片文件并导入到 vault；该能力仅适用于桌面端，且只会在用户显式粘贴此类来源时执行。
- `GIF`、`SVG`、`TIFF`、`HEIC`、`AVIF` 等格式属于分层兼容：可识别、可导入或可参与转换，不等同于保证所有原位编辑 / 压缩操作都稳定可用。
- 插件会在 `.obsidian/plugins/note-image-manager/` 下保存压缩历史与恢复快照，用于去重压缩和撤销 / 重做。
- 整库转换、整库压缩、整库删除多余图片文件等高风险操作都会先弹出确认；图片与 Markdown 的受管修改支持恢复事务。

## 规划中的能力

- 编辑器内拖拽调整图片显示尺寸
- 去水印 / 局部修复：仅在效果和交互达到可用标准后再恢复
- OCR、搜索与分类
- Worker 后台处理

## 文档导航

- [文档索引](docs/README.md)
- [用户指南](docs/user-guide.md)
- [架构说明](docs/architecture.md)
- [API 参考](docs/api-reference.md)
- [变量参考](docs/variables.md)
- [测试用例](docs/test-cases.md)
- [任务状态](docs/task-status.md)
- [TypeScript 指南](docs/typescript-guide.md)
- [更新日志](CHANGELOG.md)

## 安装

- 社区市场上架后：在 **Settings -> Community plugins** 中搜索 `Image Manager` 并安装。
- 首次审核前或手动安装时：从对应的 GitHub Release 下载 `manifest.json`、`main.js`、`styles.css`，复制到 `.obsidian/plugins/note-image-manager/` 后启用插件。
- 当前插件定位为桌面端；移动端不在本次发布范围内。

## 致谢与参考

- [Obsidian](https://obsidian.md/)：提供插件运行时、编辑器和仓库模型，本项目所有能力都建立在其插件 API 之上。
- [Custom Attachment Location](https://github.com/mnaoumov/obsidian-custom-attachment-location)：本项目的附件目录模板、空目录清理、孤立附件清理等行为设计参考了该插件的部分交互语义。
- [obsidian-image-converter](https://github.com/xRyul/obsidian-image-converter)：本项目在图片处理插件的交互边界、命令组织和能力取舍上参考了它的产品思路。
- 以上项目用于能力设计和行为语义参考，不代表本插件与其保持完全兼容。

## 发布信息

- 版本：`4.0.0`
- 最低 Obsidian 版本：`0.15.0`
- 首次上架：通过 `community.obsidian.md` 提交仓库并等待审核。
- 后续更新：创建与 `manifest.json` 中 `version` 完全一致的 Git tag 与 GitHub Release，例如 `4.0.0`，不要加 `v` 前缀。
- 发布产物：`manifest.json`、`main.js`、`styles.css`
- GitHub 仓库描述与主页需保持和 README 一致，避免社区目录页、仓库页与 Pages 首页口径漂移。

## 恢复机制

- 恢复快照保存在 `.obsidian/plugins/note-image-manager/recovery/`。
- `.gitignore` 默认忽略 `.obsidian/plugins/note-image-manager/recovery/`，避免本地恢复快照进入版本控制。
- 历史记录最多保留最新 `10` 笔事务，并清理超过 `24` 小时的事务。
- 使用命令 `恢复：撤销上一步图片管理修改` 可回滚最近一次 Image Manager 事务。
- 使用命令 `恢复：重做上一步图片管理修改` 可重新应用刚撤销的事务。

## 开发

```bash
npm install
npm run validate
npm run build
```

## 手动验证

1. 将 `manifest.json`、`main.js` 与 `styles.css` 复制到 `.obsidian/plugins/note-image-manager/`。
2. 在 **Settings -> Community plugins** 中启用 **Image Manager**，每次重新构建后执行一次重载。
3. 打开 **Settings -> Image Manager**，确认设置页能够渲染，且保存路径与文件名预览无控制台报错。
4. 在设置页顶部切换 `界面语言 / Interface Language`，确认设置分组、字段说明与功能状态随语言即时刷新。
5. 向笔记粘贴图片，确认保存路径、生成名称、链接格式与光标位置都符合设置。
6. 对 Markdown 笔记引用的图片执行旋转或翻转，确认文件内容和预览都会刷新。
7. 在文件管理器中右键图片文件，确认插件右键菜单项正常出现。
8. 在阅读视图中右键外部图片，确认只出现“下载该外部图片”，且只改写当前这一张。
9. 如果重建后 Obsidian 仍显示旧行为，重新复制 `manifest.json`、`main.js`、`styles.css` 到插件目录并重载插件。
10. 运行批量压缩命令，确认暂停、恢复与取消行为正常。
11. 打开笔记画廊和文件夹画廊，确认筛选、排序与网格/列表切换可用。
12. 在 Markdown 笔记中运行当前文件转换命令，确认每张引用图片只被转换一次。
13. 运行任一整库命令，确认会先弹出风险确认框。
14. 连续执行多次图片修改后，验证 `撤销` 与 `重做` 命令可以来回切换最近几次操作。
15. 开启 `删除孤立图片` 后执行 `更新图片链接与目录`，确认只会删除当前受管目录中未被任何笔记引用的图片。
16. 粘贴 `file://` 或远程图片 URL 时，确认桌面端可以按预期导入，同时 README 中的限制与披露描述与实际行为一致。
