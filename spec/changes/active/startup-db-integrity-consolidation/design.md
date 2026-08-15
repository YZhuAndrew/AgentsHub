# Design

## Traceability

| Requirement | Design | Verification | Task |
| --- | --- | --- | --- |
| `FR-SU-001`（单次打开 ≤2 趟 quick_check） | `DES-SU-001`（诊断结果复用 + 移除 fresh-reopen） | `TEST-SU-001`（pragma 计数断言） | `T-SU-001`（init.ts 两处合并） |
| `FR-SU-002`（损坏检测不变） | `DES-SU-002`（修复路径与错误语义不动） | `TEST-SU-002`（篡改 canary + 既有安全套件） | — |
| `FR-SU-003`（升级路径单次初始化） | `DES-SU-003`（prepare 不关句柄，主 init 复用缓存） | `TEST-SU-003`（canonical-storage-startup 既有套件 + 句柄同一性） | `T-SU-002`（index.ts） |

## init.ts 改动

1. **#1/#2 合并**：在 `initDatabase` 打开主句柄前计算一次 `diagnostics = inspectDatabaseIntegrity(dbPath)`（仅当文件存在且非空，与现状守卫一致）；
   - `databaseRequiresExclusiveMaintenance(dbPath)` 改为 `databaseRequiresExclusiveMaintenance(dbPath, diagnostics)`——不再自扫；
   - `ensureDatabaseIntegrity(dbPath, ensureSafetyPoint)` 改为接受预计算 diagnostics——不再自扫。
   - 两函数签名内部化（非导出），无包外影响。
2. **移除 fresh-reopen**：删除 `verifyInitializedDatabase` 末尾的 `inspectDatabaseIntegrity(dbPath)` 重扫；其余验证（on-handle quick_check、`databaseAppearsCurrent`、索引存在性、`foreign_key_check`、`assertDatabaseCompatibility`）原样保留。

## index.ts 改动

`prepareSourceDatabase`：`const sourceDatabase = initDatabase(); applyE2ESeed(sourceDatabase);`——移除 `finally closeDatabase()`。模块级 `db` 缓存使 1522 行的 `initDatabase()` 直接返回该句柄。租约由 app 关闭时的 `closeDatabase` 统一释放（与稳态路径一致）。

安全性论证：`publishCanonicalStorageAuthority` 以 `new DatabaseAdapter(path, { readOnly: true })` 独立打开源库；主句柄此阶段无未决事务，rollback journal 下读写不阻塞，`busy_timeout` 兜底。

## 权衡与被否方案

- **quick_check 条件化（仅脏关机后跑）**：收益更大但需持久化关机状态标记与崩溃语义分析，独立 change。
- **#4 保留但跳过当迁移未执行时**：稳态下 `initializeSchema` 事务仍会执行 CREATE IF NOT EXISTS 语句流，"是否迁移"判定引入新状态；当前合并已把稳态降到 2 趟，先到此为止。
- **验证全部移到异步/启动后**：改变损坏库的失败时序（窗口出现前 vs 后），影响恢复 UX，否决。

## 验证层选择

- 真实文件库 + `DatabaseAdapter.prototype.pragma` spy 计数（`quick_check` 源参数）。
- 既有 database-* / canonical-storage-* 套件作为行为回归网。
