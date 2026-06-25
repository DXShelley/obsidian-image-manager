# Website

独立宣传主页代码位于 `website/`，与插件主构建分离。

- 生产部署通过 GitHub Actions 发布到 GitHub Pages。
- 仓库主页链接预期指向：`https://dxshelley.github.io/obsidian-image-manager/`

```bash
cd website
pnpm install
pnpm dev
pnpm build
```
