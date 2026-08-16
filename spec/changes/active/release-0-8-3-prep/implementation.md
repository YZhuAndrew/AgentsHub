# Implementation

## 已落地内容（发布准备）

- 版本对齐 10 处：root/apps（cli/desktop/mobile/web/web-cloudflare）/mobile app.json 的 `0.8.3`、`CLI_VERSION`、`version-alignment.test.mjs` 与 CLI `run.test.ts` 基线。
- `CHANGELOG.md` 0.8.3 双语条目：两个紧急白屏修复 + 四组性能优化说明，含 verbatim「macOS 安全说明」。
- `spec/releases/0.8.3.md` 发布记录 + `spec/releases/README.md` 索引行。
- `spec/changes/index.md`：补登 5 个本轮 active change（含 release-0-8-3-prep）。
- `README.md` + 六语言 `docs/README.*.md`：徽标升至 v0.8.3_stable、各语言发布历史段落。
- `pnpm --dir website sync:release`：`website/src/generated/release.ts`（v0.8.3、下载链接）、changelog/introduction 双语文档再生成，确认 0.8.3 含 macOS 说明。

## 验证记录

- `pnpm test:ci-config`（detect-ci-surfaces + version-alignment）：8/8 通过。
- `pnpm --filter @prompthub/cli test`：14 文件 / 123 测试通过（含 `prompthub --version` = 0.8.3 断言）。
- `pnpm spec:index` 重新生成 change 索引（手工编辑被治理检查判定 stale；生成器输出含全部 5 个新 change，Active 49→54）。
- `pnpm verify:release:quick`：全绿（governance-spec/file-size、shared/db/core typecheck+test、desktop lint/typecheck/unit×8、web/web-cloudflare lint+typecheck+test、mobile typecheck+test；总计 507.8s）。
- 打包产物运行时验证（0.8.3 内容等同本地已验证构建）：CDP 实测主界面完整渲染、异常 0；`pnpm bundle:budget` 通过。
- CI release workflow 将在构建前执行完整 `pnpm verify:release` 门禁。

## 发布执行记录

（发布后回填：workflow run、draft-promote、资产与 latest-*.yml 验证、GitHub issue 快照状态。）

## 发布执行记录

- 首次 dispatch（run 31922651538，tag v0.8.3 → cfae94e1）：verify 门禁失败——desktop-e2e-smoke 中两个 self-hosted e2e `firstWindow` 超时。诊断：`b2b2e656`（canonical-authority 源库句柄复用）在 fresh-profile 发布路径破坏第二启；期间曾误判为 e2e chunk 环复发（bisect 使用的陈旧 out/ 构建污染了复现，已澄清并纠正方法：每次判定前强制干净重建）。
- 处置：`29102c34` revert 句柄复用（保留 quick_check 整合），见 startup-db-integrity-consolidation implementation.md 追加记录。
- 复验：revert 后本地 self-hosted e2e 2/2 通过；tag 重指向后重新 dispatch。

## 第二次 dispatch 诊断（run 31926844469）

- test 6（startup backup）通过——句柄复用 revert 生效；test 7 在「Restored N prompts」toast 断言超时：恢复流程 `showToast` 后 `setTimeout(reload, 1000)`，慢速 CI 上恢复完成时的 CPU 尖峰使渲染循环卡顿，toast 在 Playwright 两次轮询之间完成"出现→销毁"。
- 修复：重载延迟 1000ms → 3000ms（`useDataSyncController.ts`）——1 秒本就不够读完四段式 toast，属 UX 与测试稳定性双赢；本地 2/2 复跑通过。
