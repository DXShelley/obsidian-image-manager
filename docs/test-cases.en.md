[中文](test-cases.md) | [English](test-cases.en.md) | [Docs Index](README.en.md)

# Test Cases

## Scope

This document covers the currently delivered and partially delivered feature set of `note-image-manager`.

Status mapping:

- `Implemented`: can be executed and validated against the current plugin build.
- `Partial`: can be executed, but only the delivered subset should pass.
- `Deferred`: reserved for future implementation and should not be marked as pass for the current release.

## Test Environment

### Required Environment

- Obsidian desktop
- A test vault with community plugins enabled
- Plugin build artifacts copied into `.obsidian/plugins/note-image-manager/`
- The current plugin version loaded and enabled

### Recommended Test Data

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

### Recommended Default Settings Baseline

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

## Execution Rules

- Record each case as `Pass`, `Fail`, `Blocked`, or `Not Applicable`.
- For file-system assertions, verify both the Obsidian file explorer state and the actual vault files.
- For link assertions, verify the final Markdown source, not only the rendered preview.
- For file-processing assertions, verify extension, file-size trend, file readability, and whether links still resolve.

## Detailed Test Cases

### 1. Plugin Loading And Initialization

#### TC-INIT-001 Initial Plugin Load

- Status: `Implemented`
- Objective: Verify that the plugin loads correctly and shows its startup notice.
- Preconditions:
  - `manifest.json`, `main.js`, and `styles.css` have been copied into the plugin directory.
  - Obsidian has opened the test vault.
- Steps:
  1. Enable `Note Image Manager` in Obsidian.
  2. Observe the plugin loading flow.
  3. Open the developer console and check for errors.
- Expected:
  - The plugin is enabled successfully.
  - `Note Image Manager loaded` is shown.
  - No uncaught exception appears in the console.
  - `Note Image Manager` appears in Settings.

#### TC-INIT-002 Plugin Reload

- Status: `Implemented`
- Objective: Verify that repeated reloads do not duplicate event registration.
- Preconditions:
  - The plugin is already enabled.
- Steps:
  1. Reload the plugin 3 times.
  2. After each reload, run `Process images in current note` once.
  3. Observe execution count and notification count.
- Expected:
  - The command runs only once per invocation.
  - Duplicate notifications do not accumulate.
  - There is no obvious repeated event registration.

### 2. Settings UI

#### TC-SET-001 Settings Page Rendering

- Status: `Implemented`
- Objective: Verify that the settings page renders completely.
- Steps:
  1. Open `Settings -> Note Image Manager`.
  2. Inspect the grouped sections.
- Expected:
  - `界面语言` is shown at the top by default.
  - `保存与命名` is shown.
  - `转换与压缩` is shown.
  - `粘贴与编辑` is shown.
  - `图片画廊` is shown.
  - `功能状态` is shown.
  - `图片保存位置` is shown.
  - `生成的图片文件名` is shown.
  - Two preview blocks are shown.
  - The console does not show `setErrorMessage is not a function`.

#### TC-SET-007 Interface Language Toggle

- Status: `Implemented`
- Objective: Verify that the settings page and feature-status panel switch languages immediately.
- Steps:
  1. Change `界面语言` from `简体中文` to `English` at the top of the settings page.
  2. Inspect section headers, field descriptions, and the `Feature Status` panel.
  3. Switch back to `简体中文`.
- Expected:
  - The settings page refreshes into English immediately.
  - Feature items such as `Recovery transactions` and `Watermark removal` appear in English.
  - After switching back, `恢复事务` and `去水印` are shown again in Chinese.

#### TC-SET-002 Dropdown Setting Persistence

- Status: `Implemented`
- Objective: Verify that dropdown changes persist after reload.
- Steps:
  1. Set `Default image format` to `png`.
  2. Set `Default link format` to `markdown`.
  3. Reload the plugin.
  4. Return to the settings page and inspect the values.
- Expected:
  - The settings keep the last saved values.

#### TC-SET-003 Text Setting Persistence

- Status: `Implemented`
- Objective: Verify that text settings persist after reload.
- Steps:
  1. Change `Rename pattern` to `{noteName}-{fileName}`.
  2. Change `Output folder` to `./media/${noteFileName}`.
  3. Reload the plugin.
- Expected:
  - Both text values remain unchanged.

#### TC-SET-006 Compatibility With Older Obsidian Builds

- Status: `Implemented`
- Objective: Verify that the settings page still works when `Setting.setErrorMessage()` is unavailable.
- Steps:
  1. Open `Settings -> Note Image Manager` in the target Obsidian version.
  2. Edit `图片文件保存位置`.
  3. Edit `生成的图片文件名`.
- Expected:
  - The settings page renders completely.
  - Input changes can be saved.
  - No uncaught `TypeError` appears in the console.

#### TC-SET-004 Slider Bounds

- Status: `Implemented`
- Objective: Verify the minimum and maximum values of the quality slider.
- Steps:
  1. Set `Default image quality` to `1`.
  2. Run one image conversion.
  3. Set `Default image quality` to `100`.
  4. Run another image conversion.
- Expected:
  - Both operations complete.
  - No crash occurs.
  - The output files can be opened.

#### TC-SET-005 Immediate Toggle Effect

- Status: `Implemented`
- Objective: Verify that `Enable context menu actions` and `Enable gallery` take effect without reload.
- Steps:
  1. Disable `Enable context menu actions`.
  2. Right-click an image file.
  3. Enable `Enable context menu actions`.
  4. Right-click an image file again.
  5. Disable `Enable gallery`.
  6. Run a gallery command.
- Expected:
  - No plugin menu item appears while the setting is disabled.
  - The menu item appears immediately after re-enabling.
  - After disabling the gallery, the command shows `Gallery is disabled in settings`.

### 3. Variable Resolution And Rename Rules

#### TC-VAR-001 `{noteName}` Replacement

- Status: `Implemented`
- Preconditions:
  - The current note is `Project Alpha.md`.
  - `renamePattern = {noteName}`
- Steps:
  1. Paste an image into the note.
- Expected:
  - The generated file-name stem is `Project_Alpha`.

#### TC-VAR-002 `{fileName}` Replacement

- Status: `Implemented`
- Preconditions:
  - `renamePattern = {fileName}`
  - The source image is named `photo 1.png`.
- Steps:
  1. Paste the image.
- Expected:
  - The file-name stem is `photo_1`.

#### TC-VAR-003 `{date}` And `{time}` Format

- Status: `Implemented`
- Preconditions:
  - `renamePattern = {date}-{time}`
- Steps:
  1. Paste an image.
- Expected:
  - The file name contains `YYYY-MM-DD`.
  - The file name contains `HH-MM-SS`.

#### TC-VAR-004 `{random}` Uniqueness

- Status: `Implemented`
- Preconditions:
  - `renamePattern = {random}`
- Steps:
  1. Paste two images from the same source consecutively.
- Expected:
  - The two generated file names differ.

#### TC-VAR-005 `${name}` Syntax Compatibility

- Status: `Implemented`
- Preconditions:
  - `renamePattern = ${noteFileName}-${fileName}`
- Steps:
  1. Paste an image.
- Expected:
  - The file name is resolved correctly.
  - The literal `${...}` text is not left behind.

#### TC-VAR-006 Invalid Character Cleanup

- Status: `Implemented`
- Preconditions:
  - The note name contains spaces and special characters, for example `Plan: Q3/2026`.
  - `renamePattern = {noteName}-{fileName}`
- Steps:
  1. Paste an image.
- Expected:
  - The output file name does not contain `<>:\"/\\|?*`.
  - Spaces are normalized.

#### TC-VAR-007 Unknown Variable Removal

- Status: `Implemented`
- Preconditions:
  - `renamePattern = {noteName}-{unknown}-{fileName}`
- Steps:
  1. Paste an image.
- Expected:
  - `{unknown}` does not remain in the file name.
  - The other variables are still resolved correctly.

#### TC-VAR-008 Automatic Deduplication Of Adjacent Repeated Variables

- Status: `Implemented`
- Preconditions:
  - The current note name is `2026-06-23`.
  - `renamePattern = {noteName}-{date}-{time}`
- Steps:
  1. Paste an image.
- Expected:
  - The file name is `2026-06-23-HH-MM-SS`.
  - It does not become `2026-06-23-2026-06-23-...`.

### 4. Paste And Save Flow

#### TC-PASTE-001 Paste One Image

- Status: `Implemented`
- Objective: Verify the base paste-and-save pipeline.
- Steps:
  1. Open `Daily Note.md`.
  2. Paste one image from the system clipboard.
- Expected:
  - The image is saved into the folder defined by `outputFolder`.
  - A single image link is inserted into the Markdown source.
  - The link renders correctly.

#### TC-PASTE-002 Paste Multiple Images At Once

- Status: `Implemented`
- Steps:
  1. Use a clipboard source that supports multiple images.
  2. Paste multiple images in one action.
- Expected:
  - All images are saved.
  - Links are inserted line by line.
  - No image is missed.

#### TC-PASTE-003 Non-image Paste Is Not Intercepted

- Status: `Implemented`
- Steps:
  1. Copy plain text.
  2. Paste it into the note.
- Expected:
  - The plugin does not take over.
  - The text is pasted normally.

#### TC-PASTE-004 Paste With No Active Markdown View

- Status: `Implemented`
- Steps:
  1. Switch to a non-Markdown view.
  2. Paste an image.
- Expected:
  - The plugin does not throw an error.
  - It does not perform unexpected file writes.

#### TC-PASTE-005 Auto-convert Enabled

- Status: `Implemented`
- Preconditions:
  - `enableAutoConvert = true`
  - `defaultFormat = webp`
- Steps:
  1. Paste a PNG image.
- Expected:
  - The output file extension is `.webp`.
  - The inserted link points to `.webp`.

#### TC-PASTE-006 Auto-convert Disabled

- Status: `Implemented`
- Preconditions:
  - `enableAutoConvert = false`
- Steps:
  1. Paste a PNG image.
- Expected:
  - The output keeps the original extension.

#### TC-PASTE-007 Cursor Position `back`

- Status: `Implemented`
- Preconditions:
  - `dropPasteCursorLocation = back`
- Steps:
  1. Paste an image in the middle of a text block.
- Expected:
  - The cursor ends up after the newly inserted link.

#### TC-PASTE-008 Cursor Position `front`

- Status: `Implemented`
- Preconditions:
  - `dropPasteCursorLocation = front`
- Steps:
  1. Paste an image in the middle of a text block.
- Expected:
  - The cursor remains near the insertion start or original position.
  - The behavior is clearly different from `back`.

### 5. Output Folder And Path Resolution

#### TC-PATH-001 Empty Output Folder

- Status: `Implemented`
- Preconditions:
  - `outputFolder = ""`
- Steps:
  1. Paste an image in `notes/Daily Note.md`.
- Expected:
  - The image is saved into the same folder as the current note.

#### TC-PATH-002 Relative Output Folder

- Status: `Implemented`
- Preconditions:
  - `outputFolder = ./assets/${noteFileName}`
- Steps:
  1. Paste an image in `notes/Daily Note.md`.
- Expected:
  - The image is saved in `notes/assets/Daily_Note/`.

#### TC-PATH-006 Do Not Use Plugin Save Folder When Paste Handling Is Disabled

- Status: `Implemented`
- Preconditions:
  - `outputFolder = ./assets/${noteFileName}`
  - `enablePasteHandler = false`
- Steps:
  1. Paste an image in Obsidian.
- Expected:
  - The plugin does not take over the save flow.
  - The save location is determined by Obsidian native behavior or another plugin.

#### TC-PATH-003 Cross-level Relative Folder

- Status: `Implemented`
- Preconditions:
  - `outputFolder = ../shared-assets/${noteFileName}`
  - The current note is `notes/sub/Project Beta.md`.
- Steps:
  1. Paste an image.
- Expected:
  - The resolved folder is `notes/shared-assets/Project_Beta`.

#### TC-PATH-004 Auto-create Missing Folders

- Status: `Implemented`
- Preconditions:
  - The target points to a multi-level folder that does not yet exist.
- Steps:
  1. Paste an image.
- Expected:
  - All intermediate folders are created automatically.
  - The image is saved successfully.

#### TC-PATH-005 Auto-avoid File-name Collisions

- Status: `Implemented`
- Preconditions:
  - The target folder already contains the generated file name.
  - `renamePattern` produces a duplicate name.
- Steps:
  1. Save the same generated image result twice in succession.
- Expected:
  - The second file gets an incremented suffix automatically.
  - The original file is not overwritten.

### 6. Link Formatting

#### TC-LINK-001 Wiki Link Format

- Status: `Implemented`
- Preconditions:
  - `defaultLinkFormat = wiki`
- Steps:
  1. Paste an image.
- Expected:
  - The inserted link uses `![[...]]`.

#### TC-LINK-002 Markdown Link Format

- Status: `Implemented`
- Preconditions:
  - `defaultLinkFormat = markdown`
- Steps:
  1. Paste an image.
- Expected:
  - The inserted link uses `![...](...)`.

#### TC-LINK-003 Shortest Path With Unique Name

- Status: `Implemented`
- Preconditions:
  - There is only one `photo.png` in the vault.
  - `defaultPathFormat = shortest`
- Steps:
  1. Insert a link to that image.
- Expected:
  - The link uses only the file name.

#### TC-LINK-004 Shortest Path With Name Collision

- Status: `Implemented`
- Preconditions:
  - There are two files named `photo.png` in the vault.
  - `defaultPathFormat = shortest`
- Steps:
  1. Insert a link to one of them.
- Expected:
  - The link falls back to a distinguishable path.
  - It does not keep only the bare file name.

#### TC-LINK-005 Relative Path

- Status: `Implemented`
- Preconditions:
  - `defaultPathFormat = relative`
- Steps:
  1. Insert an image from a parent folder into a subfolder note.
- Expected:
  - The link contains `../`.

#### TC-LINK-006 Absolute Path

- Status: `Implemented`
- Preconditions:
  - `defaultPathFormat = absolute`
- Steps:
  1. Insert an image.
- Expected:
  - The path starts with `/`.

#### TC-LINK-007 Mixed Encoded And Readable Chinese Paths In One Note

- Status: `Implemented`
- Preconditions:
  - `defaultLinkFormat = markdown`
  - The current note contains both `![A](assets/%E6%89%AF%E7%9A%AE/test.png)` and `![B](assets/扯皮/test.png)` style Chinese image paths
  - Both links resolve to actual image files inside the vault
- Steps:
  1. Run `更新图片链接与目录【单文件】`.
- Expected:
  - Both links are processed with no partial misses
  - The final link style matches `markdownPathEncodingStrategy`
  - Images still render correctly

#### TC-LINK-008 Current-note Command Imports External Images To Local

- Status: `Implemented`
- Preconditions:
  - The current note contains `https://...png`, `file://...png`, and `data:image/png;base64,...` image links
- Steps:
  1. Run `下载外部图片到本地【单文件】`.
- Expected:
  - External images are downloaded into the configured output folder
  - External Markdown links are replaced with vault-local image links
  - Failed downloads keep the original text and emit an error log in the console

### 7. Rename And Relocation Sync

#### TC-RENAME-001 Note Rename Triggers Image Sync

- Status: `Implemented`
- Preconditions:
  - `outputFolder = ./assets/${noteFileName}`
  - `renameImagesOnNoteRelocate = true`
  - The note already manages at least 2 images.
- Steps:
  1. Rename `Daily Note.md` to `Daily Note 2.md`.
- Expected:
  - The image folder is synchronized to the new note folder name.
  - Image file names are recalculated with the current rules.
  - All links inside the original note are updated.
  - The old folder is deleted if it becomes empty.

#### TC-RENAME-002 Note Move Triggers Image Sync

- Status: `Implemented`
- Preconditions:
  - The note and its managed images already exist.
- Steps:
  1. Move the note to another folder.
- Expected:
  - Managed images move to the newly resolved folder.
  - Links remain valid.

#### TC-RENAME-003 Disable Relocate Rename

- Status: `Implemented`
- Preconditions:
  - `renameImagesOnNoteRelocate = false`
- Steps:
  1. Rename or move the note.
- Expected:
  - Image paths may change.
  - Image file names keep their original names.
  - Note links are updated successfully.

#### TC-RENAME-004 Rename A Non-Markdown File

- Status: `Implemented`
- Steps:
  1. Rename an image file.
  2. Observe plugin behavior.
- Expected:
  - The plugin does not mistakenly trigger note-image sync logic.
  - No extra notification appears.

#### TC-RENAME-005 Unmanaged Images Are Not Moved By Mistake

- Status: `Implemented`
- Preconditions:
  - The note references images from an external folder.
  - The note also has managed images.
- Steps:
  1. Rename the note.
- Expected:
  - Only managed images are synchronized.
  - Externally referenced images are not moved.

### 8. Compression

#### TC-COMP-001 Compress Referenced Images In Current Note

- Status: `Implemented`
- Preconditions:
  - The active view is a Markdown note.
- Steps:
  1. Reference 3 images in the current note.
  2. Run `压缩图片【单文件】`.
- Expected:
  - All 3 images are processed.
  - A batch-compression summary notice is shown.

#### TC-COMP-002 Compress One Image From Context Menu

- Status: `Implemented`
- Steps:
  1. Right-click an image.
  2. Click `Compress image`.
- Expected:
  - The image file is rewritten.
  - `Image compressed` is shown.

#### TC-COMP-003 Show Space Saved Notification

- Status: `Implemented`
- Preconditions:
  - `showSpaceSavedNotification = true`
- Steps:
  1. Compress a relatively large image.
- Expected:
  - In addition to the success notice, `Saved ...` is shown.

#### TC-COMP-004 Hide Space Saved Notification

- Status: `Implemented`
- Preconditions:
  - `showSpaceSavedNotification = false`
- Steps:
  1. Compress an image.
- Expected:
  - `Saved ...` is not shown.

#### TC-COMP-005 Compress An Already Small Image

- Status: `Implemented`
- Steps:
  1. Compress an image smaller than 50 KB.
- Expected:
  - The flow completes.
  - The file is still readable.
  - No error is raised even if the size barely changes.

#### TC-COMP-006 Stability On Very Large Images

- Status: `Implemented`
- Steps:
  1. Compress an image larger than 15 MB.
- Expected:
  - No crash occurs.
  - The processed image can still be previewed.
  - The UI may only become slower.

### 9. Format Conversion

#### TC-CONV-001 Convert Command To Default Format

- Status: `Implemented`
- Preconditions:
  - The active view is a Markdown note.
  - The note references at least 2 images.
  - `defaultFormat = png`
- Steps:
  1. Run `转换图片为默认格式【单文件】`.
- Expected:
  - Images referenced by the current note are batch-converted to `.png`.
  - Each referenced image is processed at most once.
  - A batch-conversion summary notice is shown.

#### TC-CONV-002 Convert Command To WebP

- Status: `Implemented`
- Steps:
  1. Activate a PNG or JPG image.
  2. Run the convert-to-`webp` command.
- Expected:
  - A `.webp` file is produced.
  - The output image can still be previewed or opened.

#### TC-CONV-003 Convert To The Same Format

- Status: `Implemented`
- Preconditions:
  - The active file is already `webp`.
- Steps:
  1. Run the convert-to-WebP command.
- Expected:
  - The file is updated in place or keeps the same path.
  - Duplicate copies do not pile up.

#### TC-CONV-004 Target-path Collision

- Status: `Implemented`
- Preconditions:
  - `aaa.png` and `aaa.jpg` both exist.
- Steps:
  1. Convert `aaa.png` to `webp`.
  2. Convert `aaa.jpg` to `webp`.
- Expected:
  - A unique target file name is generated automatically.
  - The existing file is not overwritten.
  - The results look like `aaa.webp` and `aaa-1.webp`.
  - The active file is replaced by the converted file, and no unreferenced old-format duplicate is left behind.

#### TC-CONV-005 Active File Is Not A Note

- Status: `Implemented`
- Steps:
  1. Activate an image file or any other non-Markdown file.
  2. Run the convert command.
- Expected:
  - `Open a note file first` is shown.

#### TC-CONV-006 Vault Conversion Risk Confirmation

- Status: `Implemented`
- Steps:
  1. Run `转换图片为默认格式【整库】`.
- Expected:
  - A risk confirmation appears first.
  - Canceling stops the conversion.
  - Confirming starts the vault-wide operation.

#### TC-CONV-007 Undo The Latest Conversion

- Status: `Implemented`
- Steps:
  1. Convert an image once.
  2. Run `恢复：撤销上一步图片管理修改`.
- Expected:
  - The image content or path returns to its pre-conversion state.
  - Related Markdown links are restored as well.

#### TC-CONV-008 Redo The Latest Undone Conversion

- Status: `Implemented`
- Preconditions:
  - A conversion has been performed and then undone once.
- Steps:
  1. Run `恢复：重做上一步图片管理修改`.
- Expected:
  - The most recently undone conversion is applied again.
  - Image content, path, and related links match the state before the undo.

### 10. Image Editor Quick Actions

#### TC-EDIT-001 Rotate 90 Degrees

- Status: `Deferred`
- Expected:
  - The current version does not expose a rotate shortcut in the Obsidian command list.
  - Rotation is verified through the image file context menu.

#### TC-EDIT-002 Horizontal Flip

- Status: `Deferred`
- Expected:
  - The current version does not expose a horizontal-flip shortcut in the Obsidian command list.
  - Horizontal flip is verified through the image file context menu.

#### TC-EDIT-002B Vertical Flip

- Status: `Deferred`
- Expected:
  - The current version does not expose a vertical-flip shortcut in the Obsidian command list.
  - Vertical flip is verified through the image file context menu.

#### TC-EDIT-003 Rotate From Context Menu

- Status: `Implemented`
- Steps:
  1. Right-click the image.
  2. Select `Rotate 90 degrees`.
- Expected:
  - The image is rotated 90 degrees clockwise.
  - The image can still be opened.

#### TC-EDIT-004 Flip From Context Menu

- Status: `Implemented`
- Steps:
  1. Right-click the image.
  2. Select `Flip horizontal`.
- Expected:
  - The image is flipped horizontally.
  - The image can still be opened.

#### TC-EDIT-006 Markdown Preview Auto-refresh

- Status: `Implemented`
- Preconditions:
  - The current Markdown note already references an image.
- Steps:
  1. Rotate or flip the image from the image file view or context menu.
  2. Return to the Markdown preview that references the image.
- Expected:
  - The image file content is updated.
  - The Markdown preview automatically refreshes to show the new image content.

#### TC-EDIT-007 Final Preview Appears Without File Switching

- Status: `Implemented`
- Preconditions:
  - An image file and a Markdown preview that references it are open side by side
- Steps:
  1. Rotate, flip, compress, or convert the image from the image file view
  2. Keep the Markdown preview on the same tab without switching to another file
- Expected:
  - The image in the current preview updates automatically
  - No manual file switch is required to see the final result

#### TC-EDIT-005 Interactive Editor

- Status: `Partial`
- Objective: Make the current non-delivered scope explicit.
- Expected:
  - The current version does not include a full interactive canvas editing UI.
  - This item should not be marked as pass.

### 11. Resize

#### TC-RESIZE-001 Resize To 1920 Bounding Box

- Status: `Deferred`
- Preconditions:
  - The active image width or height is greater than 1920.
- Expected:
  - The current version does not expose a 1920 bounding-box resize command in the Obsidian command list.
  - This item should not be marked as pass.

#### TC-RESIZE-002 Resize A Small Image

- Status: `Deferred`
- Preconditions:
  - The image dimensions are smaller than 1920.
- Expected:
  - The current version does not expose a resize command in the Obsidian command list.
  - This item should not be marked as pass.

#### TC-RESIZE-003 Advanced Resize Presets

- Status: `Deferred`
- Expected:
  - The current version does not include a multi-preset UI.
  - This item should not be marked as pass.

### 12. Context Menu

#### TC-MENU-001 Menu Appears Only For Images

- Status: `Implemented`
- Steps:
  1. Right-click an image file.
  2. Right-click a Markdown file.
  3. Right-click a PDF file.
- Expected:
  - Plugin menu items appear only for image files.

#### TC-MENU-002 Menu Completeness

- Status: `Implemented`
- Steps:
  1. Right-click an image file.
- Expected:
  - `Copy image to clipboard` appears.
  - `Compress image` appears.
  - `Convert to default format` appears.
  - `Drag-to-crop` appears.
  - `Rotate 90 degrees` appears.
  - `Flip horizontal` appears.
  - `Flip vertical` appears.
  - No redundant delete item from the plugin itself appears.

#### TC-MENU-003 Copy To Clipboard

- Status: `Implemented`
- Steps:
  1. Right-click an image and choose copy.
  2. Paste into an external image tool or chat input.
- Expected:
  - The clipboard contains image data.

#### TC-MENU-004 Delete Image

- Status: `Implemented`
- Steps:
  1. Right-click an image and choose delete.
- Expected:
  - The file goes to trash or is deleted.
  - The file disappears from the vault.

### 13. Gallery

#### TC-GAL-001 Open Current Note Gallery

- Status: `Implemented`
- Preconditions:
  - The current note references multiple images.
- Steps:
  1. Run `Open current note image gallery`.
- Expected:
  - A gallery modal opens.
  - The title shows the current note name.

#### TC-GAL-002 Open Current Folder Gallery

- Status: `Implemented`
- Preconditions:
  - The current folder contains multiple images.
- Steps:
  1. Run `Open current folder image gallery`.
- Expected:
  - A gallery modal opens.
  - Images from the current folder are shown.

#### TC-GAL-003 Gallery Disable Toggle

- Status: `Implemented`
- Preconditions:
  - `enableGallery = false`
- Steps:
  1. Run any gallery command.
- Expected:
  - The gallery does not open.
  - A disabled notice is shown.

#### TC-GAL-004 Click Thumbnail To Open Lightbox

- Status: `Implemented`
- Preconditions:
  - At least one image in the current note or folder gallery has a thumbnail
- Steps:
  1. Open any gallery
  2. Click a thumbnail
- Expected:
  - A lightbox opens
  - The large preview area shows the actual image instead of a blank panel
  - The title, image metadata, and pager counter update together

#### TC-GAL-005 Search Filtering

- Status: `Implemented`
- Preconditions:
  - The gallery contains `alpha.png` and `beta.png`.
- Steps:
  1. Enter `alpha` in the search box.
- Expected:
  - Only images related to `alpha` are shown.

#### TC-GAL-006 Sort By Time

- Status: `Implemented`
- Steps:
  1. Select `Newest first` in the gallery.
- Expected:
  - Images are shown in descending modified-time order.

#### TC-GAL-007 Sort By Name

- Status: `Implemented`
- Steps:
  1. Select `Name` in the gallery.
- Expected:
  - Images are shown in ascending name order.

#### TC-GAL-008 Sort By Size

- Status: `Implemented`
- Steps:
  1. Select `Largest first` in the gallery.
- Expected:
  - Images are shown in descending file-size order.

#### TC-GAL-009 Grid View Toggle

- Status: `Implemented`
- Steps:
  1. Click `Grid`.
- Expected:
  - Images are shown in a grid layout.

#### TC-GAL-010 List View Toggle

- Status: `Implemented`
- Steps:
  1. Click `List`.
- Expected:
  - Images are shown in a single-column list layout.

#### TC-GAL-011 Empty Search Result

- Status: `Implemented`
- Steps:
  1. Enter a keyword that does not exist.
- Expected:
  - `No images match the current filter.` is shown.

#### TC-GAL-012 Thumbnail Visibility

- Status: `Implemented`
- Steps:
  1. Open the gallery.
- Expected:
  - Thumbnails are shown when resource paths are available.
  - Name and size metadata are shown alongside them.

### 14. Batch Processing

#### TC-BATCH-001 Batch Compress In Current Note

- Status: `Implemented`
- Steps:
  1. Reference 5 images in the current note.
  2. Run `Batch compress images in current note`.
- Expected:
  - A batch job is created.
  - The 5 images are processed one by one.
  - The completion notice shows the success count.

#### TC-BATCH-002 Batch Compress In Current Folder

- Status: `Implemented`
- Steps:
  1. Ensure the current folder contains multiple images.
  2. Run `Batch compress images in current folder`.
- Expected:
  - Images in the current folder and its subfolders are processed.

#### TC-BATCH-003 Batch Compress Across The Vault

- Status: `Implemented`
- Steps:
  1. Run `压缩图片【整库】`.
- Expected:
  - All supported images in the vault are traversed.
  - A completion notice is returned when the run finishes.

#### TC-BATCH-004 Pause A Batch Job

- Status: `Implemented`
- Preconditions:
  - The vault contains enough large images to make the process observable.
- Steps:
  1. Start a vault-wide batch job.
  2. While it is running, execute `Pause active image batch job`.
- Expected:
  - The current job enters the paused state.
  - Subsequent tasks stop progressing temporarily.

#### TC-BATCH-005 Resume A Batch Job

- Status: `Implemented`
- Preconditions:
  - A paused job already exists.
- Steps:
  1. Run `Resume active image batch job`.
- Expected:
  - The job resumes execution.
  - It eventually completes successfully.

#### TC-BATCH-006 Cancel A Batch Job

- Status: `Implemented`
- Preconditions:
  - A running job already exists.
- Steps:
  1. Run `Cancel active image batch job`.
- Expected:
  - The job state changes to canceled.
  - Remaining files are not processed.

#### TC-BATCH-007 Concurrency Protection

- Status: `Implemented`
- Steps:
  1. Start one batch job.
  2. Before it finishes, start another one.
- Expected:
  - The second job does not run concurrently without protection.
  - The existing single-job constraint is preserved.

#### TC-BATCH-008 Partial Failures Do Not Abort The Whole Run

- Status: `Implemented`
- Preconditions:
  - Prepare a set of images where at least one image is forced to fail processing.
- Steps:
  1. Run the batch job.
- Expected:
  - Processable files continue running.
  - The final report contains a failure count greater than 0.
  - The status is `completed-with-errors`.

### 15. Preview Decoration

#### TC-PREVIEW-001 Render Managed-image CSS Class

- Status: `Implemented`
- Steps:
  1. Open a note containing images in preview mode.
  2. Inspect the rendered `img` node in developer tools.
- Expected:
  - The image node contains the `image-manager-managed` class.

#### TC-PREVIEW-002 Preview Resolves Mixed Encoded And Readable Chinese Paths

- Status: `Implemented`
- Preconditions:
  - The current note contains Markdown image links using both encoded Chinese paths and readable Chinese paths
  - Both kinds of links point to existing images in the vault
- Steps:
  1. Open the note in reading view
  2. Inspect the rendered images with developer tools
- Expected:
  - Both kinds of images render correctly
  - Rendered image elements include `data-image-manager-path`
  - The note does not show one format correctly while the other stays blank

#### TC-PREVIEW-003 Reading-view Context Menu Imports Only The Selected External Image

- Status: `Implemented`
- Preconditions:
  - The current note contains at least 2 external images
  - `enableContextMenu = true`
- Steps:
  1. Open the note in reading view
  2. Right-click one rendered external image
  3. Run `下载该外部图片到本地`
- Expected:
  - Only the selected external image is downloaded
  - Only the matching image link in the current note is rewritten to a local link
  - Other external image links remain unchanged

### 16. File Manager Service Edge Cases

#### TC-FM-001 Supported Image Type Detection

- Status: `Implemented`
- Steps:
  1. Validate file-menu behavior for `png`, `jpg`, `jpeg`, `gif`, `webp`, `bmp`, `svg`, `tif`, `tiff`, `heic`, and `avif`.
- Expected:
  - All of these extensions are recognized as images.
  - For `svg`, `tif`, `tiff`, `heic`, and `avif`, actual processing success still depends on runtime decode / encode support and should not be assumed from the extension alone.

#### TC-FM-002 Non-image Type Detection

- Status: `Implemented`
- Steps:
  1. Validate behavior for `txt`, `pdf`, and `md`.
- Expected:
  - They are not recognized as images.

#### TC-FM-003 Remote Image Download API

- Status: `Implemented`
- Objective: Verify service-layer capability.
- Steps:
  1. Call `saveRemoteImage` in an integration or manual debugging environment.
- Expected:
  - The remote image is downloaded and saved according to the naming rules.

#### TC-FM-004 Extensionless Remote Image Import

- Status: `Implemented`
- Preconditions:
  - The current note contains an extensionless image link such as `![Remote](https://cdn.example.com/render?id=42)`
- Steps:
  1. Run `Download external images to local`.
- Expected:
  - The plugin decides whether the resource is an image based on the response `content-type`
  - If it is an image, the resource is imported and the note is rewritten to a local link
  - If it is not an image, the original link stays unchanged and the import reports a failure

#### TC-FM-005 AVIF Layered Compatibility

- Status: `Implemented`
- Preconditions:
  - The vault contains `photo.avif`
- Steps:
  1. Reference `photo.avif` from a Markdown note
  2. Run `Convert images to default format【单文件】`
  3. Try in-place compress, crop, rotate, or resize on `photo.avif`
- Expected:
  - `AVIF` is recognized as an image and can participate in note-scoped conversion
  - Conversion produces the configured default format and rewrites the note link
  - In-place compress, crop, rotate, flip, and resize are blocked with guidance to convert to `PNG`, `JPEG`, or `WebP` first

### 17. Documentation And Status Consistency

#### TC-DOC-001 Feature-status Consistency

- Status: `Implemented`
- Steps:
  1. Compare against `功能状态` in the settings page.
  2. Compare against `docs/task-status.md`.
- Expected:
  - Implemented, planned, and partial descriptions are broadly consistent.
  - Watermark removal appears only as a planned item in both the settings page and the docs.

#### TC-DOC-002 Test Document Coverage

- Status: `Implemented`
- Steps:
  1. Compare against `docs/user-guide.md`.
  2. Compare against `docs/architecture.md`.
  3. Compare against the command list and context-menu list.
- Expected:
  - This document covers all currently delivered feature points.

## Deferred Test Cases

### TC-DEFER-001 Interactive Drag-To-Resize In The Editor

- Status: `Deferred`
- Expected:
  - No formal implementation exists in the current version.
  - Do not execute a pass/fail acceptance for this item.

### TC-DEFER-002 OCR

- Status: `Deferred`
- Expected:
  - No formal implementation exists in the current version.

### TC-DEFER-003 Image Search And Classification

- Status: `Deferred`
- Expected:
  - No formal implementation exists in the current version.

### TC-DEFER-004 Worker Background Processing

- Status: `Deferred`
- Expected:
  - No formal implementation exists in the current version.

## Regression Checklist

- The paste flow still works after changing settings.
- The rename flow still updates note image links after a note move.
- Compression does not break image readability.
- Conversion does not overwrite unrelated files.
- The gallery remains usable after large batch processing.
- Batch pause and resume do not deadlock the queue.
- Context-menu visibility still respects the settings toggle.
- Plugin reload does not multiply event handlers.
- The settings page still renders on Obsidian builds without `Setting.setErrorMessage`.
- Markdown preview rerenders after image rewrite operations.
- Link updates, conversion, and preview remain consistent when a single note mixes encoded Chinese paths and readable Chinese paths.
- `Download external images to local` imports `URL`, `file://`, and `data:image/...;base64,...` sources and rewrites them as local links.
- Clicking a gallery thumbnail does not open a blank lightbox preview.
