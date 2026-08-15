# Tasks

按阶段组织。同一阶段内的项可合并到一个 PR/commit；跨阶段的项不要混。

## P1 — 数据库写路径

- [x] 迁移前先写失败测试：触发器契约（`AFTER UPDATE OF` + 5 索引列）、既有库迁移、幂等性（旧定义下 3 项失败）
- [x] 测试：title/tags 更新后 FTS 反映新值；usage/favorite 更新后检索不受影响（回归保护）
- [x] `schema.ts`：更新 `prompts_au` 定义为 `AFTER UPDATE OF title, description, system_prompt, user_prompt, tags`
- [x] `init.ts`：`runMigrations` 增加 `narrow_prompts_fts_update_trigger_v1`（DROP + mark）
- [x] 测试：`PromptDB.create` 版本插入失败时整体回滚（旧双事务实现下失败）
- [x] `prompt.ts`：`create()` 用 `db.transaction` 包裹 INSERT + `createVersion`
- [x] 既有 DB 测试无回归（prompt-db / relation / output-format / historical-fixtures：78/78）

## P2 — Renderer markdown 热路径

- [x] 新建共享 `components/ui/MarkdownMemo.tsx`（memo + 模块级 remark plugin 常量）
- [x] 测试：`PromptMarkdownContent` 新数组身份但值相等时不重渲染；值变化时重渲染
- [x] 测试：`AgentConversationMarkdown` 父级无关重渲染不触发 markdown 重渲染
- [x] `PromptMarkdownContent.tsx`：`memo` + 自定义 arePropsEqual（数组浅值比较）+ 模块级 plugin
- [x] `AgentConversationMarkdown.tsx`：`memo` + 模块级 plugin 常量
- [x] `EditPromptModal.tsx`：3 处预览改用 `MarkdownMemo`
- [x] `PromptDetailModal.tsx` / `UpdateDialog.tsx`：plugin 常量提升 / 改用共享组件
- [x] `AiTestModal.tsx`：响应渲染改用 `MarkdownMemo`

## P3 — AI 测试流式节流

- [x] 测试：chunk 到达后 100ms 内不渲染；多个 chunk 合并一次 flush；完成后终值稳定不被未决 flush 覆盖
- [x] `AiTestModal.tsx`：三个 `schedule*Flush` 从 rAF 换 `setTimeout(100ms)`；完成/清理路径同步取消定时器（`cancelSingleStreamFlushes` / `resetCompareBuffers`）
- [x] 文件行数保持在 legacy 基线内（AiTestModal 1538/1540，EditPromptModal 1830/1830）

## P4 — 启动与构建

- [x] `vite.config.ts`：manualChunks 换函数式，`react/jsx-runtime`（含 commonjs 虚拟 id）归入 `react-vendor`
- [x] `pnpm build` 后入口 chunk 0 处 markdown-vendor 引用；modulepreload 列表不再含 markdown-vendor；`pnpm bundle:budget` 通过
- [x] `App.tsx`：`Promise.all([fetchPrompts(), fetchFolders()])`

## P5 — Web 自托管端

- [x] 抽 `services/static-assets.ts`（可测试）+ 重写 `index.ts` 为薄入口
- [x] 测试×6：assets immutable、html no-cache+ETag、304、内容变更后 ETag 变化、SPA fallback、bundle 缺失时不注册
- [x] `app.ts`：注册 `hono/compress`
- [x] `media.ts`：`fileExists`（stat）替换 `/exists` 的整文件读取；既有 media 测试 14/14 通过
- [x] 修正 `index.test.ts` mock（补 `stat`）

## P6 — 收敛

- [x] `pnpm lint`（含 file-size 门禁）+ `pnpm typecheck` 全绿；web `typecheck`/`lint` 全绿
- [x] 桌面全量 `pnpm test:run`（5458 测试）+ web 全量（354 测试，既有 JWT_SECRET 并行收集 flake 单独记录）
- [x] implementation.md 记录实测数据、WAL/NORMAL 结论、后续建议清单
