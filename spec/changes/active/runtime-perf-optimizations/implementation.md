# Implementation

## 已落地内容

### 1. 数据库写路径（`packages/db`）

- `schema.ts`：`prompts_au` 触发器改为 `AFTER UPDATE OF title, description, system_prompt, user_prompt, tags ON prompts`。非索引列（usage_count / is_favorite / current_version / sort_order 等）更新不再重写 FTS 行。
- `init.ts`：新增幂等迁移 `narrow_prompts_fts_update_trigger_v1`（DROP 旧触发器后由随后的 `SCHEMA_INDEXES` 重建新定义，位于 initializeSchema 单事务内）。
- `prompt.ts`：`PromptDB.create` 的 INSERT 与 initial version 合并为单事务。效果：每次创建 2 次 fsync → 1 次、5 次 SELECT → 2 次；消除"prompt 行存在但 initial version 缺失"中间态（`repair_empty_prompt_version_chain_v1` 迁移证明该损坏真实发生过）。

### 2. Renderer markdown 热路径（`apps/desktop`）

- 新增 `components/ui/MarkdownMemo.tsx`：共享 memo 化 react-markdown 包装（模块级 `REMARK_GFM_PLUGINS` 常量）。
- `PromptMarkdownContent.tsx`：`memo` + 自定义比较器（`highlightTerms` 按值比较，容忍父级新数组身份）+ 模块级 plugin。prompt 详情在搜索按键/收藏切换等无关重渲染下不再整篇重解析。
- `AgentConversationMarkdown.tsx`：`memo` + 模块级 plugin 常量。会话面板筛选/搜索不再重解析全部可见消息。
- `EditPromptModal.tsx` 三处预览、`PromptDetailModal.tsx`、`AiTestModal.tsx` 响应渲染改用 `MarkdownMemo`；`UpdateDialog.tsx` plugin 常量提升到模块级。
- `AiTestModal.tsx` 流式 flush：rAF（每帧）→ `setTimeout` 100ms 节流，三个调度器（single content / thinking / compare）一致；完成与清理路径取消未决定时器后以终值落位。长响应流式期间 CPU 不再随长度平方增长（compare 模式按面板数放大同样受益）。

### 3. 启动与构建（`apps/desktop`）

- `vite.config.ts`：manualChunks 从对象式改为函数式。对象式无法匹配 `react/jsx-runtime` 的 commonjs interop 虚拟 id，导致 interop 包装被 Rollup 合并进 `markdown-vendor`，入口 chunk 静态依赖整个 markdown 栈（~101KB gzip）。函数式显式将 jsx-runtime（含虚拟 id）归入 `react-vendor`。
- 实测（生产构建产物）：入口 chunk `index-*.js` 对 markdown-vendor 引用 0 处（改前静态 import）；`index.html` modulepreload 从 5 个（含 markdown-vendor 329.78KB/100.93KB gzip）降为 3 个（i18n/react/icons）；markdown 栈仅随 lazy 页面 chunk 按需加载。
- `App.tsx`：`fetchPrompts()` 与 `fetchFolders()` 改 `Promise.all` 并行。
- bundle 预算全部通过（react-vendor 44.72KB gzip / 预算 50KB）。

### 4. Web 自托管端（`apps/web`）

- 新增 `services/static-assets.ts`（含 6 项行为测试），`index.ts` 变薄入口：
  - `assets/*`（Vite hash 文件名）→ `Cache-Control: public, max-age=31536000, immutable`
  - `index.html` 与 SPA fallback → `no-cache` + `W/"<size>-<mtime>"` ETag + `If-None-Match` 304 + `Vary: Accept-Encoding`
- `app.ts` 注册 `hono/compress`（gzip，按 Accept-Encoding；非文本自动跳过）。自托管端重复访问不再全量重传 ~2.5MB 未压缩资源。
- `media.ts`：`/exists` 路由改用新增 `fileExists`（stat），不再为布尔结果读取整个媒体文件（最大 20MB）。

## 验证记录

| 项 | 命令 / 层 | 结果 |
| --- | --- | --- |
| FTS 触发器契约 + 迁移 + 幂等 + create 原子性 | `tests/unit/main/prompt-hot-path.test.ts`（真实 SQLite，:memory: + 临时文件库） | 8/8（实现前 4 项按预期失败） |
| 既有 DB 回归 | prompt-db / prompt-relation-db / prompt-output-format-db / database-historical-fixtures | 78/78 |
| markdown memo 契约 | `tests/unit/components/markdown-memo-behavior.test.tsx`（ReactMarkdown 调用计数） | 4/4 |
| AI 测试（含流式节流新测试） | `tests/unit/components/ai-test-workbench.test.tsx` | 19/19 |
| 受影响 modal 组件 | edit-prompt-modal / prompt-modal-structure / update-dialog / prompt-detail-modal / agent-conversation-markdown + 上述两组 | 71/71 |
| 桌面全量 | `pnpm test:run` | 614 文件 / 5458 测试全绿 |
| 构建 + 预算 | `pnpm build` + `pnpm bundle:budget` | 通过；入口 0 markdown-vendor 引用 |
| 静态资源缓存/304/ETag/fallback | `src/services/static-assets.test.ts`（真实文件系统） | 6/6 |
| media exists 语义 | `src/routes/media.test.ts` | 14/14 |
| Web 全量 | `pnpm test`（apps/web） | 354/354；另有 6 个文件在并行 workers 下因模块级 `config.ts` 读取 `JWT_SECRET` 的既有收集竞态失败——干净工作树（stash 全部改动后）同样复现，与本变更无关，建议单独立 issue |
| Lint / 类型 | 根 `pnpm lint`（含 file-size 门禁）+ `pnpm typecheck`；web `typecheck` + `lint` | 全绿；AiTestModal 1538/1540、EditPromptModal 1830/1830 保持基线内 |

## SQLite pragma 实测结论（未实施，决策记录）

- **WAL 不可用**：`node-sqlite3-wasm@0.8.53` 的 WASM VFS 执行 `PRAGMA journal_mode = WAL` 后模式仍为 `delete`（无共享内存支持）。任何 WAL 方案在该依赖下不可行。
- **`synchronous = NORMAL` 未启用**：实测 300 次单语句插入 FULL≈4.0s / NORMAL≈3.0s / OFF≈0.09s。NORMAL 收益约 25%，但 rollback journal 模式下存在极小掉电损坏窗口，与 DB 层"安全点 + 备份 + 完整性校验"的保守取向相悖，不静默启用。如接受该取舍可单独提 change（一行 pragma + 掉电损坏窗口说明）。
- **事务合并是无损替代**：单语句自动提交实测 ~13ms/次（fsync 主导），合并事务将 fsync 摊薄——本次已按此方向落地 `create()`；后续可扩展到其他高频写路径。

## 后续建议（未在本变更实施，均需独立 change）

1. **workspace 全量同步增量化**（高价值，架构级）：桌面 `prompt.ipc.ts` ~22 个 handler 与 web `prompt.service.ts`/`skill.service.ts` 的每次变更都全量重写整个 workspace（N+1 读取 + 全量文件重写 + 多次全树遍历，同步阻塞主线程/请求线程）。建议按受影响 id 增量同步或 debounce 到后台队列。
2. **启动链优化**：Electron 主进程 `app.whenReady` 串行 await 链 + DB 双开（canonical authority 检查开一次、主 init 再开一次，每次 3 趟 `PRAGMA quick_check` 全库扫描）；建议合并为单次打开并复核 quick_check 频率（涉及 canonical authority 时序，需专项验证）。
3. **`PromptDB.create` 返回值内存化**：省最后一次 PK SELECT，但需复制 `rowToPrompt` 映射（漂移风险），收益小，暂不做。
4. **content-addressed 对象库多次哈希**（canonical 存储部署）：同一对象每次 store/read 重复 sha256 最多 4 次；建议 size+mtime 短路校验与 `copyAndHash` 单次哈希。
5. **WebDAV 媒体全量重传**：push 不 diff 远端 manifest 的 per-file hash；建议先拉 manifest 再增量上传。
6. **web 首屏 locale 双下载**：`en` + 用户语言两个 ~250KB JSON 阻塞首渲染；建议 shell 先渲染、locale 懒加载。
7. **SkillManager 安装状态批量 IPC 的 identity churn**：`skills` 数组身份一变就全量重查（v0.8.2 同族问题）；建议按安装相关字段签名去抖。
8. **`PROMPT_SEARCH` 返回大文本列**：搜索每键返回 `user_prompt/system_prompt/notes/last_ai_response` 全文；建议复用 `getAllMeta` 投影。
9. **CLI bundle 未压缩**（1.32MB CJS，`minify: false`）：开启压缩约省 40-50% 解析量。
10. **web 既有测试 flake**：并行 workers 下模块级 `config.ts` 读取 `JWT_SECRET` 的收集竞态（干净树可复现），建议 config 惰性化或测试 setup 注入 env。

## 稳定文档同步

- 本变更行为边界已在 `specs/db|desktop|web/spec.md` 中描述；`spec/knowledge/*` 的对应更新待 change 收敛（converge）时随归档一并处理。
