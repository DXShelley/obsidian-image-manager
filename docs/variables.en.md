[中文](variables.md) | [English](variables.en.md) | [Docs Index](README.en.md)

# Variable Reference

Supported rename variables:

- `{noteName}`: current note name without the extension
- `{noteFileName}`: alias of `{noteName}`, useful in path templates such as `./assets/${noteFileName}`
- `{fileName}`: original image file name without the extension
- `{date}`: current date in `YYYY-MM-DD`
- `{time}`: current time in `HH-MM-SS`
- `{random}`: random suffix

Notes:

- Both `{name}` and `${name}` syntax are supported.
- Unknown variables are stripped during resolution.
- `VariableResolver.validatePattern()` can be used to detect unresolved placeholders before saving a template.
