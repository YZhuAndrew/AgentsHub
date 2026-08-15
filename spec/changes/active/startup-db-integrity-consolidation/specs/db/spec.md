# Delta Spec — 数据库初始化完整性检查（packages/db）

## Added

- `initDatabase` 对健康既有库的一次打开应至多执行 2 趟 `PRAGMA quick_check`：打开前一次（维护/备份决策复用），迁移事务提交后在打开句柄上一次（验证）。

## Modified

- 打开前的维护判定（`databaseRequiresExclusiveMaintenance`）与打开后的完整性确保（`ensureDatabaseIntegrity`）应共享同一次诊断结果，不对同一未修改文件连续扫描两遍。
- `verifyInitializedDatabase` 不再以全新连接重新打开并扫描数据库文件；迁移后验证保留在当前句柄上执行（quick_check、schema 不变量、索引存在性、外键检查、兼容性断言全部保留）。
- 损坏检测行为不变：quick_check 非健康时仍进入修复路径（freelist-only、index-only）或抛出错误；修复路径内的验证扫描不变。

## Scenarios

- 用户冷启动桌面端（健康库、稳态 already-canonical 路径）：`initDatabase` 执行 ≤2 趟全库 quick_check（此前 4 趟）；启动等待时间相应下降，库越大越明显。
- 升级首启（canonical authority 发布路径）：数据库只完整初始化一次；`prepareSourceDatabase` 打开的句柄被主初始化复用，不再关闭后重开。
- 数据库文件损坏：`initDatabase` 仍抛出完整性错误（或按既有规则修复 freelist/index 损伤），修复后验证仍通过。
- 迁移后 schema 缺表/缺列/缺索引/外键违规：`verifyInitializedDatabase` 仍按原有错误信息抛出。

# Delta Spec — 桌面启动（apps/desktop）

## Modified

- `prepareSourceDatabase` 打开数据库并完成 E2E 种子后不再关闭连接；随后的主 `initDatabase()` 返回同一缓存实例，升级路径上的第二次完整初始化（含其全部完整性扫描）被消除。
