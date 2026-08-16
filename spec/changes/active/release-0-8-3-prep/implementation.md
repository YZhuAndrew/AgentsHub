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
