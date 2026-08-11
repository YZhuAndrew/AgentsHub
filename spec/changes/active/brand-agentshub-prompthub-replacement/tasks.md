# Tasks

- [ ] `T-BRAND-001` 定义变更边界（proposal.md）；记录 keep/don't-keep 品牌契约
- [ ] `T-BRAND-002` 7 个 locale JSON value 批量替换 `PromptHub`→`AgentsHub`（保留小写 `prompthub` cask/CLI 文本）
- [ ] `T-BRAND-003` renderer 组件硬编码字符串替换（TitleBar/SettingsModal/Toast/RendererErrorBoundary 等）
- [ ] `T-BRAND-004` renderer settings / skill / agent / mcp / plugin / rules 面板硬编码 fallback 与文案替换
- [ ] `T-BRAND-005` main 进程用户可见消息替换（updater.ts / legacy-cli-invocation.ts）+ package.json description
- [ ] `T-BRAND-006` 服务文件错误文案替换，保留函数名（database-backup*.ts / self-hosted-sync.ts / cloud-api.ts / skill-package-operation.ts）
- [ ] `T-BRAND-007` AI 系统提示文本替换（ai-content-workflows.ts / quick-add-utils.ts / image-prompt-reverse-utils.ts）
- [ ] `T-BRAND-008` 验证：hardcode-regression 测试、i18n parity/相关组件测试、`pnpm lint`；`grep` 复核剩余 `PromptHub`（应只剩内部契约/保留项）
- [ ] `T-BRAND-009` 更新 implementation.md：记录实际改动、保留的内部契约清单与原因
