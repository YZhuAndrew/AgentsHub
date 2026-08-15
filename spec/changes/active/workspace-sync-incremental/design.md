# Design

## Traceability

| Requirement | Design | Verification | Task |
| --- | --- | --- | --- |
| `FR-WS-001`（定向同步只写受影响文件） | `DES-WS-001`（getAllMeta 全量路径分配 + 脏 id 写入） | `TEST-WS-001`（mtime 不变断言） | `T-WS-001`（targeted sync 函数） |
| `FR-WS-002`（定向同步与全量等价：孤立回收、改名旧文件回收、碰撞一致） | `DES-WS-002`（复用 collectPromptFiles walk + expectedPaths diff） | `TEST-WS-002`（rename/move/collision/orphan 场景） | `T-WS-001/T-WS-002` |
| `FR-WS-003`（relation/format 不写文件） | `DES-WS-003`（替换为 publishCanonicalGraph） | `TEST-WS-003`（写调用计数为零） | `T-WS-002`（IPC 接线） |
| `FR-WS-004`（变更写入次数 ∝ 受影响数而非总数） | `DES-WS-004`（handler 分类接线表） | `TEST-WS-001/003` | `T-WS-002` |
| `FR-DB-001`（受影响 id 返回） | `DES-DB-001`（事务内收集 id） | `TEST-DB-001`（rename/delete/move id 集合） | `T-DB-001` |
| `FR-WEB-001`（web N+1/双查消除） | `DES-WEB-001`（单 SELECT + 预取版本分组） | `TEST-WEB-001`（既有套件 + 查询计数） | `T-WEB-001` |

## Handler 分类接线表（desktop prompt.ipc.ts）

判据：该操作是否会改变某个 prompt 的 frontmatter 字段（`.md` 内容）或版本文件；relation/output-format 不进入任何工作区文件。

| Handler | 类别 | 同步动作 |
| --- | --- | --- |
| PROMPT_CREATE | 单 prompt | targeted([created.id]) |
| PROMPT_UPDATE | 单 prompt | targeted([id]) |
| PROMPT_DELETE | 单 prompt 删除 | targeted([id])（id 已不在 DB → 孤立回收） |
| PROMPT_INSERT_DIRECT | 单 prompt | targeted([prompt.id]) |
| PROMPT_MOVE | 多 prompt（siblings） | targeted(movePrompt 返回集) |
| PROMPT_RENAME_TAG / PROMPT_DELETE_TAG | 多 prompt（tags） | targeted(返回集)；空集时仅 publishCanonicalGraph |
| VERSION_CREATE / VERSION_ROLLBACK | 单 prompt | targeted([promptId]) |
| VERSION_DELETE | 单 prompt | targeted([getVersionById(versionId).promptId]) |
| VERSION_INSERT_DIRECT | 单 prompt | targeted([version.promptId]) |
| PROMPT_RELATION_*（5 个） | 无文件影响 | `db.publishCanonicalGraph()` |
| PROMPT_OUTPUT_FORMAT_*（5 个） | 无文件影响 | `db.publishCanonicalGraph()` |
| PROMPT_RESTORE_GRAPH / PROMPT_MIGRATE_IDB_BATCH / PROMPT_SYNC_WORKSPACE | 全库 | 全量 sync（不变） |
| PROMPT_COPY（incrementUsage） | 无文件影响 | 现状不触发同步（usage_count 不在 frontmatter），保持 |

## 定向同步算法（desktop）

```
syncPromptWorkspaceForPrompts(promptDb, folderDb, promptIds):
  1. promptDb.publishCanonicalGraph()          // 与全量路径一致
  2. folders = folderDb.getAll(); folderMap
     metas = promptDb.getAllMeta()              // 轻量投影：路径分配只需 id/title/folderId
  3. 按 getAll 顺序为全体 prompts 计算路径（getPromptFilePath 语义，
     纯字符串），得到 expectedPromptPaths / pathById / takenPaths
  4. for id of promptIds 且仍存在:
       content-compare 后写 .md（新文件或内容变化才写）
       版本目录：写该 id 的版本文件（内容比较）+ 回收该目录内 DB 不存在的版本文件
  5. 孤立回收（与全量同一逻辑，遍历不读内容）:
       collectPromptFiles(promptsDir) 中不在 expectedPromptPaths 的 → trash
       collectLegacyPromptDirs 不在 expected 中的 → trash
       versions root 下 id 不在 DB 的目录 → trash（cleanupLegacyVersionDirs）
  6. pruneEmptyDirs(promptsDir)
```

- 步骤 3 的 O(N) 是纯内存字符串操作（无 IO），保证碰撞后缀分配与全量一致。
- 步骤 5 的遍历是 readdir-only（现有 collectPromptFiles 不读文件内容），成本远低于其替代的全量写。
- folder 元数据文件不由定向同步维护（folder 变更不改 prompt 路径以外的部分；`_folder.json` 由全量路径与 folder handler 维护）。

## 内容比较写入

`writeFileIfChanged(filePath, contents)`：存在且 `readFileSync` 相同则跳过 `writeFileSync`。应用于定向路径的 `.md` 与版本文件。读取与写入同量级 IO，但跳过时避免 fsync 与 mtime 抖动（后者会被文件监视/备份工具放大）。

## DB API（packages/db，additive）

- `renameTag`/`deleteTag`：事务内已遍历受影响行，收集 id 返回。
- `movePrompt`：事务内收集 old siblings + target siblings + moved id（含跨父移动时两组）。
- `getVersionById(versionId)`：单行 SELECT，映射 `rowToVersion`。

## Web 端（机械修复）

- `listAllPrompts`：`SELECT * FROM prompts ORDER BY updated_at DESC` 一次取回（owner/visibility 字段已在行内），映射 rowToPrompt——消除 N+1。
- 版本双查：`syncPromptWorkspaceFromDatabase` 已预取 `promptVersions`，改为按 promptId 建 Map 传入 `writePromptWorkspaceSnapshot`，删除其内部 per-prompt `getVersions`。
- 注：web 的全量 staging + 原子换名架构保留；定向同步作为 follow-up（涉及 staging 生命周期设计）。

## 权衡与被否方案

- **handler 记录旧路径供删除回收**：依赖 handler 先读后删的时序，且无法覆盖碰撞后缀；改用遍历 diff（与全量共享逻辑）。
- **debounce 后台队列化全量同步**：把阻塞移出 IPC 响应，但退出时序/持久性语义变化（用户可在 flush 前退出），且仍是 O(N) 写；否决，保留同步语义。
- **module 级脏集合隐式累积**：隐藏全局状态，违反显式契约取向；否决。
- **web 端同步做完整定向化**：staging 架构需重设计，本轮以 N+1/双查消除 + desktop 定向化交付，web 定向化列 follow-up。

## 验证层选择

- desktop：真实 SQLite（:memory:）+ 真实临时目录；mtime 快照断言"未变"；trash 目录断言；IPC 层用 spy 计数 writeFileSync 验证 relation 零写。
- web：既有 prompt-workspace / prompt.service 套件 + 新增查询计数断言。
