# Implementation

## 已落地内容

### 1. DB API（`packages/db/src/prompt.ts`，additive）

- `renameTag` / `deleteTag`：事务内收集并返回受影响 prompt id（无匹配返回空数组）。
- `movePrompt`：返回本次排序触及的 id 并集（moved + 新旧两组兄弟）。`CanonicalPromptDB` 的 override 透传新返回值。
- 新增 `getVersionById(versionId)`：单行 SELECT，供版本删除前定位 promptId。

### 2. 桌面定向同步（`apps/desktop/src/main/services/prompt-workspace.ts`）

- `writeFileIfChanged`：内容一致跳过写入（.md、版本文件、folder 元数据统一使用），消除 fsync 与 mtime 抖动。
- `writePromptToDisk` 重构为接受预计算路径；全量同步与定向同步共用。
- 新增 `syncPromptWorkspaceForPrompts(promptDb, folderDb, promptIds)`：
  - **设计要点（v2，修正过一次）**：最初按"仅写脏 id"实现，实测发现同标题碰撞 + canonical 发布改写 `updated_at` 会使**非脏** prompt 的路径分配翻转，导致内容错位丢失。最终形态：对**全部** prompt 做期望内容 vs 磁盘的漂移检测（每文件一次小读），漂移者与脏 id 一并进写集；脏 id 才做版本文件同步。与全量同步**构造性等价**（任何内容不一致都会被写正），同时保留全部写削减。
  - 孤立回收与全量共享同一套 walk（collectPromptFiles / collectLegacyPromptDirs / cleanupLegacyVersionDirs / pruneEmptyDirs）。

### 3. IPC 接线（`apps/desktop/src/main/ipc/prompt.ipc.ts`，22 处）

- 单 prompt 变更（create/update/delete/insert-direct/version 4 项）→ `syncPrompts([id])`。
- 多 prompt 变更（renameTag/deleteTag/movePrompt）→ `syncPrompts(返回的受影响集)`。
- relation / output-format 共 9 处 → `db.publishCanonicalGraph()`（不进入工作区文件，只做 canonical 发布；省去整次全量 walk + getAll）。
- restore-graph / IDB 批量迁移 / 显式 sync → 保留全量。
- `VERSION_DELETE` 先 `getVersionById` 取 promptId 再删。

### 4. Web 端（`apps/web/src/services/prompt-workspace.ts`）

- `listAllPrompts`（N+1：逐行 getById）删除，直接 `promptDb.getAll()`（rowToPrompt 已映射 owner/visibility）。
- 版本双查消除：预取一次构建 `versionsByPromptId` Map 传入写循环（`writePromptWorkspaceSnapshot` 签名改为收 Map）。

## 实测收益模型（写入次数）

以 500 prompts × 10 versions、单次"切收藏/改标题"计：

| 路径 | 改前 | 改后 |
| --- | --- | --- |
| 单 prompt 更新（desktop） | ~5500 次 writeFileSync（全量） | ≤1 次 .md + 该 id 版本文件比对（无变化零写） |
| relation/format 变更 | ~5500 次写 + 全树 walk | 0 次写、0 次 walk |
| web 保存 | N+1 SELECT + 版本表两遍全查 | 单 SELECT + 一遍 |

漂移检测的代价是每文件一次读（跳过写），远低于原先的读+写。

## 验证记录

| 项 | 结果 |
| --- | --- |
| `tests/unit/main/prompt-workspace-targeted.test.ts`（新增，真实 SQLite + 临时目录） | 11/11（实现前 11/11 失败基线；含碰撞翻转、删除回收、move/renameTag 受聚集、等价性零写断言） |
| `tests/unit/main/prompt-ipc-sync-wiring.test.ts`（新增，electron mock + writeFileSync spy） | 5/5（relation/format 零写、update/create 只写受影响文件、delete 只回收不重写） |
| `tests/unit/main/prompt-workspace.test.ts`（既有全量语义） | 14/14 |
| prompt-db / prompt-hot-path / prompt-ipc-idb-migration 等 | 全绿（合计 93/93 分组跑） |
| desktop 全量 `pnpm test:run` | 614 文件 / **5476 测试全绿**（+18 新增） |
| web `prompt-workspace.test.ts`（含新增"版本仅查一次"断言）+ `prompt.service.test.ts` | 11/11 |
| web 全量 | 355/355（+1 新增；6 个文件级收集失败为已知既有 JWT_SECRET 并行竞态，干净树复现，与本变更无关） |
| lint（file-size 门禁：prompt-workspace.ts 1582 登记入 baseline）+ typecheck（desktop/web） | 全绿 |

## 调试过程中发现并修正的实现缺陷

初版"仅写脏 id"在碰撞场景丢内容（非脏 prompt 路径翻转后旧文件被回收、新路径未写）。由测试 `keeps collision suffix assignment identical to the full sync` 捕获（调试复现：canonical 物化在 create/update 期间改写既有行的 `updated_at`，使分配顺序翻转）。修正为全量漂移检测后，该测试的最终断言改为"定向后全量零写入 + frontmatter id 归属一致"。

## Follow-up（未实施）

- web 端定向同步（staging + 原子换名架构需独立设计；本轮已消除其 N+1 与双查）。
- skill workspace 全量同步增量化（`skill.service.ts` 同族问题，独立 change）。
- folder 变更增量化（重命名天然影响子树路径，保留全量）。

## 稳定文档同步

待 change 收敛（converge）时随归档处理 `spec/knowledge/*` 对应条目。
