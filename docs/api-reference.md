[中文](api-reference.md) | [English](api-reference.en.md) | [文档索引](README.md)

# API 参考

## Core

### `SettingsManager`

- `load()`：加载持久化插件数据，并与默认值合并。
- `getSettings()`：返回当前设置的防御性副本。
- `update(mutator)`：修改设置并持久化保存。

### `FeatureRegistry`

- `register(feature)`：注册功能模块。
- `activateAll(context)`：激活全部已注册功能。
- `list()`：返回用于诊断或 UI 展示的功能元数据。

### `EventBus`

- `on(event, handler)`：订阅事件，并返回取消订阅函数。
- `emit(event, payload)`：发布事件。
- `clear()`：移除全部监听器。

## Services

### `VariableResolver`

- `createContext(noteName, fileName)`：构建默认变量上下文。
- `resolve(pattern, context)`：解析并清理文件名模板。
- `resolvePath(pattern, context)`：解析路径模板，同时保留目录结构。
- `registerVariable(name, resolver)`：注册自定义变量提供器。
- `validatePattern(pattern)`：报告未解析变量。

### `FileManager`

- `saveImage(data, originalName, noteFile, extensionOverride?)`
- `saveRemoteImage(url, noteFile, fileName?)`
- `renameImage(file, noteFile, newName?)`
- `moveImage(file, targetFolder, noteFile?)`
- `replaceFile(file, data, targetPath?)`
- `runWithDeferredLeafRefresh(operation)`：将批量文件修改期间的预览刷新合并到事务末尾。
- `getImagesInNote(noteFile, sourcePath?)`
- `getImagesInFolder(folder)`
- `getImagesInVault()`
- `syncManagedImagesForNote(noteFile, oldNotePath)`
- `deleteOrphanImagesForNote(noteFile)`：删除当前笔记受管目录内未被任何笔记引用的图片。
- `deleteOrphanImagesInFolder(folder)`：删除指定文件夹范围内未被任何笔记引用的图片。
- `deleteOrphanImagesInVault()`：删除整个仓库内未被任何笔记引用的图片。
- `restoreBinaryFile(path, data)`
- `restoreTextFile(path, content)`

### `RecoveryManager`

- `initialize()`：加载持久化恢复历史，并清理过期快照。
- `runTransaction(meta, run)`：执行受管写入事务，并持久化回滚数据。
- `hasUndoableTransaction()`：判断当前是否存在可撤销事务。
- `hasRedoableTransaction()`：判断当前是否存在可重做事务。
- `captureBinarySnapshot(file)`：在每个事务中仅首次记录某文件的修改前二进制状态。
- `captureTextSnapshot(path, content?)`：在每个事务中仅首次记录某文本文件的修改前状态。
- `recordCreatedFile(path)`：记录新建文件，以便撤销时删除。
- `recordRename(fromPath, toPath)`：记录路径移动或重命名，用于反向回放。
- `recordDeletedFolder(path)`：记录被移除的目录，以便撤销时重建。
- `undoLastTransaction()`：恢复最近一次已提交或失败的 Image Manager 事务。
- `redoLastUndoneTransaction()`：重新应用最近一次已撤销的事务。

### `ImageProcessor`

- `getImageInfo(file)`
- `compress(file, quality?)`
- `convert(file, format?)`
- `resize(file, maxWidth?, maxHeight?)`
- `rotate(file, degrees)`
- `flip(file, direction)`
- `crop(file, selection)`
- `removeWatermark(file, selection)`

### `LinkFormatter`

- `formatLink(imagePath, noteFile, options)`
- `parseLink(link)`

## Batch

### `BatchProcessor`

- `run(request)`：执行排队任务。
- `pause()`
- `resume()`
- `cancel()`
- `getReport()`
