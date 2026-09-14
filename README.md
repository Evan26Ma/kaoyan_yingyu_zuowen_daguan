# 考研英语作文大观

一个由考研英语写作资料整理而成的静态学习网站，提供分类浏览、全文搜索、收藏、已学标记和中英文遮挡背诵。

## 本地开发

需要 Node.js 22：

```bash
corepack enable
pnpm install
pnpm dev
```

常用检查：

```bash
pnpm run audit:content
pnpm test
pnpm run check
pnpm run build
```

构建产物位于 `dist/`，不需要后端服务。

## 内容结构

- `content/`：从原始 MinerU HTML 拆分的 12 个来源页面，作为可追溯内容源。
- `assets/images/`：来源页面使用的 37 张图片。
- `src/lib/catalog.mjs`：学习条目的分类、标签、年份以及构建期内容清洗规则。
- `src/pages/`：首页、资料库、学习页、收藏、附加资料和说明页面。

新增资料时，需要在 `src/lib/catalog.mjs` 中登记来源文件；生产构建会检查遗漏页面、失效图片和重复标识。

## 学习数据

收藏、已学、最近访问、遮挡方式和主题偏好保存在浏览器的 `kaoyan-writing:v1` 本地存储项中，不会上传到服务器。

## 部署

`deploy/Caddyfile` 是 `zuowen.kaoyangogogo.fun` 的站点配置示例。GitHub Actions 需要以下仓库 Secrets：

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_PORT`
- `DEPLOY_SSH_KEY`
- `DEPLOY_KNOWN_HOSTS`

服务器发布目录为 `/var/www/zuowen.kaoyangogogo.fun/`。首次发布前，应安装 Caddy 配置并确保部署用户可以写入该目录。
未配置部署 Secrets 时，Actions 仍会完成检查和构建，但会安全跳过 SSH 发布步骤。

## 来源说明

内容来源为“英语_withMarginNotes.pdf”的 MinerU HTML 导出版本。网站负责结构、排版和学习交互整理，不代表官方考试标准答案。
