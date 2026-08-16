# Proposal

## Why

实测缺陷：用户用 Finder 浏览 `~/Library/Application Support/PromptHub/data/` 后（本地优先产品的正常使用——工作区本来就是给用户看的普通文件目录），macOS 自动写入 `.DS_Store`，桌面端**每次启动**都在 canonical 图谱导入阶段失败：

```
startup:bootstrap_workspace_failed
"canonical graph file inventory count mismatch: .DS_Store"
```

启动链中断导致窗口空白。`pnpm electron:dev` 正常是因为 dev 使用另一套用户数据目录。

仓库已有 OS 元数据忽略约定（`storage-inventory.ts` 的 `IGNORED_EMPTY_ENTRIES = {".DS_Store", "Thumbs.db"}`，`runtime-storage-context.ts` 两处 `.DS_Store` 排除），但 `prompt-canonical-import.ts` 的 `inventoryRoot` 清单遍历没有应用同一约定——边界不一致使一处浏览器操作即可永久阻断启动。

## Scope

- In scope: `inventoryRoot` 遍历跳过 OS 元数据文件（`.DS_Store`、`Thumbs.db`，任意层级）；单一事实来源——从 `storage-inventory.ts` 导出复用该集合。
- Out of scope: 删除磁盘上已存在的 `.DS_Store`（忽略即可，删了也会随 Finder 再次生成）；resource-bundle 导入侧的独立校验（导出格式由本产品生成，不应混入 OS 文件，维持严格）。

## Risks

- 放宽校验理论上扩大"未被清单声明的文件"容忍面：仅限两个固定文件名，且 skills/ 等前缀本就允许未声明文件，风险可忽略。

## Rollback Thinking

- 单点小改，revert 即恢复严格行为。

## Verification Strategy

- 失败测试：canonical 根目录与 `skills/<id>/files/` 下存在 `.DS_Store`/`Thumbs.db` 时 `readPromptCanonicalGraph` 成功且数据完整（当前根目录场景抛错）。
- 既有 tamper 用例（多余普通文件仍抛 `inventory count mismatch`）保持——容忍面不扩大到任意文件。
