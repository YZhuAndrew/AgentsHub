# Proposal

## Why

v0.8.2 之后的本地测试发现两个启动白屏缺陷（canonical 清单拒绝 Finder 写入的 `.DS_Store`；manualChunks 跨 chunk 初始化环使打包版渲染进程挂死），前者在已发布的 v0.8.2 中同样存在。需要一版紧急修复（0.8.3）把两个 fix 连同已合入的性能优化一起送达稳定通道用户——auto-update 客户端只能通过新版本号获得修复。

## Scope

- 版本对齐全部发行面（root/apps/packages/CLI_VERSION/对齐测试基线）至 0.8.3。
- CHANGELOG 0.8.3 双语条目 + macOS 未签名安全说明原文。
- `spec/releases/0.8.3.md` 记录、README 与六语言文档的版本徽标/发布历史同步、website `sync:release`。
- 验证：`pnpm test:ci-config`、`pnpm verify:release:quick`；发布门禁 `pnpm verify:release` 由 CI release workflow 执行。

## Risks

- 发布节奏风险：0.8.3 与 0.8.2 相邻一天，遵循 next-patch 语义（不复用版本号）；非同日取代，无需旧版公告改写。
