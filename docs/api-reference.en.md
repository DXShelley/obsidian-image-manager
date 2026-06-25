[中文](api-reference.md) | [English](api-reference.en.md) | [Docs Index](README.en.md)

# API Reference

## Core

### `SettingsManager`

- `load()`: load persisted plugin data merged with defaults.
- `getSettings()`: return a defensive copy of current settings.
- `update(mutator)`: mutate settings and persist them.

### `FeatureRegistry`

- `register(feature)`: register a feature module.
- `activateAll(context)`: activate all registered features.
- `list()`: return feature metadata for diagnostics or UI.

### `EventBus`

- `on(event, handler)`: subscribe and return an unsubscribe function.
- `emit(event, payload)`: publish an event.
- `clear()`: remove all listeners.

## Services

### `VariableResolver`

- `createContext(noteName, fileName)`: build the default variable context.
- `resolve(pattern, context)`: resolve and sanitize file-name templates.
- `resolvePath(pattern, context)`: resolve path templates while preserving folder structure.
- `registerVariable(name, resolver)`: register a custom variable provider.
- `validatePattern(pattern)`: report unresolved variables.

### `FileManager`

- `saveImage(data, originalName, noteFile, extensionOverride?)`
- `saveRemoteImage(url, noteFile, fileName?)`
- `renameImage(file, noteFile, newName?)`
- `moveImage(file, targetFolder, noteFile?)`
- `replaceFile(file, data, targetPath?)`
- `getImagesInNote(noteFile, sourcePath?)`
- `getImagesInFolder(folder)`
- `syncManagedImagesForNote(noteFile, oldNotePath)`
- `restoreBinaryFile(path, data)`
- `restoreTextFile(path, content)`

### `RecoveryManager`

- `initialize()`: load persisted recovery history and prune expired snapshots.
- `runTransaction(meta, run)`: execute a managed write transaction with persisted rollback data.
- `hasUndoableTransaction()`: report whether an undoable transaction exists.
- `hasRedoableTransaction()`: report whether a redoable transaction exists.
- `captureBinarySnapshot(file)`: capture the pre-change binary state once per file per transaction.
- `captureTextSnapshot(path, content?)`: capture the pre-change text state once per file per transaction.
- `recordCreatedFile(path)`: record a newly created file so undo can delete it.
- `recordRename(fromPath, toPath)`: track a move or rename for reverse replay.
- `recordDeletedFolder(path)`: record removed folders so undo can recreate them.
- `undoLastTransaction()`: restore the latest committed or failed Note Image Manager transaction.
- `redoLastUndoneTransaction()`: reapply the most recently undone transaction.

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

- `run(request)`: execute queued tasks.
- `pause()`
- `resume()`
- `cancel()`
- `getReport()`
