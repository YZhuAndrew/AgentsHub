# Tasks

- [x] `T-BUILD-001` 明确 `FR / DES / TEST / T` 变更边界（proposal + specs/build/spec.md + design.md）
- [x] `T-BUILD-002` 完成 Analyze：无冲突、孤立 ID、阻塞性 `[待确认]`（design.md Analyze Result）
- [x] `T-BUILD-003` 修改 `apps/desktop/electron-builder.config.cjs`：mac dmg/zip → `["arm64"]`，win nsis → `["x64"]`
- [x] `T-BUILD-004` 修改 `apps/desktop/package.json`：`electron:build:mac` → `--arm64`，`electron:build:win` → `--x64`
- [x] `T-BUILD-005` 修改 `.github/workflows/release.yml`：删除 mac x64 与 win arm64 matrix 行；删除失效的 mac x64 验证分支
- [x] `T-BUILD-006` 更新 7 个 README 下载表与架构说明（README.md + docs/README.{en,zh-TW,ja,fr,de,es}.md）
- [x] `T-BUILD-007` 验证：`pnpm lint:file-size` 通过；`git status` 复核改动文件集合
- [x] `T-BUILD-008` 更新 `implementation.md` 与 Converge：记录实际改动、验证状态、移出 active 的后续步骤
