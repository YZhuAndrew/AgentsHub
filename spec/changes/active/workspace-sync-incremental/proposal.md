# Proposal

## Why

性能审计（`runtime-perf-optimizations` change 的 follow-up #1）确认：桌面端 `prompt.ipc.ts` 中约 22 个 handler 与 web 端 `prompt.service.ts`/`folder.service.ts` 的每次 prompt/folder 变更都调用 `syncPromptWorkspaceFromDatabase` 做**全量**工作区重建。以 500 prompts × 10 versions 计，单次"切收藏/改标题/拖拽排序"要：

- 桌面：重写全部 prompt `.md` + 全部版本文件（>5000 次 `writeFileSync`，同步阻塞主进程事件循环，冻结所有 IPC），外加 4 次全树遍历；
- web：N+1 读取（`getById` per row）+ 版本表被完整查询两遍 + 全目录 staging 重写，同步阻塞请求线程。

其中 10 个 handler（PROMPT_RELATION_* / PROMPT_OUTPUT_FORMAT_* 共 5+5）产生的文件内容**完全不变**——relation 与 output-format 不进入任何工作区文件，它们触发的全量同步是纯浪费（其真实需求只是 canonical graph 发布）。

## Scope

- In scope:
  - 桌面 `apps/desktop/src/main/services/prompt-workspace.ts`：新增定向同步 `syncPromptWorkspaceForPrompts`——只为受影响 prompt id 写 `.md` 与版本文件；孤立文件回收复用现有 readdir 遍历（不读内容）。
  - 桌面 `apps/desktop/src/main/ipc/prompt.ipc.ts`：按变更类别接线——单 prompt 变更走定向同步；relation/output-format 走 `publishCanonicalGraph()`；restore/migrate/显式同步/标签全局操作中无法定向的保留全量。
  - `packages/db`：`renameTag`/`deleteTag`/`movePrompt` 增量返回受影响 prompt id（additive 返回值）；新增 `getVersionById`。
  - web `apps/web/src/services/prompt-workspace.ts`：消除 N+1（单条 SELECT）与版本双查（预取版本按 promptId 分组传入写循环）。
  - 写前内容比较（读旧文件，相同则跳过写）应用于定向写入路径。
- Out of scope（记录为 follow-up）:
  - web 端定向同步（其 staging + 原子换名架构需独立设计）。
  - skill workspace 全量同步增量化（`skill.service.ts`，独立 change）。
  - folder 变更增量化：folder 重命名/移动天然影响子树全部路径，保留全量同步。
  - `PROMPT_COPY` 的 `incrementUsage` 未触发同步（现状即如此，usage_count 不在 frontmatter，无需同步——本变更将此事实写入测试固化）。

## Risks

- 定向同步的路径分配必须与全量同步**完全一致**（标题碰撞后缀 `title-<id8>.md` / `title-N.md` 依赖全体 prompts 的分配顺序）。风险控制：定向同步用 `getAllMeta` 以与全量相同的顺序为全体 prompts 计算路径（纯内存字符串操作），仅写脏 id；测试覆盖碰撞场景。
- handler 分类错误会导致文件陈旧。风险控制：按"该操作改变哪些 frontmatter 字段"逐 handler 论证并写入 design；测试固化"relation 变更不产生任何文件写"。
- 孤立文件检测依赖遍历而非 handler 知识，正确性与全量同步共享同一套逻辑（collectPromptFiles + expectedPaths diff）。
- DB 返回值变化（void → string[]）为 additive，不破坏现有调用方（web 端调用这些方法处不读返回值）。

## Rollback Thinking

- 定向同步是**新增**导出函数；全量同步原样保留。回滚 = handler 接线 revert 到 `syncWorkspace()`，无数据迁移。
- DB 返回值 additive，回滚无影响。
- canonical graph 发布语义在定向路径上与全量路径完全一致（两者开头都调用 `publishCanonicalGraph()`）。
- 启动引导（`bootstrapPromptWorkspace`）与 canonical reconcile 不变，作为最终一致性兜底。

## Verification Strategy

- 真实 SQLite + 真实临时目录测试：
  - 定向更新 1 个 prompt：仅该 `.md` 与其版本目录 mtime 变化，其他文件 mtime 不变；
  - 改名/移动 folder 内 prompt：旧文件进 trash、新路径出现、无碰撞残留；
  - 标题碰撞场景下定向与全量路径分配一致性；
  - 删除 prompt 后孤立 `.md` 与版本目录回收；
  - `renameTag`/`deleteTag`/`movePrompt` 返回的受影响 id 集合正确（含拖拽时的兄弟排序）；
  - relation/output-format 变更不产生文件写（调用计数）；
  - 既有 `prompt-workspace.test.ts` 全绿（全量语义不变）。
- web：既有 `prompt-workspace.test.ts`/`prompt.service.test.ts` 全绿 + 新增断言（版本仅查询一次可通过 spy 计数）。
