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

- `createContext(noteName, fileName)`: build default variable values.
- `resolve(pattern, context)`: resolve and sanitize file names.
- `resolvePath(pattern, context)`: resolve path templates while preserving folder structure.
- `registerVariable(name, resolver)`: add a custom variable provider.
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

### `ImageProcessor`

- `getImageInfo(file)`
- `compress(file, quality?)`
- `convert(file, format?)`
- `resize(file, maxWidth?, maxHeight?)`
- `rotate(file, degrees)`
- `flip(file, direction)`

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
