# Proposal

## Why

性能审计 follow-up #2：启动链上的数据库打开路径存在冗余的全库扫描与双重打开。

`initDatabase()` 对既有健康库每次执行 **4 趟 `PRAGMA quick_check`**（全文件页扫描）：

1. `databaseRequiresExclusiveMaintenance` → `inspectDatabaseIntegrity`（独占维护判定）
2. `ensureDatabaseIntegrity` → `inspectDatabaseIntegrity`（紧随其后、同一未修改文件——与 #1 完全重复）
3. `verifyInitializedDatabase` → `getQuickCheckDiagnostics`（迁移后在开句柄上验证，有意义）
4. `verifyInitializedDatabase` → `inspectDatabaseIntegrity`（fresh-reopen 再扫一遍——与 #3 读同一落盘状态）

外加 `shouldBackupDatabaseBeforeMigration` 的探测连接。大库（几十 MB 以上）冷启动因此多花数秒纯冗余 IO，且全部同步阻塞在 `app.whenReady` 串行链上。

此外升级首启路径（canonical authority 发布）中 `prepareSourceDatabase` 打开→关闭数据库，随后主初始化再次打开：同一文件完整初始化两遍（各付全部完整性检查）。稳态启动（already-canonical）只开一次，不受此影响。

## Scope

- In scope:
  - `packages/db/src/init.ts`：#1/#2 合并——启动前计算一次诊断并复用；#4 移除——保留 #3 的开句柄验证与 schema/index/FK 检查不变。
  - `apps/desktop/src/main/index.ts`：`prepareSourceDatabase` 打开后**不关闭**，主初始化的 `initDatabase()` 直接复用模块级缓存句柄（`if (db) return db`），消除升级路径双开。
- Out of scope:
  - 完整性检查的存在性与修复路径（freelist/index 修复、safety point、backup before migration）——全部保留。
  - 启动链其他串行步骤的重排（canonical authority 时序敏感，另行评估）。
  - quick_check 的条件化跳过（如仅在脏关机后执行）——更激进，需独立设计。

## Risks

- 移除 fresh-reopen 验证降低一层防御：#3 已在提交后通过同一 VFS 从磁盘读取验证；rollback-journal 模式下已提交状态对新读者与当前读者一致。既有安全测试（safety point、migration locks、historical fixtures）作为回归网。
- 复用 prepare 打开的句柄跨越 `publishCanonicalStorageAuthority`（其内部以只读 adapter 独立打开源库）：主句柄此时无事务、空闲，rollback journal 下读读不冲突；busy_timeout 已设置兜底。
- 租约语义：prepare 句柄由短生命周期变为与主句柄相同的 app 生命周期，租约持有期与稳态路径一致。

## Rollback Thinking

- init.ts 两处独立小改，可单独 revert；行为差异仅是重复扫描次数。
- index.ts 的句柄复用 revert 即恢复 open/close/open。

## Verification Strategy

- 新测试：健康既有库二次 `initDatabase` 期间 `PRAGMA quick_check` 执行次数 ≤ 2（当前实现为 4，先失败后通过）。
- 既有套件全绿：database-safety-point、database-migration-locks、database-historical-fixtures、canonical-storage-startup/authority、prompt-hot-path（含 FTS 迁移幂等重开）。
- 损坏库检测 canary：文件被篡改时 `initDatabase` 仍抛完整性错误。
