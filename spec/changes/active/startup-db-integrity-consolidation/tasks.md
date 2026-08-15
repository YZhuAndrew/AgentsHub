# Tasks

- [x] 失败测试：健康既有库再次 `initDatabase` 期间 `quick_check` pragma 执行 ≤2 次（当前 4）
- [x] 失败测试：句柄复用——prepare 打开后模块缓存非空（或经 canonical-storage-startup 套件覆盖后补断言）
- [x] canary 测试：篡改库文件后 `initDatabase` 仍抛完整性错误
- [x] init.ts：诊断复用（#1/#2 合并）
- [x] init.ts：移除 verifyInitializedDatabase 的 fresh-reopen 扫描
- [x] index.ts：prepareSourceDatabase 不再 close
- [x] 既有 database-safety-point / migration-locks / historical-fixtures / canonical-storage-* / prompt-hot-path 全绿
- [x] 全量验证 + implementation.md
