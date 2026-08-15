# Tasks

## P1 — DB API（additive 受影响 id 返回）

- [x] 失败测试：renameTag/deleteTag 返回受影响 id 集合（含"无匹配返回空数组"）
- [x] 失败测试：movePrompt 返回 moved + 新旧 siblings 的并集（含跨父移动）
- [x] 失败测试：getVersionById 存在/不存在两态
- [x] 实现 `prompt.ts` 三处返回值与 `getVersionById`
- [x] 既有 prompt-db 套件全绿（返回值 additive 不破坏）

## P2 — 桌面定向同步

- [x] 失败测试：targeted 更新单 prompt 仅写该文件（其他文件 mtime 不变，内容比较跳过重复写）
- [x] 失败测试：改名 prompt 旧文件入 trash、新文件出现；碰撞标题下路径与全量一致
- [x] 失败测试：删除 prompt 后 .md 与版本目录入 trash
- [x] 失败测试：move/renameTag 场景 targeted 后磁盘状态 == 全量同步状态（等价性快照对比）
- [x] 实现 `syncPromptWorkspaceForPrompts` + `writeFileIfChanged` + writePromptToDisk 接受预计算路径
- [x] 既有 `prompt-workspace.test.ts` 全量语义全绿

## P3 — IPC 接线

- [x] 失败测试：relation/output-format 变更产生零文件写（spy writeFileSync）
- [x] 按 design 接线表替换 22 处调用（targeted / publishCanonicalGraph / 全量保留）
- [x] 既有 prompt-ipc 相关测试全绿

## P4 — Web 机械修复

- [x] 失败测试：一次同步内 getVersions 每方法仅一次全量查询（或断言无逐行 getById）
- [x] 实现 listAllPrompts 单 SELECT + 版本预取分组传入
- [x] 既有 web prompt-workspace / prompt.service 套件全绿

## P5 — 收敛

- [x] `pnpm lint` + `pnpm typecheck` + `pnpm test:run` 全绿；web `pnpm test`
- [x] implementation.md：实测前后对比（写入次数）、follow-up（web 定向化、skill workspace）
