[中文](test-cases.md) | [English](test-cases.en.md) | [文档索引](README.md)

# 测试用例

## 范围

本文档覆盖 `note-image-manager` 当前已交付与部分交付的功能集合。

状态说明：

- `Implemented`：可以针对当前插件构建执行并验收。
- `Partial`：可以执行，但仅当前已交付的子集应通过。
- `Deferred`：预留给后续实现，当前版本不应标记为通过。

## 测试环境

### 必需环境

- Obsidian 桌面版
- 已启用社区插件的测试仓库
- 已将插件构建产物复制到 `.obsidian/plugins/note-image-manager/`
- 已加载并启用当前插件版本

### 建议测试数据

- Markdown 笔记
  - `notes/Daily Note.md`
  - `notes/Project Alpha.md`
  - `notes/sub/Project Beta.md`
- 图片文件
  - `fixtures/photo.png`
  - `fixtures/photo.jpg`
  - `fixtures/diagram.webp`
  - `fixtures/large-photo.jpg` 大于 5 MB
  - `fixtures/very-large-photo.png` 大于 15 MB
  - `fixtures/duplicate-name/photo.png`
  - `fixtures/duplicate-name/sub/photo.png`
- 非图片文件
  - `fixtures/readme.txt`
  - `fixtures/sample.pdf`
- 可选远程图片 URL，用于手工验证

### 建议默认设置基线

- `defaultFormat = webp`
- `defaultQuality = 80`
- `defaultLinkFormat = wiki`
- `defaultPathFormat = shortest`
- `uiLanguage = zh-CN`
- `renamePattern = {noteName}-{date}-{random}`
- `outputFolder = ./assets/${noteFileName}`
- `enableAutoConvert = true`
- `enableGallery = true`
- `enableContextMenu = true`
- `renameImagesOnNoteRelocate = true`
- `dropPasteCursorLocation = back`
- `showSpaceSavedNotification = true`
- `compressionQuality = 80`

## 执行规则

- 每个用例都应记录为 `Pass`、`Fail`、`Blocked` 或 `Not Applicable`。
- 涉及文件系统断言时，需要同时核对 Obsidian 文件管理器状态与实际仓库文件。
- 涉及链接断言时，应核对最终 Markdown 源文本，而不是只看渲染预览。
- 涉及文件处理断言时，应核对扩展名、文件大小趋势、文件可读性以及链接是否仍然有效。

## 详细测试用例

### 1. 插件加载与初始化

#### TC-INIT-001 插件首次加载

- 状态: `Implemented`
- 目标: 验证插件能够正常加载并显示加载通知
- 前置条件:
  - 插件目录已复制 `manifest.json`、`main.js`、`styles.css`
  - Obsidian 已打开测试仓库
- 步骤:
  1. 在 Obsidian 中启用 `Note Image Manager`
  2. 观察插件加载过程
  3. 打开开发者控制台查看是否有报错
- 预期:
  - 插件成功启用
  - 显示 `Note Image Manager loaded`
  - 控制台无未捕获异常
  - 设置页出现 `Note Image Manager`

#### TC-INIT-002 插件重载

- 状态: `Implemented`
- 目标: 验证多次重载后不重复注册异常事件
- 前置条件:
  - 插件已启用
- 步骤:
  1. 执行插件重载 3 次
  2. 每次重载后执行一次 `Process images in current note`
  3. 观察命令执行次数和通知次数
- 预期:
  - 命令每次只执行一次
  - 不出现重复通知暴增
  - 无明显事件重复注册现象

### 2. 设置界面

#### TC-SET-001 设置页渲染

- 状态: `Implemented`
- 目标: 验证设置页完整渲染
- 步骤:
  1. 打开 `Settings -> Note Image Manager`
  2. 检查分组区域
- 预期:
  - 顶部显示 `界面语言`
  - 显示 `保存与命名`
  - 显示 `转换与压缩`
  - 显示 `粘贴与编辑`
  - 显示 `图片画廊`
  - 显示 `功能状态`
  - 显示 `图片文件保存位置`
  - 显示 `生成的图片文件名`
  - 显示两个预览块
  - 控制台无 `setErrorMessage is not a function`

#### TC-SET-007 界面语言即时切换

- 状态: `Implemented`
- 目标: 验证设置页与功能状态支持中英文即时切换
- 步骤:
  1. 在设置页顶部将 `界面语言` 从 `简体中文` 切换到 `English`
  2. 观察分组标题、字段说明和 `功能状态`
  3. 切回 `简体中文`
- 预期:
  - 设置页立即刷新为英文
  - `Recovery transactions` 与 `Watermark removal` 等功能状态显示为英文
  - 切回中文后重新显示 `恢复事务` 与 `去水印`

#### TC-SET-002 下拉设置持久化

- 状态: `Implemented`
- 目标: 验证下拉项变更后持久化
- 步骤:
  1. 将 `Default image format` 设为 `png`
  2. 将 `Default link format` 设为 `markdown`
  3. 重载插件
  4. 返回设置页检查
- 预期:
  - 设置值保持为上次修改结果

#### TC-SET-003 文本设置持久化

- 状态: `Implemented`
- 目标: 验证文本项持久化
- 步骤:
  1. 将 `Rename pattern` 改为 `{noteName}-{fileName}`
  2. 将 `Output folder` 改为 `./media/${noteFileName}`
  3. 重载插件
- 预期:
  - 两个文本值保持不变

#### TC-SET-006 旧版 Obsidian 设置兼容性

- 状态: `Implemented`
- 目标: 验证设置页在不支持 `Setting.setErrorMessage()` 的运行环境中仍可用
- 步骤:
  1. 在目标 Obsidian 版本打开 `Settings -> Note Image Manager`
  2. 修改 `图片文件保存位置`
  3. 修改 `生成的图片文件名`
- 预期:
  - 设置页完整渲染
  - 输入变更可保存
  - 控制台不存在未捕获的 `TypeError`

#### TC-SET-004 Slider 设置边界

- 状态: `Implemented`
- 目标: 验证质量滑块最小和最大值
- 步骤:
  1. 将 `Default image quality` 调到 `1`
  2. 执行一次图片转换
  3. 将 `Default image quality` 调到 `100`
  4. 再执行一次图片转换
- 预期:
  - 两次处理都完成
  - 无崩溃
  - 输出文件可打开

#### TC-SET-005 开关设置即时生效

- 状态: `Implemented`
- 目标: 验证 `Enable context menu actions` 和 `Enable gallery` 无需重载即时生效
- 步骤:
  1. 关闭 `Enable context menu actions`
  2. 右键图片文件
  3. 打开 `Enable context menu actions`
  4. 再次右键图片文件
  5. 关闭 `Enable gallery`
  6. 执行画廊命令
- 预期:
  - 关闭时不出现插件菜单项
  - 开启后立即出现
  - 关闭画廊后命令弹出 `Gallery is disabled in settings`

### 3. 变量解析与重命名规则

#### TC-VAR-001 `{noteName}` 替换

- 状态: `Implemented`
- 前置条件:
  - 当前笔记为 `Project Alpha.md`
  - `renamePattern = {noteName}`
- 步骤:
  1. 向笔记粘贴一张图片
- 预期:
  - 生成文件名主体为 `Project_Alpha`

#### TC-VAR-002 `{fileName}` 替换

- 状态: `Implemented`
- 前置条件:
  - `renamePattern = {fileName}`
  - 使用名为 `photo 1.png` 的图片
- 步骤:
  1. 粘贴图片
- 预期:
  - 文件名主体为 `photo_1`

#### TC-VAR-003 `{date}` `{time}` 生成格式

- 状态: `Implemented`
- 前置条件:
  - `renamePattern = {date}-{time}`
- 步骤:
  1. 粘贴图片
- 预期:
  - 文件名包含 `YYYY-MM-DD`
  - 文件名包含 `HH-MM-SS`

#### TC-VAR-004 `{random}` 唯一性

- 状态: `Implemented`
- 前置条件:
  - `renamePattern = {random}`
- 步骤:
  1. 连续粘贴两张同源图片
- 预期:
  - 两个文件名不同

#### TC-VAR-005 `${name}` 语法兼容

- 状态: `Implemented`
- 前置条件:
  - `renamePattern = ${noteFileName}-${fileName}`
- 步骤:
  1. 粘贴图片
- 预期:
  - 文件名正确解析
  - 不残留 `${...}` 原文

#### TC-VAR-006 非法字符清理

- 状态: `Implemented`
- 前置条件:
  - 笔记名包含空格和特殊字符，例如 `Plan: Q3/2026`
  - `renamePattern = {noteName}-{fileName}`
- 步骤:
  1. 粘贴图片
- 预期:
  - 输出文件名不包含 `<>:\"/\\|?*`
  - 空格被标准化

#### TC-VAR-007 未知变量剔除

- 状态: `Implemented`
- 前置条件:
  - `renamePattern = {noteName}-{unknown}-{fileName}`
- 步骤:
  1. 粘贴图片
- 预期:
  - 文件名中不保留 `{unknown}`
  - 其余变量正常解析

#### TC-VAR-008 相邻重复变量自动去重

- 状态: `Implemented`
- 前置条件:
  - 当前笔记名为 `2026-06-23`
  - `renamePattern = {noteName}-{date}-{time}`
- 步骤:
  1. 粘贴图片
- 预期:
  - 文件名为 `2026-06-23-HH-MM-SS`
  - 不出现 `2026-06-23-2026-06-23-...`

### 4. 粘贴与保存流程

#### TC-PASTE-001 粘贴单张图片

- 状态: `Implemented`
- 目标: 验证基础粘贴保存链路
- 步骤:
  1. 打开 `Daily Note.md`
  2. 从系统剪贴板粘贴一张图片
- 预期:
  - 图片被保存到 `outputFolder` 指定目录
  - Markdown 中插入一条图片链接
  - 链接可正常预览

#### TC-PASTE-002 一次粘贴多张图片

- 状态: `Implemented`
- 步骤:
  1. 使用支持多图片的剪贴板来源
  2. 一次性粘贴多张图片
- 预期:
  - 所有图片均被保存
  - 链接逐行插入
  - 无遗漏

#### TC-PASTE-003 非图片粘贴不拦截

- 状态: `Implemented`
- 步骤:
  1. 复制纯文本
  2. 在笔记中粘贴
- 预期:
  - 插件不接管
  - 文本正常粘贴

#### TC-PASTE-004 无活动 Markdown 视图时粘贴

- 状态: `Implemented`
- 步骤:
  1. 切换到非 Markdown 视图
  2. 粘贴图片
- 预期:
  - 插件不报错
  - 不进行异常文件保存

#### TC-PASTE-005 自动转换开启

- 状态: `Implemented`
- 前置条件:
  - `enableAutoConvert = true`
  - `defaultFormat = webp`
- 步骤:
  1. 粘贴一张 PNG
- 预期:
  - 输出文件扩展名为 `.webp`
  - 插入链接指向 `.webp`

#### TC-PASTE-006 自动转换关闭

- 状态: `Implemented`
- 前置条件:
  - `enableAutoConvert = false`
- 步骤:
  1. 粘贴一张 PNG
- 预期:
  - 输出保持原始扩展名

#### TC-PASTE-007 光标位置 back

- 状态: `Implemented`
- 前置条件:
  - `dropPasteCursorLocation = back`
- 步骤:
  1. 在一段文字中间粘贴图片
- 预期:
  - 光标位于新插入链接之后

#### TC-PASTE-008 光标位置 front

- 状态: `Implemented`
- 前置条件:
  - `dropPasteCursorLocation = front`
- 步骤:
  1. 在一段文字中间粘贴图片
- 预期:
  - 光标停留在插入前的位置或插入起始附近
  - 行为与 `back` 明显不同

### 5. 输出目录与路径解析

#### TC-PATH-001 空输出目录

- 状态: `Implemented`
- 前置条件:
  - `outputFolder = ""`
- 步骤:
  1. 在 `notes/Daily Note.md` 粘贴图片
- 预期:
  - 图片保存到当前笔记所在目录

#### TC-PATH-002 相对输出目录

- 状态: `Implemented`
- 前置条件:
  - `outputFolder = ./assets/${noteFileName}`
- 步骤:
  1. 在 `notes/Daily Note.md` 粘贴图片
- 预期:
  - 图片保存在 `notes/assets/Daily_Note/`

#### TC-PATH-006 粘贴接管关闭时不使用插件保存目录

- 状态: `Implemented`
- 前置条件:
  - `outputFolder = ./assets/${noteFileName}`
  - `enablePasteHandler = false`
- 步骤:
  1. 在 Obsidian 中粘贴图片
- 预期:
  - 插件不接管保存流程
  - 图片保存位置由 Obsidian 原生逻辑或其他插件决定

#### TC-PATH-003 跨层相对目录

- 状态: `Implemented`
- 前置条件:
  - `outputFolder = ../shared-assets/${noteFileName}`
  - 当前笔记位于 `notes/sub/Project Beta.md`
- 步骤:
  1. 粘贴图片
- 预期:
  - 解析后的目录为 `notes/shared-assets/Project_Beta`

#### TC-PATH-004 自动创建不存在目录

- 状态: `Implemented`
- 前置条件:
  - 指向一个尚不存在的多层目录
- 步骤:
  1. 粘贴图片
- 预期:
  - 所有中间目录自动创建
  - 图片保存成功

#### TC-PATH-005 文件名冲突自动避让

- 状态: `Implemented`
- 前置条件:
  - 目录中已存在目标文件名
  - `renamePattern` 会产生重复名
- 步骤:
  1. 连续保存两次同名结果图片
- 预期:
  - 第二个文件自动附加递增后缀
  - 原文件不被覆盖

### 6. 链接格式化

#### TC-LINK-001 Wiki Link 格式

- 状态: `Implemented`
- 前置条件:
  - `defaultLinkFormat = wiki`
- 步骤:
  1. 粘贴图片
- 预期:
  - 插入 `![[...]]`

#### TC-LINK-002 Markdown Link 格式

- 状态: `Implemented`
- 前置条件:
  - `defaultLinkFormat = markdown`
- 步骤:
  1. 粘贴图片
- 预期:
  - 插入 `![...](...)`

#### TC-LINK-003 Shortest Path 唯一路径

- 状态: `Implemented`
- 前置条件:
  - 仓库内只有一个 `photo.png`
  - `defaultPathFormat = shortest`
- 步骤:
  1. 插入该图片链接
- 预期:
  - 链接只使用文件名

#### TC-LINK-004 Shortest Path 路径冲突

- 状态: `Implemented`
- 前置条件:
  - 仓库内存在两个 `photo.png`
  - `defaultPathFormat = shortest`
- 步骤:
  1. 插入其中一个图片链接
- 预期:
  - 链接退化为可区分路径
  - 不只保留裸文件名

#### TC-LINK-005 Relative Path

- 状态: `Implemented`
- 前置条件:
  - `defaultPathFormat = relative`
- 步骤:
  1. 在子目录笔记中插入上级目录图片
- 预期:
  - 链接包含 `../`

#### TC-LINK-006 Absolute Path

- 状态: `Implemented`
- 前置条件:
  - `defaultPathFormat = absolute`
- 步骤:
  1. 插入图片
- 预期:
  - 路径以 `/` 开头

#### TC-LINK-007 同一笔记混合编码与未编码中文路径

- 状态: `Implemented`
- 前置条件:
  - `defaultLinkFormat = markdown`
  - 当前笔记同时包含 `![A](assets/%E6%89%AF%E7%9A%AE/test.png)` 和 `![B](assets/扯皮/test.png)` 一类的中文图片路径
  - 两条链接都能解析到仓库内实际图片文件
- 步骤:
  1. 执行 `更新图片链接与目录【单文件】`
- 预期:
  - 两条链接都被处理，不出现“部分成功、部分遗漏”
  - 最终链接格式与 `markdownPathEncodingStrategy` 配置一致
  - 图片仍可正常预览

#### TC-LINK-008 单文件命令下载外部图片到本地

- 状态: `Implemented`
- 前置条件:
  - 当前笔记同时包含 `https://...png`、`file://...png` 与 `data:image/png;base64,...` 图片链接
- 步骤:
  1. 执行 `下载外部图片到本地【单文件】`
- 预期:
  - 外部图片被下载到当前配置的输出目录
  - Markdown 中的外部链接被替换为仓库内图片链接
  - 下载失败的条目会保留原文，并在控制台输出错误日志

### 7. 重命名与迁移同步

#### TC-RENAME-001 笔记改名触发图片同步

- 状态: `Implemented`
- 前置条件:
  - `outputFolder = ./assets/${noteFileName}`
  - `renameImagesOnNoteRelocate = true`
  - 笔记已管理至少 2 张图片
- 步骤:
  1. 将 `Daily Note.md` 重命名为 `Daily Note 2.md`
- 预期:
  - 图片目录同步到新目录名
  - 图片文件名按当前规则重算
  - 原笔记内链接全部更新
  - 旧目录为空时被删除

#### TC-RENAME-002 笔记移动触发图片同步

- 状态: `Implemented`
- 前置条件:
  - 笔记及其受管图片已存在
- 步骤:
  1. 将笔记移动到另一个文件夹
- 预期:
  - 受管图片移动到新解析目录
  - 链接仍然有效

#### TC-RENAME-003 关闭 relocate rename

- 状态: `Implemented`
- 前置条件:
  - `renameImagesOnNoteRelocate = false`
- 步骤:
  1. 重命名或移动笔记
- 预期:
  - 图片路径可能变化
  - 图片文件名保持原名
  - 笔记链接更新成功

#### TC-RENAME-004 非 Markdown 文件改名

- 状态: `Implemented`
- 步骤:
  1. 重命名一张图片文件
  2. 观察插件行为
- 预期:
  - 插件不误触发笔记图片同步逻辑
  - 无多余通知

#### TC-RENAME-005 非受管图片不误迁移

- 状态: `Implemented`
- 前置条件:
  - 笔记引用了外部目录图片
  - 同时也有受管图片
- 步骤:
  1. 重命名笔记
- 预期:
  - 仅受管图片被同步
  - 外部引用图片不被移动

### 8. 压缩

#### TC-COMP-001 当前笔记批量压缩命令

- 状态: `Implemented`
- 前置条件:
  - 当前活动视图为 Markdown 笔记
- 步骤:
  1. 在当前笔记中引用 3 张图片
  2. 执行 `压缩图片【单文件】`
- 预期:
  - 3 张图片均被处理
  - 出现批量压缩汇总提示

#### TC-COMP-002 单图右键压缩

- 状态: `Implemented`
- 步骤:
  1. 右键一张图片
  2. 点击 `Compress image`
- 预期:
  - 图片被重写
  - 出现 `Image compressed`

#### TC-COMP-003 显示节省空间通知

- 状态: `Implemented`
- 前置条件:
  - `showSpaceSavedNotification = true`
- 步骤:
  1. 压缩一张体积较大的图片
- 预期:
  - 除压缩成功通知外，出现 `Saved ...`

#### TC-COMP-004 关闭节省空间通知

- 状态: `Implemented`
- 前置条件:
  - `showSpaceSavedNotification = false`
- 步骤:
  1. 压缩图片
- 预期:
  - 不出现 `Saved ...`

#### TC-COMP-005 已很小图片压缩

- 状态: `Implemented`
- 步骤:
  1. 压缩一张小于 50 KB 的图片
- 预期:
  - 流程完成
  - 文件仍可打开
  - 即使体积无明显下降也不报错

#### TC-COMP-006 大图压缩稳定性

- 状态: `Implemented`
- 步骤:
  1. 压缩大于 15 MB 的图片
- 预期:
  - 不崩溃
  - 处理后图片仍可预览
  - UI 最多表现为耗时增加

### 9. 格式转换

#### TC-CONV-001 命令转换为默认格式

- 状态: `Implemented`
- 前置条件:
  - 当前活动视图为 Markdown 笔记
  - 当前笔记至少引用 2 张图片
  - `defaultFormat = png`
- 步骤:
  1. 执行 `转换图片为默认格式【单文件】`
- 预期:
  - 当前笔记引用的图片会批量转换为 `.png`
  - 每张引用图片最多只处理一次
  - 成功通知显示批量转换汇总

#### TC-CONV-002 命令转换为 WebP

- 状态: `Implemented`
- 步骤:
  1. 激活一张 PNG 或 JPG
  2. 执行转换到 `webp`
- 预期:
  - 生成 `.webp`
  - 输出图片仍可预览或打开

#### TC-CONV-003 同格式转换

- 状态: `Implemented`
- 前置条件:
  - 活动文件已是 `webp`
- 步骤:
  1. 执行转换为 WebP
- 预期:
  - 文件被原位更新或保持路径不变
  - 无重复副本泛滥

#### TC-CONV-004 目标路径冲突

- 状态: `Implemented`
- 前置条件:
  - 存在 `aaa.png` 与 `aaa.jpg`
- 步骤:
  1. 先将 `aaa.png` 转换为 `webp`
  2. 再将 `aaa.jpg` 转换为 `webp`
- 预期:
  - 自动生成唯一目标文件名
  - 既有文件不被覆盖
  - 结果类似 `aaa.webp` 与 `aaa-1.webp`
  - 当前活动文件被替换为转换后的文件，不残留未引用的旧格式副本

#### TC-CONV-005 非笔记活动文件

- 状态: `Implemented`
- 步骤:
  1. 激活一张图片或其他非 Markdown 文件
  2. 执行转换命令
- 预期:
  - 提示 `Open a note file first`

#### TC-CONV-006 整库转换风险确认

- 状态: `Implemented`
- 步骤:
  1. 执行 `转换图片为默认格式【整库】`
- 预期:
  - 先弹出风险确认
  - 取消后不执行实际转换
  - 确认后才开始整库处理

#### TC-CONV-007 撤销最近一次转换

- 状态: `Implemented`
- 步骤:
  1. 对一张图片执行一次格式转换
  2. 执行 `恢复：撤销上一步图片管理修改`
- 预期:
  - 图片内容或路径恢复到转换前状态
  - 相关 Markdown 链接同步恢复

#### TC-CONV-008 重做最近一次已撤销转换

- 状态: `Implemented`
- 前置条件:
  - 已执行过一次转换并完成一次撤销
- 步骤:
  1. 执行 `恢复：重做上一步图片管理修改`
- 预期:
  - 最近一次被撤销的转换重新生效
  - 图片内容、路径和相关链接与撤销前一致

### 10. 图片编辑快捷操作

#### TC-EDIT-001 旋转 90 度

- 状态: `Deferred`
- 预期:
  - 当前版本不在 Obsidian 命令列表中提供旋转快捷命令
  - 旋转能力通过图片文件右键菜单验证

#### TC-EDIT-002 水平翻转

- 状态: `Deferred`
- 预期:
  - 当前版本不在 Obsidian 命令列表中提供水平翻转快捷命令
  - 水平翻转能力通过图片文件右键菜单验证

#### TC-EDIT-002B 垂直翻转

- 状态: `Deferred`
- 预期:
  - 当前版本不在 Obsidian 命令列表中提供垂直翻转快捷命令
  - 垂直翻转能力通过图片文件右键菜单验证

#### TC-EDIT-003 右键旋转

- 状态: `Implemented`
- 步骤:
  1. 右键图片
  2. 选择 `Rotate 90 degrees`
- 预期:
  - 图片顺时针旋转 90 度
  - 图片仍可打开

#### TC-EDIT-004 右键翻转

- 状态: `Implemented`
- 步骤:
  1. 右键图片
  2. 选择 `Flip horizontal`
- 预期:
  - 图片水平翻转
  - 图片仍可打开

#### TC-EDIT-006 Markdown 预览自动刷新

- 状态: `Implemented`
- 前置条件:
  - 当前 Markdown 笔记已引用一张图片
- 步骤:
  1. 在图片文件页或右键菜单中执行旋转或翻转
  2. 回到引用该图的 Markdown 预览
- 预期:
  - 图片文件内容已更新
  - Markdown 预览自动刷新为新内容

#### TC-EDIT-007 无需切换文件即可看到最终预览

- 状态: `Implemented`
- 前置条件:
  - 左右分栏同时打开一张图片文件和引用该图片的 Markdown 预览
- 步骤:
  1. 在图片文件页执行旋转、翻转、压缩或转换
  2. 保持 Markdown 预览页停留在原标签，不手动切换到其他文件
- 预期:
  - 当前预览中的图片自动更新
  - 不需要切换到其他文件再切回才能看到最终结果

#### TC-EDIT-005 交互式编辑器

- 状态: `Partial`
- 目标: 明确当前未交付项
- 预期:
  - 当前版本不存在完整交互式画布编辑 UI
  - 不应将此项标记为通过

### 11. 缩放

#### TC-RESIZE-001 1920 边界缩放

- 状态: `Deferred`
- 前置条件:
  - 活动图片宽或高大于 1920
- 预期:
  - 当前版本不在 Obsidian 命令列表中提供 1920 边界缩放命令
  - 不应将此项标记为通过

#### TC-RESIZE-002 小图缩放

- 状态: `Deferred`
- 前置条件:
  - 图片尺寸小于 1920
- 预期:
  - 当前版本不在 Obsidian 命令列表中提供缩放命令
  - 不应将此项标记为通过

#### TC-RESIZE-003 高级缩放预设

- 状态: `Deferred`
- 预期:
  - 当前版本不存在多预设 UI
  - 不应将此项标记为通过

### 12. 右键菜单

#### TC-MENU-001 仅图片显示菜单

- 状态: `Implemented`
- 步骤:
  1. 右键图片文件
  2. 右键 Markdown 文件
  3. 右键 PDF 文件
- 预期:
  - 仅图片文件显示插件菜单项

#### TC-MENU-002 菜单项完整性

- 状态: `Implemented`
- 步骤:
  1. 右键图片文件
- 预期:
  - 出现 `复制图片到剪贴板`
  - 出现 `压缩图片`
  - 出现 `转换为默认格式`
  - 出现 `拖拽裁剪`
  - 出现 `顺时针旋转 90°`
  - 出现 `水平翻转`
  - 出现 `垂直翻转`
  - 不额外出现插件自带的重复删除项

#### TC-MENU-003 复制到剪贴板

- 状态: `Implemented`
- 步骤:
  1. 右键图片，选择复制
  2. 粘贴到外部图像工具或聊天框
- 预期:
  - 剪贴板中存在图片数据

#### TC-MENU-004 删除图片

- 状态: `Implemented`
- 步骤:
  1. 右键图片，选择删除
- 预期:
  - 文件进入回收站或被删除
  - Vault 中文件消失

### 13. 画廊

#### TC-GAL-001 当前笔记画廊打开

- 状态: `Implemented`
- 前置条件:
  - 当前笔记引用多张图片
- 步骤:
  1. 执行 `Open current note image gallery`
- 预期:
  - 弹出画廊模态框
  - 标题显示当前笔记名

#### TC-GAL-002 当前文件夹画廊打开

- 状态: `Implemented`
- 前置条件:
  - 当前目录包含多张图片
- 步骤:
  1. 执行 `Open current folder image gallery`
- 预期:
  - 弹出画廊模态框
  - 显示当前文件夹图片

#### TC-GAL-003 Gallery 关闭开关

- 状态: `Implemented`
- 前置条件:
  - `enableGallery = false`
- 步骤:
  1. 执行任一画廊命令
- 预期:
  - 不打开画廊
  - 显示禁用提示

#### TC-GAL-004 点击缩略图打开灯箱预览

- 状态: `Implemented`
- 前置条件:
  - 当前笔记或当前文件夹画廊中至少有一张带缩略图的图片
- 步骤:
  1. 打开任一画廊
  2. 点击任一缩略图
- 预期:
  - 弹出灯箱层
  - 大图区域显示实际图片，而不是空白
  - 标题、尺寸信息和分页计数同时更新

#### TC-GAL-005 搜索过滤

- 状态: `Implemented`
- 前置条件:
  - 画廊中有 `alpha.png`、`beta.png`
- 步骤:
  1. 在搜索框输入 `alpha`
- 预期:
  - 仅显示 `alpha` 相关图片

#### TC-GAL-006 排序按时间

- 状态: `Implemented`
- 步骤:
  1. 在画廊选择 `Newest first`
- 预期:
  - 按修改时间倒序显示

#### TC-GAL-007 排序按名称

- 状态: `Implemented`
- 步骤:
  1. 在画廊选择 `Name`
- 预期:
  - 按名称升序

#### TC-GAL-008 排序按大小

- 状态: `Implemented`
- 步骤:
  1. 在画廊选择 `Largest first`
- 预期:
  - 按体积降序

#### TC-GAL-009 网格视图切换

- 状态: `Implemented`
- 步骤:
  1. 点击 `Grid`
- 预期:
  - 图片以网格布局展示

#### TC-GAL-010 列表视图切换

- 状态: `Implemented`
- 步骤:
  1. 点击 `List`
- 预期:
  - 图片以单列列表展示

#### TC-GAL-011 无结果过滤

- 状态: `Implemented`
- 步骤:
  1. 输入不存在的关键字
- 预期:
  - 显示 `No images match the current filter.`

#### TC-GAL-012 缩略图资源可见

- 状态: `Implemented`
- 步骤:
  1. 打开画廊
- 预期:
  - 若资源路径可用，显示缩略图
  - 名称和尺寸元信息同时显示

### 14. 批处理

#### TC-BATCH-001 当前笔记批处理压缩

- 状态: `Implemented`
- 步骤:
  1. 当前笔记引用 5 张图片
  2. 执行 `Batch compress images in current note`
- 预期:
  - 创建批任务
  - 5 张图片被依次处理
  - 完成通知显示成功数量

#### TC-BATCH-002 当前文件夹批处理压缩

- 状态: `Implemented`
- 步骤:
  1. 当前目录包含多张图片
  2. 执行 `Batch compress images in current folder`
- 预期:
  - 当前文件夹及其子目录图片被处理

#### TC-BATCH-003 Vault 范围批处理压缩

- 状态: `Implemented`
- 步骤:
  1. 执行 `压缩图片【整库】`
- 预期:
  - 遍历 Vault 中所有受支持图片
  - 执行完成后返回完成通知

#### TC-BATCH-004 批处理暂停

- 状态: `Implemented`
- 前置条件:
  - Vault 中有足够多的大图以便观察过程
- 步骤:
  1. 启动 Vault 批处理
  2. 在处理中执行 `Pause active image batch job`
- 预期:
  - 当前任务进入暂停状态
  - 后续任务暂不继续推进

#### TC-BATCH-005 批处理恢复

- 状态: `Implemented`
- 前置条件:
  - 已存在暂停中的任务
- 步骤:
  1. 执行 `Resume active image batch job`
- 预期:
  - 任务恢复执行
  - 最终正常完成

#### TC-BATCH-006 批处理取消

- 状态: `Implemented`
- 前置条件:
  - 已存在运行中的任务
- 步骤:
  1. 执行 `Cancel active image batch job`
- 预期:
  - 任务状态变为取消
  - 不再继续处理剩余文件

#### TC-BATCH-007 并发任务保护

- 状态: `Implemented`
- 步骤:
  1. 启动一个批任务
  2. 在其未结束前再次启动另一个批任务
- 预期:
  - 第二个任务不应无保护地并发运行
  - 应保持已有任务唯一性约束

#### TC-BATCH-008 部分失败不中断整体

- 状态: `Implemented`
- 前置条件:
  - 准备一组图片，其中至少一张人为制造处理失败条件
- 步骤:
  1. 运行批处理
- 预期:
  - 可处理文件继续执行
  - 最终报告失败计数大于 0
  - 状态为 `completed-with-errors`

### 15. 预览装饰

#### TC-PREVIEW-001 渲染图片标记样式类

- 状态: `Implemented`
- 步骤:
  1. 在笔记预览模式打开包含图片的文档
  2. 使用开发者工具检查渲染后的 `img`
- 预期:
  - 图片节点包含 `image-manager-managed` class

#### TC-PREVIEW-002 预览支持编码与未编码中文路径混用

- 状态: `Implemented`
- 前置条件:
  - 当前笔记同时包含编码中文路径和未编码中文路径的 Markdown 图片链接
  - 两类链接都指向仓库内现有图片
- 步骤:
  1. 在阅读视图打开该笔记
  2. 使用开发者工具检查图片元素
- 预期:
  - 两类图片都能正常渲染
  - 渲染后的图片元素带有 `data-image-manager-path`
  - 不出现只显示其中一种路径、另一种为空白的情况

#### TC-PREVIEW-003 阅读视图右键仅导入当前外部图片

- 状态: `Implemented`
- 前置条件:
  - 当前笔记包含至少 2 张外部图片
  - `enableContextMenu = true`
- 步骤:
  1. 在阅读视图打开该笔记
  2. 右键其中一张外部图片
  3. 执行 `下载该外部图片到本地`
- 预期:
  - 只下载当前右键选中的那一张外部图片
  - 当前笔记中只有对应那一条外部图片链接被改写为本地链接
  - 其他外部图片链接保持不变

### 16. File Manager 服务边界场景

#### TC-FM-001 支持图片类型识别

- 状态: `Implemented`
- 步骤:
  1. 对 `png`、`jpg`、`jpeg`、`gif`、`webp`、`bmp`、`svg`、`tif`、`tiff`、`heic`、`avif` 分别执行文件菜单验证
- 预期:
  - 这些扩展名均被识别为图片
  - 其中 `svg`、`tif`、`tiff`、`heic`、`avif` 的实际处理成功率取决于当前运行时解码 / 编码能力，不能只凭扩展名判定为可转换或可压缩

#### TC-FM-002 非图片类型识别

- 状态: `Implemented`
- 步骤:
  1. 对 `txt`、`pdf`、`md` 验证
- 预期:
  - 不被识别为图片

#### TC-FM-003 远程图片下载接口

- 状态: `Implemented`
- 目标: 服务层能力验证
- 步骤:
  1. 在集成或手工调试环境中调用 `saveRemoteImage`
- 预期:
  - 远程图片下载成功后按命名规则落盘

#### TC-FM-004 无后缀远程图片导入

- 状态: `Implemented`
- 前置条件:
  - 当前笔记包含 `![Remote](https://cdn.example.com/render?id=42)` 一类无后缀图片链接
- 步骤:
  1. 执行 `下载外部图片到本地`
- 预期:
  - 插件会按响应 `content-type` 判断该资源是否为图片
  - 若为图片，则成功导入并改写为本地链接
  - 若不是图片，则保持原链接并提示失败

#### TC-FM-005 AVIF 分层兼容

- 状态: `Implemented`
- 前置条件:
  - 仓库内存在 `photo.avif`
- 步骤:
  1. 在 Markdown 笔记中引用 `photo.avif`
  2. 执行 `转换图片为默认格式【单文件】`
  3. 直接对 `photo.avif` 尝试压缩、裁剪、旋转或缩放
- 预期:
  - `AVIF` 会被识别为图片，并能参与当前笔记范围的转换
  - 转换后生成默认格式文件，并改写笔记链接
  - 原位压缩、裁剪、旋转、翻转和缩放会被拦截，并提示先转换到 `PNG`、`JPEG` 或 `WebP`

### 17. 文档与状态一致性

#### TC-DOC-001 功能状态列表一致性

- 状态: `Implemented`
- 步骤:
  1. 对照设置页 `功能状态`
  2. 对照 `docs/task-status.md`
- 预期:
  - 已实现、规划中和部分实现描述基本一致
  - 去水印在设置页与文档中都只作为规划项出现

#### TC-DOC-002 测试文档覆盖性

- 状态: `Implemented`
- 步骤:
  1. 对照 `docs/user-guide.md`
  2. 对照 `docs/architecture.md`
  3. 对照命令列表和右键菜单列表
- 预期:
  - 本文档覆盖所有当前交付功能点

## 延后测试用例

### TC-DEFER-001 编辑器内交互式拖拽缩放

- 状态: `Deferred`
- 预期:
  - 当前版本无正式实现
  - 不执行通过性验收

### TC-DEFER-002 OCR

- 状态: `Deferred`
- 预期:
  - 当前版本无正式实现

### TC-DEFER-003 图片搜索和分类

- 状态: `Deferred`
- 预期:
  - 当前版本无正式实现

### TC-DEFER-004 Worker 后台处理

- 状态: `Deferred`
- 预期:
  - 当前版本无正式实现

## 回归检查清单

- 修改设置后，粘贴流程仍然正常。
- 笔记移动后，重命名流程仍会更新笔记中的图片链接。
- 压缩不会破坏图片可读性。
- 转换不会覆盖无关文件。
- 大批量处理后，画廊仍可正常使用。
- 批处理暂停与恢复不会让队列死锁。
- 右键菜单可见性仍然遵循设置开关。
- 插件重载不会重复注册事件处理器。
- 在不支持 `Setting.setErrorMessage` 的 Obsidian 版本上，设置页仍能正常渲染。
- 图片重写后，Markdown 预览会重新渲染。
- 同一篇笔记混合编码中文路径与未编码中文路径时，链接更新、转换、预览结果一致。
- `下载外部图片到本地` 会同步下载 `URL`、`file://`、`data:image/...;base64,...` 图片源，并改写为本地链接。
- 开启 `删除孤立图片` 后，当前笔记范围不会在自定义 `outputFolder` 缺失时回退扫描笔记目录。
- `删除多余图片文件` 删除孤立图片后，会按设置继续清理因此变空的附件目录。
- 点击画廊缩略图时，灯箱大图不为空白。
