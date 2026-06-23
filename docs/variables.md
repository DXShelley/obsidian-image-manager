# Variable Reference

Supported rename variables:

- `{noteName}`: current note name without extension
- `{noteFileName}`: alias of `{noteName}`, useful in path templates such as `./assets/${noteFileName}`
- `{fileName}`: original image file name without extension
- `{date}`: current date in `YYYY-MM-DD`
- `{time}`: current time in `HH-MM-SS`
- `{random}`: random suffix

Notes:

- Both `{name}` and `${name}` syntax are supported.
- Unknown variables are stripped during resolution.
- `VariableResolver.validatePattern()` can be used to detect unresolved placeholders before saving a template.
