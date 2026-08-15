# Delta Spec — 自托管 web（apps/web）

## Added

- 带内容 hash 的 Vite 产物（`dist/client/assets/*`）应返回 `Cache-Control: public, max-age=31536000, immutable`。
- `index.html` 及 SPA fallback 应返回 `Cache-Control: no-cache` 与基于 size+mtime 的 ETag，请求携带匹配 `If-None-Match` 时返回 304 空体。
- 文本类响应（JS/CSS/JSON/HTML/SVG）应按 `Accept-Encoding` 提供 gzip 压缩（`hono/compress`）；非文本格式不重复压缩。
- `GET /api/media/:kind/:filename/exists` 应通过 `stat` 判定存在性，不读取文件内容。

## Modified

- 静态资源响应不再是无缓存头的全量重复下载。

## Scenarios

- 用户第二次访问自托管 web，`assets/*` 命中本地缓存（from disk cache 或 304），传输量接近 0。
- 部署新版本后，用户刷新页面拿到新 `index.html`（no-cache + ETag 变化），随后加载新 hash 的 assets；旧 hash assets 对仍打开的旧页面继续可用。
- 客户端按媒体项调用 `/exists`，服务端不发生整文件 IO；返回值语义与读取内容判空完全一致（存在且为常规文件 → true）。
