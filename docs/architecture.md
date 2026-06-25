[中文](architecture.md) | [English](architecture.en.md) | [文档索引](README.md)

# 架构说明

## 分层

- `src/main.ts`：插件组合根、服务装配与功能注册引导。
- `src/core`：设置持久化、事件分发与功能注册等横切基础设施。
- `src/core/recovery`：持久化事务快照与撤销编排。
- `src/features`：按业务能力分组的用户可见功能模块。
- `src/services`：文件操作、图片处理、变量解析与链接格式化等可复用服务。
- `src/ui`：设置页与模态框组件。
- `src/types`：共享枚举、接口、结果辅助、批处理契约与功能元数据。
- `src/utils`：纯辅助函数。

## 已实现流程

1. `main.ts` 将持久化设置加载进 `SettingsManager`。
2. 核心服务只实例化一次，并通过 `ImageManagerFeatureContext` 向外暴露。
3. `FeatureRegistry` 激活各个功能模块。
4. 功能模块注册命令、workspace / vault 监听器、post processor 与 UI 入口。
5. 受管写入操作在修改 Markdown 或图片文件前记录恢复快照。
6. 批处理通过 `EventBus` 派发进度。

## 已交付模块

- 重命名与目录迁移同步
- 压缩
- 格式转换
- 预览装饰
- 文件右键图片编辑操作
- 笔记 / 文件夹画廊
- 批量压缩队列
- 右键菜单集成

## 延后扩展点

- Markdown 图片对齐变换
- 交互式画布编辑 UI
- 缩放预设
- OCR、搜索与分类
- 基于 Worker 的离主线程处理
