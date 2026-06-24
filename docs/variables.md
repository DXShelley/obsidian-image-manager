[中文](variables.md) | [English](variables.en.md) | [文档索引](README.md)

# 变量参考

支持的重命名变量：

- `{noteName}`：当前笔记名称，不含扩展名
- `{noteFileName}`：`{noteName}` 的别名，适用于 `./assets/${noteFileName}` 这类路径模板
- `{fileName}`：原始图片文件名，不含扩展名
- `{date}`：当前日期，格式为 `YYYY-MM-DD`
- `{time}`：当前时间，格式为 `HH-MM-SS`
- `{random}`：随机后缀

说明：

- 同时支持 `{name}` 与 `${name}` 两种语法。
- 未知变量在解析时会被移除。
- `VariableResolver.validatePattern()` 可在保存模板前检测未解析占位符。
