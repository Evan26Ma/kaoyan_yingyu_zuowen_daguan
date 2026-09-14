# 首次部署说明

当前服务器由 Nginx 监听 80 端口、Caddy 监听 443 端口：

1. 将 `Caddyfile` 安装为 `/etc/caddy/sites/zuowen.kaoyangogogo.fun.caddy`。
2. 在主 Caddyfile 中引入 `/etc/caddy/sites/*.caddy`，验证后 reload Caddy。
3. 将构建产物放入 `/var/www/zuowen.kaoyangogogo.fun/releases/<版本>/`，并让 `current` 软链接指向当前版本。
4. 在 Nginx 的 80 端口重定向站点中加入 `zuowen.kaoyangogogo.fun`，返回 `308 https://$host$request_uri`。
5. 配置仓库 Secrets 后，后续推送由 GitHub Actions 原子发布新版本。

服务器配置变更前应保留备份，并分别执行 `caddy validate` 和 `nginx -t`。

## 实验环境

- 地址：`https://zuowen.kaoyangogogo.fun:8848/`
- 构建：`PUBLIC_SITE_ENV=experimental pnpm build`
- 发布目录：`/var/www/zuowen.kaoyangogogo.fun/experimental/releases/<版本>/`
- Caddy 配置：`Caddyfile.experimental`

实验版带有环境横幅，并通过响应头禁止搜索引擎收录和浏览器缓存。它与正式站的目录、软链接和发布流程完全独立。
