# Test Cases

## Scope

This document covers the current delivered and partially delivered feature set of `obsidian-image-manager`.

Status mapping:

- `Implemented`: can be executed against the current plugin build
- `Partial`: executable, but only the currently delivered subset should pass
- `Deferred`: reserved for future implementation and should not be marked as pass for the current release

## Test Environment

### Required environment

- Obsidian desktop
- A test vault with community plugins enabled
- Plugin build artifacts copied into `.obsidian/plugins/obsidian-image-manager/`
- Current plugin version loaded and enabled

### Recommended test data

- Markdown notes
  - `notes/Daily Note.md`
  - `notes/Project Alpha.md`
  - `notes/sub/Project Beta.md`
- Image files
  - `fixtures/photo.png`
  - `fixtures/photo.jpg`
  - `fixtures/diagram.webp`
  - `fixtures/large-photo.jpg` greater than 5 MB
  - `fixtures/very-large-photo.png` greater than 15 MB
  - `fixtures/duplicate-name/photo.png`
  - `fixtures/duplicate-name/sub/photo.png`
- Non-image files
  - `fixtures/readme.txt`
  - `fixtures/sample.pdf`
- Optional remote image URL for manual verification

### Recommended default settings baseline

- `defaultFormat = webp`
- `defaultQuality = 80`
- `defaultLinkFormat = wiki`
- `defaultPathFormat = shortest`
- `renamePattern = {noteName}-{date}-{random}`
- `outputFolder = ./assets/${noteFileName}`
- `enableAutoConvert = true`
- `enableGallery = true`
- `enableContextMenu = true`
- `renameImagesOnNoteRelocate = true`
- `dropPasteCursorLocation = back`
- `showSpaceSavedNotification = true`
- `compressionQuality = 80`

## Execution Rules

- Each case should record `Pass`, `Fail`, `Blocked`, or `Not Applicable`.
- For file-system assertions, verify both Obsidian file explorer state and actual vault files.
- For link assertions, verify the final Markdown source, not only rendered preview.
- For file processing assertions, verify extension, file size trend, file readability, and whether links still resolve.

## Detailed Test Cases

### 1. Plugin Loading And Initialization

#### TC-INIT-001 插件首次加载

- Status: `Implemented`
- Objective: 验证插件能够正常加载并显示加载通知
- Preconditions:
  - 插件目录已复制 `manifest.json`、`main.js`、`styles.css`
  - Obsidian 已打开测试仓库
- Steps:
  1. 在 Obsidian 中启用 `Image Manager`
  2. 观察插件加载过程
  3. 打开开发者控制台查看是否有报错
- Expected:
  - 插件成功启用
  - 显示 `Image Manager loaded`
  - 控制台无未捕获异常
  - 设置页出现 `Image Manager`

#### TC-INIT-002 插件重载

- Status: `Implemented`
- Objective: 验证多次重载后不重复注册异常事件
- Preconditions:
  - 插件已启用
- Steps:
  1. 执行插件重载 3 次
  2. 每次重载后执行一次 `Process images in current note`
  3. 观察命令执行次数和通知次数
- Expected:
  - 命令每次只执行一次
  - 不出现重复通知暴增
  - 无明显事件重复注册现象

### 2. Settings UI

#### TC-SET-001 设置页渲染

- Status: `Implemented`
- Objective: 验证设置页完整渲染
- Steps:
  1. 打开 `Settings -> Image Manager`
  2. 检查分组区域
- Expected:
  - 显示 `Save and rename`
  - 显示 `Convert and compress`
  - 显示 `Editor and paste behavior`
  - 显示 `Gallery`
  - 显示 `Feature delivery status`
  - 显示 `图片文件保存位置`
  - 显示 `生成的图片文件名`
  - 显示两个预览块
  - 控制台无 `setErrorMessage is not a function`

#### TC-SET-002 下拉设置持久化

- Status: `Implemented`
- Objective: 验证下拉项变更后持久化
- Steps:
  1. 将 `Default image format` 设为 `png`
  2. 将 `Default link format` 设为 `markdown`
  3. 重载插件
  4. 返回设置页检查
- Expected:
  - 设置值保持为上次修改结果

#### TC-SET-003 文本设置持久化

- Status: `Implemented`
- Objective: 验证文本项持久化
- Steps:
  1. 将 `Rename pattern` 改为 `{noteName}-{fileName}`
  2. 将 `Output folder` 改为 `./media/${noteFileName}`
  3. 重载插件
- Expected:
  - 两个文本值保持不变

#### TC-SET-006 旧版 Obsidian 设置兼容性

- Status: `Implemented`
- Objective: 验证设置页在不支持 `Setting.setErrorMessage()` 的运行环境中仍可用
- Steps:
  1. 在目标 Obsidian 版本打开 `Settings -> Image Manager`
  2. 修改 `图片文件保存位置`
  3. 修改 `生成的图片文件名`
- Expected:
  - 设置页完整渲染
  - 输入变更可保存
  - 控制台不存在未捕获的 `TypeError`

#### TC-SET-004 Slider 设置边界

- Status: `Implemented`
- Objective: 验证质量滑块最小和最大值
- Steps:
  1. 将 `Default image quality` 调到 `1`
  2. 执行一次图片转换
  3. 将 `Default image quality` 调到 `100`
  4. 再执行一次图片转换
- Expected:
  - 两次处理都完成
  - 无崩溃
  - 输出文件可打开

#### TC-SET-005 开关设置即时生效

- Status: `Implemented`
- Objective: 验证 `Enable context menu actions` 和 `Enable gallery` 无需重载即时生效
- Steps:
  1. 关闭 `Enable context menu actions`
  2. 右键图片文件
  3. 打开 `Enable context menu actions`
  4. 再次右键图片文件
  5. 关闭 `Enable gallery`
  6. 执行画廊命令
- Expected:
  - 关闭时不出现插件菜单项
  - 开启后立即出现
  - 关闭画廊后命令弹出 `Gallery is disabled in settings`

### 3. Variable Resolver And Rename Rules

#### TC-VAR-001 `{noteName}` 替换

- Status: `Implemented`
- Preconditions:
  - 当前笔记为 `Project Alpha.md`
  - `renamePattern = {noteName}`
- Steps:
  1. 向笔记粘贴一张图片
- Expected:
  - 生成文件名主体为 `Project_Alpha`

#### TC-VAR-002 `{fileName}` 替换

- Status: `Implemented`
- Preconditions:
  - `renamePattern = {fileName}`
  - 使用名为 `photo 1.png` 的图片
- Steps:
  1. 粘贴图片
- Expected:
  - 文件名主体为 `photo_1`

#### TC-VAR-003 `{date}` `{time}` 生成格式

- Status: `Implemented`
- Preconditions:
  - `renamePattern = {date}-{time}`
- Steps:
  1. 粘贴图片
- Expected:
  - 文件名包含 `YYYY-MM-DD`
  - 文件名包含 `HH-MM-SS`

#### TC-VAR-004 `{random}` 唯一性

- Status: `Implemented`
- Preconditions:
  - `renamePattern = {random}`
- Steps:
  1. 连续粘贴两张同源图片
- Expected:
  - 两个文件名不同

#### TC-VAR-005 `${name}` 语法兼容

- Status: `Implemented`
- Preconditions:
  - `renamePattern = ${noteFileName}-${fileName}`
- Steps:
  1. 粘贴图片
- Expected:
  - 文件名正确解析
  - 不残留 `${...}` 原文

#### TC-VAR-006 非法字符清理

- Status: `Implemented`
- Preconditions:
  - 笔记名包含空格和特殊字符，例如 `Plan: Q3/2026`
  - `renamePattern = {noteName}-{fileName}`
- Steps:
  1. 粘贴图片
- Expected:
  - 输出文件名不包含 `<>:"/\\|?*`
  - 空格被标准化

#### TC-VAR-007 未知变量剔除

- Status: `Implemented`
- Preconditions:
  - `renamePattern = {noteName}-{unknown}-{fileName}`
- Steps:
  1. 粘贴图片
- Expected:
  - 文件名中不保留 `{unknown}`
  - 其余变量正常解析

#### TC-VAR-008 相邻重复变量自动去重

- Status: `Implemented`
- Preconditions:
  - 当前笔记名为 `2026-06-23`
  - `renamePattern = {noteName}-{date}-{time}`
- Steps:
  1. 粘贴图片
- Expected:
  - 文件名为 `2026-06-23-HH-MM-SS`
  - 不出现 `2026-06-23-2026-06-23-...`

### 4. Paste And Save Flow

#### TC-PASTE-001 粘贴单张图片

- Status: `Implemented`
- Objective: 验证基础粘贴保存链路
- Steps:
  1. 打开 `Daily Note.md`
  2. 从系统剪贴板粘贴一张图片
- Expected:
  - 图片被保存到 `outputFolder` 指定目录
  - Markdown 中插入一条图片链接
  - 链接可正常预览

#### TC-PASTE-002 一次粘贴多张图片

- Status: `Implemented`
- Steps:
  1. 使用支持多图片的剪贴板来源
  2. 一次性粘贴多张图片
- Expected:
  - 所有图片均被保存
  - 链接逐行插入
  - 无遗漏

#### TC-PASTE-003 非图片粘贴不拦截

- Status: `Implemented`
- Steps:
  1. 复制纯文本
  2. 在笔记中粘贴
- Expected:
  - 插件不接管
  - 文本正常粘贴

#### TC-PASTE-004 无活动 Markdown 视图时粘贴

- Status: `Implemented`
- Steps:
  1. 切换到非 Markdown 视图
  2. 粘贴图片
- Expected:
  - 插件不报错
  - 不进行异常文件保存

#### TC-PASTE-005 自动转换开启

- Status: `Implemented`
- Preconditions:
  - `enableAutoConvert = true`
  - `defaultFormat = webp`
- Steps:
  1. 粘贴一张 PNG
- Expected:
  - 输出文件扩展名为 `.webp`
  - 插入链接指向 `.webp`

#### TC-PASTE-006 自动转换关闭

- Status: `Implemented`
- Preconditions:
  - `enableAutoConvert = false`
- Steps:
  1. 粘贴一张 PNG
- Expected:
  - 输出保持原始扩展名

#### TC-PASTE-007 光标位置 back

- Status: `Implemented`
- Preconditions:
  - `dropPasteCursorLocation = back`
- Steps:
  1. 在一段文字中间粘贴图片
- Expected:
  - 光标位于新插入链接之后

#### TC-PASTE-008 光标位置 front

- Status: `Implemented`
- Preconditions:
  - `dropPasteCursorLocation = front`
- Steps:
  1. 在一段文字中间粘贴图片
- Expected:
  - 光标停留在插入前的位置或插入起始附近
  - 行为与 `back` 明显不同

### 5. Output Folder And Path Resolution

#### TC-PATH-001 空输出目录

- Status: `Implemented`
- Preconditions:
  - `outputFolder = ""`
- Steps:
  1. 在 `notes/Daily Note.md` 粘贴图片
- Expected:
  - 图片保存到当前笔记所在目录

#### TC-PATH-002 相对输出目录

- Status: `Implemented`
- Preconditions:
  - `outputFolder = ./assets/${noteFileName}`
- Steps:
  1. 在 `notes/Daily Note.md` 粘贴图片
- Expected:
  - 图片保存在 `notes/assets/Daily_Note/`

#### TC-PATH-006 粘贴接管关闭时不使用插件保存目录

- Status: `Implemented`
- Preconditions:
  - `outputFolder = ./assets/${noteFileName}`
  - `enablePasteHandler = false`
- Steps:
  1. 在 Obsidian 中粘贴图片
- Expected:
  - 插件不接管保存流程
  - 图片保存位置由 Obsidian 原生逻辑或其他插件决定

#### TC-PATH-003 跨层相对目录

- Status: `Implemented`
- Preconditions:
  - `outputFolder = ../shared-assets/${noteFileName}`
  - 当前笔记位于 `notes/sub/Project Beta.md`
- Steps:
  1. 粘贴图片
- Expected:
  - 解析后的目录为 `notes/shared-assets/Project_Beta`

#### TC-PATH-004 自动创建不存在目录

- Status: `Implemented`
- Preconditions:
  - 指向一个尚不存在的多层目录
- Steps:
  1. 粘贴图片
- Expected:
  - 所有中间目录自动创建
  - 图片保存成功

#### TC-PATH-005 文件名冲突自动避让

- Status: `Implemented`
- Preconditions:
  - 目录中已存在目标文件名
  - `renamePattern` 会产生重复名
- Steps:
  1. 连续保存两次同名结果图片
- Expected:
  - 第二个文件自动附加递增后缀
  - 原文件不被覆盖

### 6. Link Formatting

#### TC-LINK-001 Wiki Link 格式

- Status: `Implemented`
- Preconditions:
  - `defaultLinkFormat = wiki`
- Steps:
  1. 粘贴图片
- Expected:
  - 插入 `![[...]]`

#### TC-LINK-002 Markdown Link 格式

- Status: `Implemented`
- Preconditions:
  - `defaultLinkFormat = markdown`
- Steps:
  1. 粘贴图片
- Expected:
  - 插入 `![...](...)`

#### TC-LINK-003 Shortest Path 唯一路径

- Status: `Implemented`
- Preconditions:
  - 仓库内只有一个 `photo.png`
  - `defaultPathFormat = shortest`
- Steps:
  1. 插入该图片链接
- Expected:
  - 链接只使用文件名

#### TC-LINK-004 Shortest Path 路径冲突

- Status: `Implemented`
- Preconditions:
  - 仓库内存在两个 `photo.png`
  - `defaultPathFormat = shortest`
- Steps:
  1. 插入其中一个图片链接
- Expected:
  - 链接退化为可区分路径
  - 不只保留裸文件名

#### TC-LINK-005 Relative Path

- Status: `Implemented`
- Preconditions:
  - `defaultPathFormat = relative`
- Steps:
  1. 在子目录笔记中插入上级目录图片
- Expected:
  - 链接包含 `../`

#### TC-LINK-006 Absolute Path

- Status: `Implemented`
- Preconditions:
  - `defaultPathFormat = absolute`
- Steps:
  1. 插入图片
- Expected:
  - 路径以 `/` 开头

### 7. Rename And Relocation Sync

#### TC-RENAME-001 笔记改名触发图片同步

- Status: `Implemented`
- Preconditions:
  - `outputFolder = ./assets/${noteFileName}`
  - `renameImagesOnNoteRelocate = true`
  - 笔记已管理至少 2 张图片
- Steps:
  1. 将 `Daily Note.md` 重命名为 `Daily Note 2.md`
- Expected:
  - 图片目录同步到新目录名
  - 图片文件名按当前规则重算
  - 原笔记内链接全部更新
  - 旧目录为空时被删除

#### TC-RENAME-002 笔记移动触发图片同步

- Status: `Implemented`
- Preconditions:
  - 笔记及其受管图片已存在
- Steps:
  1. 将笔记移动到另一个文件夹
- Expected:
  - 受管图片移动到新解析目录
  - 链接仍然有效

#### TC-RENAME-003 关闭 relocate rename

- Status: `Implemented`
- Preconditions:
  - `renameImagesOnNoteRelocate = false`
- Steps:
  1. 重命名或移动笔记
- Expected:
  - 图片路径可能变化
  - 图片文件名保持原名
  - 笔记链接更新成功

#### TC-RENAME-004 非 Markdown 文件改名

- Status: `Implemented`
- Steps:
  1. 重命名一张图片文件
  2. 观察插件行为
- Expected:
  - 插件不误触发笔记图片同步逻辑
  - 无多余通知

#### TC-RENAME-005 非受管图片不误迁移

- Status: `Implemented`
- Preconditions:
  - 笔记引用了外部目录图片
  - 同时也有受管图片
- Steps:
  1. 重命名笔记
- Expected:
  - 仅受管图片被同步
  - 外部引用图片不被移动

### 8. Compression

#### TC-COMP-001 当前笔记批量压缩命令

- Status: `Implemented`
- Steps:
  1. 在当前笔记中引用 3 张图片
  2. 执行 `Process images in current note`
- Expected:
  - 3 张图片均被处理
  - 出现 `Processed 3 images`

#### TC-COMP-002 单图右键压缩

- Status: `Implemented`
- Steps:
  1. 右键一张图片
  2. 点击 `Compress image`
- Expected:
  - 图片被重写
  - 出现 `Image compressed`

#### TC-COMP-003 显示节省空间通知

- Status: `Implemented`
- Preconditions:
  - `showSpaceSavedNotification = true`
- Steps:
  1. 压缩一张体积较大的图片
- Expected:
  - 除压缩成功通知外，出现 `Saved ...`

#### TC-COMP-004 关闭节省空间通知

- Status: `Implemented`
- Preconditions:
  - `showSpaceSavedNotification = false`
- Steps:
  1. 压缩图片
- Expected:
  - 不出现 `Saved ...`

#### TC-COMP-005 已很小图片压缩

- Status: `Implemented`
- Steps:
  1. 压缩一张小于 50 KB 的图片
- Expected:
  - 流程完成
  - 文件仍可打开
  - 即使体积无明显下降也不报错

#### TC-COMP-006 大图压缩稳定性

- Status: `Implemented`
- Steps:
  1. 压缩大于 15 MB 的图片
- Expected:
  - 不崩溃
  - 处理后图片仍可预览
  - UI 最多表现为耗时增加

### 9. Format Conversion

#### TC-CONV-001 命令转换为默认格式

- Status: `Implemented`
- Preconditions:
  - 活动文件为图片
  - `defaultFormat = png`
- Steps:
  1. 执行 `Convert active image to default format`
- Expected:
  - 输出文件扩展名变为 `.png`
  - 成功通知显示

#### TC-CONV-002 命令转换为 WebP

- Status: `Implemented`
- Steps:
  1. 激活一张 JPG
  2. 执行 `Convert active image to WebP`
- Expected:
  - 生成 `.webp`

#### TC-CONV-003 同格式转换

- Status: `Implemented`
- Preconditions:
  - 活动文件已是 `webp`
- Steps:
  1. 执行转换为 WebP
- Expected:
  - 文件被原位更新或保持路径不变
  - 无重复副本泛滥

#### TC-CONV-004 目标路径冲突

- Status: `Implemented`
- Preconditions:
  - 目标格式同名文件已存在
- Steps:
  1. 对图片执行格式转换
- Expected:
  - 自动生成唯一目标文件名
  - 既有文件不被覆盖
  - 当前活动文件被替换为转换后的文件，不残留未引用的旧格式副本

#### TC-CONV-005 非图片活动文件

- Status: `Implemented`
- Steps:
  1. 激活 Markdown 文件
  2. 执行转换命令
- Expected:
  - 提示 `Open an image file first`

### 10. Image Editor Quick Actions

#### TC-EDIT-001 旋转 90 度

- Status: `Implemented`
- Steps:
  1. 对一张横图执行 `Rotate active image 90 degrees`
- Expected:
  - 图像旋转成功
  - 宽高方向互换
  - 图片仍可打开

#### TC-EDIT-002 水平翻转

- Status: `Implemented`
- Steps:
  1. 执行 `Flip active image horizontally`
- Expected:
  - 图像左右翻转
  - 图片仍可打开

#### TC-EDIT-002B 垂直翻转

- Status: `Implemented`
- Steps:
  1. 执行 `Flip active image vertically`
- Expected:
  - 图像上下翻转
  - 图片仍可打开

#### TC-EDIT-003 右键旋转

- Status: `Implemented`
- Steps:
  1. 右键图片
  2. 选择 `Rotate 90 degrees`
- Expected:
  - 与命令面板旋转结果一致

#### TC-EDIT-004 右键翻转

- Status: `Implemented`
- Steps:
  1. 右键图片
  2. 选择 `Flip horizontal`
- Expected:
  - 与命令面板翻转结果一致

#### TC-EDIT-006 Markdown 预览自动刷新

- Status: `Implemented`
- Preconditions:
  - 当前 Markdown 笔记已引用一张图片
- Steps:
  1. 在图片文件页或右键菜单中执行旋转或翻转
  2. 回到引用该图的 Markdown 预览
- Expected:
  - 图片文件内容已更新
  - Markdown 预览自动刷新为新内容

#### TC-EDIT-005 交互式编辑器

- Status: `Partial`
- Objective: 明确当前未交付项
- Expected:
  - 当前版本不存在完整交互式画布编辑 UI
  - 不应将此项标记为通过

### 11. Resize

#### TC-RESIZE-001 1920 边界缩放

- Status: `Implemented`
- Preconditions:
  - 活动图片宽或高大于 1920
- Steps:
  1. 执行 `Resize active image to 1920px bounding box`
- Expected:
  - 输出宽高均不超过 1920
  - 原始长宽比保持合理

#### TC-RESIZE-002 小图缩放

- Status: `Implemented`
- Preconditions:
  - 图片尺寸小于 1920
- Steps:
  1. 执行缩放命令
- Expected:
  - 不崩溃
  - 不应出现明显异常放大失真逻辑错误

#### TC-RESIZE-003 高级缩放预设

- Status: `Partial`
- Expected:
  - 当前版本只有固定预设命令
  - 不存在多预设 UI，不应标记为通过

### 12. Context Menu

#### TC-MENU-001 仅图片显示菜单

- Status: `Implemented`
- Steps:
  1. 右键图片文件
  2. 右键 Markdown 文件
  3. 右键 PDF 文件
- Expected:
  - 仅图片文件显示插件菜单项

#### TC-MENU-002 菜单项完整性

- Status: `Implemented`
- Steps:
  1. 右键图片文件
- Expected:
  - 出现 `Copy image to clipboard`
  - 出现 `Compress image`
  - 出现 `Convert to WebP`
  - 出现 `Rotate 90 degrees`
  - 出现 `Flip horizontal`
  - 出现 `Flip vertical`
  - 不额外出现插件自带的重复删除项

#### TC-MENU-003 复制到剪贴板

- Status: `Implemented`
- Steps:
  1. 右键图片，选择复制
  2. 粘贴到外部图像工具或聊天框
- Expected:
  - 剪贴板中存在图片数据

#### TC-MENU-004 删除图片

- Status: `Implemented`
- Steps:
  1. 右键图片，选择删除
- Expected:
  - 文件进入回收站或被删除
  - Vault 中文件消失

### 13. Gallery

#### TC-GAL-001 当前笔记画廊打开

- Status: `Implemented`
- Preconditions:
  - 当前笔记引用多张图片
- Steps:
  1. 执行 `Open current note image gallery`
- Expected:
  - 弹出画廊模态框
  - 标题显示当前笔记名

#### TC-GAL-002 当前文件夹画廊打开

- Status: `Implemented`
- Preconditions:
  - 当前目录包含多张图片
- Steps:
  1. 执行 `Open current folder image gallery`
- Expected:
  - 弹出画廊模态框
  - 显示当前文件夹图片

#### TC-GAL-003 Gallery 关闭开关

- Status: `Implemented`
- Preconditions:
  - `enableGallery = false`
- Steps:
  1. 执行任一画廊命令
- Expected:
  - 不打开画廊
  - 显示禁用提示

#### TC-GAL-004 搜索过滤

- Status: `Implemented`
- Preconditions:
  - 画廊中有 `alpha.png`、`beta.png`
- Steps:
  1. 在搜索框输入 `alpha`
- Expected:
  - 仅显示 `alpha` 相关图片

#### TC-GAL-005 排序按时间

- Status: `Implemented`
- Steps:
  1. 在画廊选择 `Newest first`
- Expected:
  - 按修改时间倒序显示

#### TC-GAL-006 排序按名称

- Status: `Implemented`
- Steps:
  1. 在画廊选择 `Name`
- Expected:
  - 按名称升序

#### TC-GAL-007 排序按大小

- Status: `Implemented`
- Steps:
  1. 在画廊选择 `Largest first`
- Expected:
  - 按体积降序

#### TC-GAL-008 网格视图切换

- Status: `Implemented`
- Steps:
  1. 点击 `Grid`
- Expected:
  - 图片以网格布局展示

#### TC-GAL-009 列表视图切换

- Status: `Implemented`
- Steps:
  1. 点击 `List`
- Expected:
  - 图片以单列列表展示

#### TC-GAL-010 无结果过滤

- Status: `Implemented`
- Steps:
  1. 输入不存在的关键字
- Expected:
  - 显示 `No images match the current filter.`

#### TC-GAL-011 缩略图资源可见

- Status: `Implemented`
- Steps:
  1. 打开画廊
- Expected:
  - 若资源路径可用，显示缩略图
  - 名称和尺寸元信息同时显示

### 14. Batch Processing

#### TC-BATCH-001 当前笔记批处理压缩

- Status: `Implemented`
- Steps:
  1. 当前笔记引用 5 张图片
  2. 执行 `Batch compress images in current note`
- Expected:
  - 创建批任务
  - 5 张图片被依次处理
  - 完成通知显示成功数量

#### TC-BATCH-002 当前文件夹批处理压缩

- Status: `Implemented`
- Steps:
  1. 当前目录包含多张图片
  2. 执行 `Batch compress images in current folder`
- Expected:
  - 当前文件夹及其子目录图片被处理

#### TC-BATCH-003 Vault 范围批处理压缩

- Status: `Implemented`
- Steps:
  1. 执行 `Batch compress images in vault`
- Expected:
  - 遍历 Vault 中所有受支持图片
  - 执行完成后返回完成通知

#### TC-BATCH-004 批处理暂停

- Status: `Implemented`
- Preconditions:
  - Vault 中有足够多的大图以便观察过程
- Steps:
  1. 启动 Vault 批处理
  2. 在处理中执行 `Pause active image batch job`
- Expected:
  - 当前任务进入暂停状态
  - 后续任务暂不继续推进

#### TC-BATCH-005 批处理恢复

- Status: `Implemented`
- Preconditions:
  - 已存在暂停中的任务
- Steps:
  1. 执行 `Resume active image batch job`
- Expected:
  - 任务恢复执行
  - 最终正常完成

#### TC-BATCH-006 批处理取消

- Status: `Implemented`
- Preconditions:
  - 已存在运行中的任务
- Steps:
  1. 执行 `Cancel active image batch job`
- Expected:
  - 任务状态变为取消
  - 不再继续处理剩余文件

#### TC-BATCH-007 并发任务保护

- Status: `Implemented`
- Steps:
  1. 启动一个批任务
  2. 在其未结束前再次启动另一个批任务
- Expected:
  - 第二个任务不应无保护地并发运行
  - 应保持已有任务唯一性约束

#### TC-BATCH-008 部分失败不中断整体

- Status: `Implemented`
- Preconditions:
  - 准备一组图片，其中至少一张人为制造处理失败条件
- Steps:
  1. 运行批处理
- Expected:
  - 可处理文件继续执行
  - 最终报告失败计数大于 0
  - 状态为 `completed-with-errors`

### 15. Preview Decoration

#### TC-PREVIEW-001 渲染图片标记样式类

- Status: `Implemented`
- Steps:
  1. 在笔记预览模式打开包含图片的文档
  2. 使用开发者工具检查渲染后的 `img`
- Expected:
  - 图片节点包含 `image-manager-managed` class

### 16. File Manager Service Edge Cases

#### TC-FM-001 支持图片类型识别

- Status: `Implemented`
- Steps:
  1. 对 `png`、`jpg`、`jpeg`、`gif`、`webp`、`bmp`、`svg`、`tif`、`tiff`、`heic` 分别执行文件菜单验证
- Expected:
  - 这些扩展名均被识别为图片
  - 其中 `svg`、`tif`、`tiff`、`heic` 的实际处理成功率取决于当前运行时解码/编码能力，不能只凭扩展名判定为可转换或可压缩

#### TC-FM-002 非图片类型识别

- Status: `Implemented`
- Steps:
  1. 对 `txt`、`pdf`、`md` 验证
- Expected:
  - 不被识别为图片

#### TC-FM-003 远程图片下载接口

- Status: `Implemented`
- Objective: 服务层能力验证
- Steps:
  1. 在集成或手工调试环境中调用 `saveRemoteImage`
- Expected:
  - 远程图片下载成功后按命名规则落盘

### 17. Documentation And Status Consistency

#### TC-DOC-001 功能状态列表一致性

- Status: `Implemented`
- Steps:
  1. 对照设置页 `Feature delivery status`
  2. 对照 `docs/task-status.md`
- Expected:
  - 已实现和部分实现描述基本一致

#### TC-DOC-002 测试文档覆盖性

- Status: `Implemented`
- Steps:
  1. 对照 `docs/user-guide.md`
  2. 对照 `docs/architecture.md`
  3. 对照命令列表和右键菜单列表
- Expected:
  - 本文档覆盖所有当前交付功能点

## Deferred Test Cases

### TC-DEFER-001 Markdown 图片对齐

- Status: `Deferred`
- Expected:
  - 当前版本无正式实现
  - 不执行通过性验收

### TC-DEFER-002 OCR

- Status: `Deferred`
- Expected:
  - 当前版本无正式实现

### TC-DEFER-003 图片搜索和分类

- Status: `Deferred`
- Expected:
  - 当前版本无正式实现

### TC-DEFER-004 Worker 后台处理

- Status: `Deferred`
- Expected:
  - 当前版本无正式实现

## Regression Checklist

- Paste flow still works after changing settings
- Rename flow still updates note links after note move
- Compression does not break image readability
- Conversion does not overwrite unrelated files
- Gallery remains usable after large batch processing
- Batch pause and resume do not deadlock the queue
- Context menu visibility still respects settings toggle
- Plugin reload does not multiply event handlers
- Settings page still renders on Obsidian builds without `Setting.setErrorMessage`
- Markdown preview rerenders after image rewrite operations
