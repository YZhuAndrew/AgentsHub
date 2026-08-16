# Implementation

## 已落地内容

### 1. `packages/db/src/init.ts` — quick_check 4 趟 → 2 趟

- **打开前诊断复用**：`initDatabase` 在打开主句柄前计算一次 `inspectDatabaseIntegrity`，同时传给 `databaseRequiresExclusiveMaintenance`（独占维护判定）与 `ensureDatabaseIntegrity`（完整性闸门）。两个消费者之间文件无写入，原先的连续两次全库扫描消除。
- **移除 fresh-reopen 扫描**：`verifyInitializedDatabase` 末尾以全新连接重开并 quick_check 的第 4 趟删除。保留：迁移后在开句柄上的 quick_check、schema 不变量（`databaseAppearsCurrent`）、索引存在性、`foreign_key_check`、`assertDatabaseCompatibility`。修复路径（freelist-only / index-only 修复及其内部验证扫描）原样保留。

### 2. `apps/desktop/src/main/index.ts` — 升级路径双开消除

- `prepareSourceDatabase` 打开数据库并完成 E2E 种子后**不再 close**；主初始化的 `initDatabase()` 命中模块级缓存（`if (db) return db`），升级首启路径从两次完整初始化（各付全部完整性扫描）降为一次。租约随 app 关闭统一释放。`publishCanonicalStorageAuthority` 内部以只读 adapter 独立打开源库，与空闲主句柄无锁冲突（rollback journal 读读兼容，busy_timeout 兜底）。

## 实测效果

- 健康既有库每次打开的 `PRAGMA quick_check` 次数：**4 → 2**（由新测试以 `DatabaseAdapter.prototype.pragma` spy 计数锁定；原实现实测 4）。
- 升级首启（canonical 发布路径）：完整初始化 2 次 → 1 次（省 2 趟 quick_check + 探测连接 + 迁移事务两遍）。
- 库越大收益越大：quick_check 是全文件页扫描，大库上每趟即数百 ms~秒级。

## 验证记录

| 项 | 结果 |
| --- | --- |
| `tests/unit/main/database-startup-integrity.test.ts`（新增） | 2/2：`≤2 quick_check` 断言（原实现 4 次失败先行）+ 篡改库仍抛完整性错误 canary |
| database-safety-point / database-migration-locks / database-historical-fixtures / canonical-storage-startup / prompt-hot-path（含迁移幂等重开） | 51/51 |
| desktop 全量 `pnpm test:run` | 614 文件 / 5476 测试全绿 |
| lint + typecheck | 全绿 |

## Follow-up（未实施）

- quick_check 条件化（如仅脏关机标记后执行）：需持久化关机状态与崩溃语义分析，独立 change。
- 启动链其余串行步骤重排（backup/migration/workspace bootstrap 与首窗并行）：涉及 canonical authority 时序，另行评估。

## 追加（2026-08-16 发布验证）：句柄复用撤回

- **现象**：v0.8.3 CI 完整 verify 门禁中，两个 self-hosted e2e（fresh profile + 渲染器迁移标记 → canonical 发布路径）稳定失败（second launch `firstWindow` 30s 超时）；本地三连跑复现（revert 前挂 / revert 后过 / 重新应用又挂）。
- **结论**：`prepareSourceDatabase` 保持句柄打开与发布流程（`publishCanonicalStorageAuthority` 以独立只读 adapter 打开源库 + 快照/物化）在该场景下不兼容——macOS 常规启动（already-canonical，不触发该路径）与打包产物 CDP 验证均无法覆盖此分支。以 29102c34 撤回该优化；双开消除不做，quick_check 整合（4→2）保留且不受影响。
- **后续**：如需恢复该优化，须先在 packages/core 为 publish 阶段显式建模"外部读连接与主句柄共存"的锁语义（VFS 目录锁/租约交互），并以 self-hosted e2e 为准入测试。
- **验证**：revert 状态下 `self-hosted-sync.spec.ts` 本地 2/2 通过（干净构建）；`pnpm verify:release:quick` 全绿。
