# Design

## Traceability

| Requirement | Design | Verification | Task |
| --- | --- | --- | --- |
| `FR-DB-001`（FTS 触发器仅在索引列更新时重写） | `DES-DB-001`（OF 列列表 = prompts_fts 列，单一来源对齐） | `TEST-DB-001`（触发器契约 + FTS 检索回归 + 迁移幂等） | `T-DB-001`（schema.ts + init.ts 迁移） |
| `FR-DB-002`（create 原子提交） | `DES-DB-002`（单事务包裹 INSERT + createVersion） | `TEST-DB-002`（失败注入回滚 + 成功路径版本链） | `T-DB-002`（prompt.ts create） |
| `FR-RD-001`（markdown props 未变时不重解析） | `DES-RD-001`（模块级 plugin 常量 + memo + 数组浅值比较） | `TEST-RD-001`（ReactMarkdown 调用计数，4 用例） | `T-RD-001`（6 处组件改造 + MarkdownMemo） |
| `FR-RD-002`（流式 flush 节流且终值不被覆盖） | `DES-RD-002`（setTimeout 100ms + 完成路径取消未决 flush） | `TEST-RD-002`（节流窗口/合并/终值稳定） | `T-RD-002`（三个 schedule*Flush） |
| `FR-BD-001`（jsx-runtime 不在 markdown-vendor，markdown 不在首屏静态依赖） | `DES-BD-001`（函数式 manualChunks 捕获虚拟 id） | `TEST-BD-001`（构建产物入口引用计数 + bundle 预算） | `T-BD-001`（vite.config.ts + App.tsx 并行加载） |
| `FR-WEB-001`（assets immutable / html 再校验 304 / 文本压缩） | `DES-WEB-001`（static-assets.ts 缓存策略 + hono/compress） | `TEST-WEB-001`（6 项静态行为测试） | `T-WEB-001`（index.ts + app.ts） |
| `FR-WEB-002`（/exists 不读文件内容） | `DES-WEB-002`（stat 判定，模式对齐 getFileSize） | `TEST-WEB-002`（既有 media 语义测试 14/14） | `T-WEB-002`（media.ts fileExists） |

## 模块与依赖方向

| 优化点 | 拥有模块 | 改动文件 |
| --- | --- | --- |
| FTS update 触发器收窄 + 迁移 | `packages/db` | `packages/db/src/schema.ts`、`packages/db/src/init.ts` |
| `create` 单事务 | `packages/db` | `packages/db/src/prompt.ts` |
| markdown memo + plugin 常量 | `apps/desktop` renderer | `PromptMarkdownContent.tsx`、`AgentConversationMarkdown.tsx`、`EditPromptModal.tsx`、`PromptDetailModal.tsx`、`UpdateDialog.tsx`、`AiTestModal.tsx` |
| AI 测试流式节流 | `apps/desktop` renderer | `AiTestModal.tsx` |
| jsx-runtime 分包 | `apps/desktop` 构建 | `vite.config.ts` |
| 启动并行加载 | `apps/desktop` renderer | `App.tsx` |
| 静态缓存 + 压缩 + media exists | `apps/web` | `src/index.ts`、`src/app.ts`、`src/routes/media.ts` |

不新增跨包契约、不新增 IPC、不改存储布局；`packages/db` 的触发器变更通过既有 `schema_migrations` 通道分发。

## 关键技术决策

### 1. FTS 触发器收窄

- 事实来源：`schema.ts` 中 `prompts_fts(title, description, system_prompt, user_prompt, tags, content='prompts')`。触发器 OF 列表 = 这 5 列，单一来源手工对齐（SQLite 触发器无法引用 FTS 列定义，只能显式枚举）。
- 新装：`SCHEMA_INDEXES` 中的 `CREATE TRIGGER prompts_au AFTER UPDATE OF … IF NOT EXISTS` 直接生效。
- 既有安装：`runMigrations` 中先 `DROP TRIGGER IF EXISTS prompts_au` 并 `markMigration("narrow_prompts_fts_update_trigger_v1")`；随后的 `db.exec(SCHEMA_INDEXES)`（initializeSchema 中位于 runMigrations 之后）重建新定义。迁移在 initializeSchema 单事务内，天然原子。
- 语义安全性：`AFTER UPDATE OF <cols>` 在 SET 子句含任一列出列时触发（值的显式 SET，即使值未变）。所有修改索引列的既有代码路径（update/renameTag/deleteTag/rollback 等）的 UPDATE 都显式 SET 这些列，行为保持。`incrementUsage`/`is_favorite`/`current_version`/`sort_order` 更新不再重写 FTS 行——这些列不参与全文索引，索引内容本就不变。

### 2. `PromptDB.create` 单事务

- 复用 `update()` 已建立的模式：`db.transaction()` 包裹 INSERT + `createVersion`（`createVersion` 内部 `db.transaction` 检测 `inTransaction` 后嵌套复用外层事务，无需改动）。
- 返回值仍用 `getById(id)`（1 次 PK SELECT），不复制 `rowToPrompt` 映射，消除映射漂移风险。净效果：2 次 fsync → 1 次，5 次 SELECT → 2 次。
- 附带修复：消除"prompt 行已插入但 initial version 缺失"的中间态（init.ts 中 `repair_empty_prompt_version_chain_v1` 迁移证明该损坏真实发生过）。

### 3. markdown memo 与 plugin 身份

- react-markdown v9 每次渲染同步重新 parse；props 中内联数组使子树每次都失效。修复分两层：模块级 plugin 常量（消除身份抖动）+ `memo`（消除无关重渲染）。
- `PromptMarkdownContent` 的 `highlightTerms` 由 context 提供、可能每次渲染是新数组：自定义 `arePropsEqual` 对数组做浅值比较，避免 memo 静默失效。
- `AiTestModal` 中 `renderAiResponseContent` 抽为模块级 `memo` 组件（复用组件内已 memo 的 `rehypePlugins`/`markdownComponents` 作为 props），使 thinking 流式更新不再重解析 response。

### 4. 流式 flush 节流

- `scheduleSingleContentFlush` / `scheduleSingleThinkingFlush` / `scheduleCompareFlush` 从 rAF 换成 `setTimeout(…, STREAM_FLUSH_INTERVAL_MS=100)`，保留 coalescing guard 与 `flushSync`（维持"JS 间隙同步提交"语义）。
- 完成路径（`cancelSingleStreamRafs` → 更名 `cancelSingleStreamFlushes`、compare 完成处）清除未决定时器后以终值 set，杜绝未决 flush 用缓冲值覆盖服务端终值。token 生成速率（20–80 tok/s）远低于 10fps，视觉平滑度不受影响。

### 5. vite 分包

- `manualChunks["react-vendor"]` 增加 `"react/jsx-runtime"`：jsx-runtime 不再被 Rollup 挤入 `markdown-vendor`，入口 chunk 对 markdown 栈的静态依赖解除（由按需页面 chunk 引入）。一行改动，风险为构建图重排，由 bundle budget + 冒烟验证。

### 6. web 静态缓存与压缩

- `index.ts` 静态 handler：`/assets/*` → immutable 一年缓存；其余（含 html fallback）→ `no-cache` + `ETag: W/"<size>-<mtimeMs>"`，命中 `If-None-Match` 返回 304。以 `fs.stat` 计算 ETag，不额外读文件。
- 压缩：`createApp`（`src/app.ts`）注册 `hono/compress`（hono 4.x 内置，基于 Web `CompressionStream`，Node ≥ 18 可用）。仅对文本 content-type 生效，png/woff2 等自动跳过。
- media `exists`：新增 `fileExists` helper（stat 判定，模式与 `getFileSize` 一致），路由改用它。

## 数据与兼容

- 触发器变更是唯一持久化语义变化：迁移幂等、可逆（回滚即重建旧触发器定义）、不影响 FTS 既有数据（收窄阻止的本就是不改变索引内容的重写）。
- web 缓存头对已发布客户端无破坏：assets 内容 hash 不变则 URL 不变；index.html no-cache 保证部署后可更新。

## 权衡与被否方案

- **WAL**：VFS 不支持（实测），否决。
- **`synchronous=NORMAL`**：25% 写收益 vs 掉电持久性窗口，与 DB 层保守设计冲突，降级为建议项，不实施。
- **渲染纯文本 + 完成后一次性 parse markdown（流式）**：视觉突变明显，否决；采用节流。
- **create 内存构建返回对象**：省 1 次 SELECT 但复制 rowToPrompt 映射引入漂移风险，否决；保留 getById。

## 验证层选择

- DB：`packages/db`/desktop 既有真实 SQLite 测试层（:memory: + 临时文件库）——FTS 行为、迁移、事务原子性。
- Renderer：Vitest + RTL 组件测试——重渲染计数（memo 生效）、节流尾flush（fake timers）。
- 构建：`pnpm build` + bundle budget 脚本断言 chunk 布局。
- Web：Vitest 路由测试（exists 语义、缓存头、304、压缩标记）。
