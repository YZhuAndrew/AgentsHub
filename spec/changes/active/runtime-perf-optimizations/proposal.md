# Proposal

## Why

一次跨端运行时性能审计（renderer / main+DB / 启动与构建 / core+web 四路并行）确认了以下持续消耗 CPU、IO 或启动时间的热路径，且均有 file:line 证据：

1. **Markdown 重复解析（桌面 renderer，CPU）**：`react-markdown` 每次渲染都同步重新 parse 全文。多个高频组件（prompt 详情、agent 会话、编辑预览、AI 测试流式响应）使用内联 `remarkPlugins={[remarkGfm]}` 数组且未 `memo`，导致无关状态变化（搜索按键、收藏切换、thinking 流式更新）触发整篇 markdown 重解析。AI 测试 modal 在流式输出期间每帧 `flushSync` 全量响应文本，长响应下解析成本呈 O(n²)，compare 模式再乘以面板数。
2. **FTS 触发器过度触发（DB，写放大）**：`prompts_au` 触发器对 `prompts` 表的任何 UPDATE 都执行 FTS 行的 delete+insert，包括 `usage_count`、`is_favorite`、`current_version` 等与全文索引无关的列。每次复制计数、收藏切换都在重写全文索引文档。
3. **`PromptDB.create` 双事务（DB，fsync 放大）**：INSERT（自动提交，1 次 fsync）+ `createVersion` 自开事务（第 2 次 fsync），外加 3 次冗余 SELECT。实测本机 node-sqlite3-wasm 单语句自动提交约 13ms/次（fsync 主导），事务合并是最直接的无损优化。
4. **首屏 chunk 污染（桌面构建）**：`react/jsx-runtime` 被 Rollup 合并进 `markdown-vendor`（约 100KB gzip），使整个 markdown 栈（react-markdown + highlight.js + sanitize）成为入口 chunk 的静态依赖，每次启动都要加载解析。
5. **Web 自托管端重复传输（网络/内存）**：静态资源无 `Cache-Control`/ETag/压缩，每次访问重新下载约 2.5MB 未压缩 JS/CSS；`GET /api/media/:kind/:filename/exists` 为返回布尔值 `readFile` 整个媒体文件（最大 20MB）。
6. **renderer 启动串行 await（启动时间）**：`App.tsx` init 中 `fetchPrompts()` 与 `fetchFolders()` 串行执行，二者无依赖。

### 实测否决项（重要结论）

- **WAL 不可用**：实测 `node-sqlite3-wasm@0.8.53` 的 WASM VFS 执行 `PRAGMA journal_mode = WAL` 后模式仍为 `delete`（VFS 不支持 WAL 所需的共享内存）。任何基于 WAL 的优化在该依赖下不可行。
- **`synchronous = NORMAL` 不默认启用**：实测 300 次单语句插入 FULL≈4.0s / NORMAL≈3.0s / OFF≈0.09s。NORMAL 仅约 25% 收益，但在 rollback journal 模式下存在极小的掉电损坏窗口，与本项目数据库层"安全点 + 备份 + 完整性校验"的保守设计取向相悖。作为建议项记录（见 implementation.md），不在本变更静默启用。

## Scope

- In scope:
  - 桌面 renderer：6 处 markdown 使用点改为模块级 plugin 常量 + `memo`；AI 测试 modal 流式 flush 从每帧节流到 ~100ms 并 memo 化响应渲染。
  - `packages/db`：FTS update 触发器收窄为 `AFTER UPDATE OF <索引列>`（含既有安装迁移）；`PromptDB.create` 合并为单事务。
  - `apps/desktop/vite.config.ts`：`react-vendor` manual chunk 加入 `react/jsx-runtime`。
  - `apps/desktop/src/renderer/App.tsx`：init 中 prompts/folders 并行加载。
  - `apps/web`：静态资源缓存头（assets immutable / html no-cache + ETag 304）与 gzip 压缩（`hono/compress`）；media `exists` 路由改为 `stat`。
- Out of scope（记录为后续建议，不在本变更实施）:
  - prompt/skill workspace"每次变更全量同步"的增量化和去 N+1（架构级，独立 change）。
  - Electron 主进程启动链重排、启动期 DB 双开与 quick_check 冗余（涉及 canonical authority 时序，需专项验证）。
  - canonical 存储的内容寻址对象库多次哈希、WebDAV 媒体全量重传、web 端 locale 首屏双下载等（各自独立 change）。
  - SQLite pragma（WAL/NORMAL）调整（见上）。

## Risks

- markdown 组件 `memo` 后若 props 不稳定（如 `highlightTerms` 每次新数组）会静默失效：对数组 props 使用浅比较的自定义 `arePropsEqual` 兜底，并以重渲染计数测试验证。
- 流式 flush 节流改变 UI 更新节奏（60fps → ~10fps）：流式 token 速率本身远低于 60/s，最终内容在流结束时由完成路径直接落位（既有 `cancelSingleStreamRafs` + 终值 set 模式），不丢失尾部内容。
- FTS 触发器收窄若遗漏索引列会导致全文索引陈旧：以 FTS 索引列集合为唯一事实来源（schema 中 `prompts_fts` 的列定义），并用"改 title/tags 后 FTS 可检索、改 usage_count 后 FTS 行不变"双向测试锁定。
- web 静态缓存若把 `index.html` 也设为 immutable 会导致部署后无法更新：仅对带 hash 的 `/assets/*` 使用 immutable，入口 html 使用 no-cache + ETag。
- `hono/compress` 对已压缩格式（png/jpg/woff2）重复压缩浪费 CPU：中间件按 content-type 自动跳过二进制（verify：仅压缩 text 类）。

## Rollback Thinking

- 每个优化点独立成 commit，可单独 revert。
- FTS 触发器迁移可逆：回滚时 DROP 新触发器并重建旧版 `AFTER UPDATE ON prompts` 触发器即可，FTS 数据本身不受影响（收窄期间本就不该触发的更新不改变索引内容）。
- web 缓存头回滚无数据风险，仅恢复重复传输。

## Verification Strategy

- DB：真实 SQLite（`:memory:` 与临时文件库）测试 —— FTS 触发器收窄行为、create 事务原子性（失败注入）、既有迁移兼容。
- Renderer：Vitest 组件测试 —— memo 生效（无关 props 变化不重解析/不重渲染）、流式节流不丢尾部内容。
- 构建：`pnpm build` + `pnpm bundle:budget` 确认 jsx-runtime 移出 markdown-vendor 后首屏 chunk 下降且预算通过。
- Web：路由测试 —— `/exists` 不再读文件内容、静态资源响应头正确、ETag 304 生效。
- 全量：`pnpm lint`、`pnpm typecheck`、`pnpm test:run` 无回归。
