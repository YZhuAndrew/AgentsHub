# Delta Spec — Prompt 工作区同步（desktop + web）

## Added

- 桌面端应提供定向同步入口：给定受影响 prompt id 集合，仅重写这些 prompt 的 `.md` 文件与 `versions/<promptId>/` 下的版本文件；未受影响 prompt 的文件不得被写入（mtime 不变）。
- 定向同步后，工作区状态应与全量同步等价：DB 中不存在的 prompt `.md` 文件被移入回收站，被改名/移动 prompt 的旧路径文件被移入回收站，无残留、无碰撞。
- `renameTag`、`deleteTag` 应返回实际被更新的 prompt id 集合；`movePrompt` 应返回排序受影响的 prompt id 集合（含被移动 prompt 与新旧两组兄弟）。
- prompt relation 与 output-format 的增删改不应触发任何工作区文件写入；其 canonical graph 发布语义保持。

## Modified

- 桌面端单 prompt 粒度的 IPC 变更（创建、更新、删除、版本创建/回滚/删除/直插、prompt 直插、移动、标签重命名/删除）在一次调用中产生的文件写入次数应与受影响 prompt 数量成正比，而不是与库内 prompt 总数成正比。
- 全库级操作（图谱恢复、IDB 批量迁移、显式工作区同步）与 folder 操作保留全量同步语义。
- web 端全量同步的读取路径：prompts 应通过单条 SELECT 取回（不再逐行 `getById`）；版本应在写循环外预取一次并按 promptId 分组复用（不再被查询两遍）。

## Scenarios

- 用户在 500 条 prompt 的库中切换一条收藏：仅该条对应的 `.md` 文件被写入，其余 499 个文件与全部版本文件 mtime 不变；操作耗时与库规模基本无关（文件写入层面）。
- 用户重命名一条 prompt：旧 slug 文件进入回收站，新 slug 文件出现且内容为新 frontmatter。
- 两条 prompt 同标题（碰撞后缀存在）时改名其中一条：两条文件路径均无碰撞，且与全量同步产出的路径一致。
- 用户删除一条 prompt：其 `.md` 进入回收站，其 `versions/<id>/` 目录进入回收站。
- 用户拖拽排序：受影响（`sort_order` 变化）的 prompt 文件被更新，无关文件不变。
- 用户创建/修改/删除 prompt relation 或 output-format 项：工作区文件零写入。
- web 端保存一条 prompt：版本表在一次同步内只被完整查询一遍，prompts 表不再发生逐行 `getById`。

# Delta Spec — 数据库 API（packages/db）

## Added

- `PromptDB.getVersionById(versionId)` 应返回对应版本行（不存在返回 null），供删除版本时定位 promptId。

## Modified

- `renameTag(old, new)`、`deleteTag(tag)` 返回值从 `void` 变为受影响 prompt id 数组（无更新时为空数组）。
- `movePrompt(promptId, newParentId, newOrder)` 返回值从 `void` 变为本次排序触及的 prompt id 数组。
- 以上均为 additive 变化：现有忽略返回值的调用方行为不变。
