# Implementation

## Shipped

- `fix(skill)` `aa00c90c`: Skill detail distribution selection stability and
  auto-scan/preview render fixes (see
  `2026-08-15-skill-detail-distribution-selection-stability`).
- `chore(release)` `3e93c853`: version alignment to 0.8.2 (root, CLI,
  desktop, web, worker, mobile manifests, `CLI_VERSION`, version
  assertions, AGENTS.md), bilingual CHANGELOG entry with the verbatim
  macOS unsigned-fork notice, `spec/releases/0.8.2.md` + index row, README +
  7 localized README badge/history sections, website release metadata
  regenerated via `pnpm --dir website sync:release`.

## Publication

- Tag `v0.8.2` pushed and release workflow dispatched on the tag
  (run 31884342315): CI verify job + macOS arm64 / Windows x64 / Linux x64
  builds all green; draft release created with 13 assets (DMG/ZIP/EXE/
  AppImage/deb, electron-updater manifests, CLI tgz).
- Draft promoted to latest stable 2026-08-15; v0.8.1 remains published with
  a bilingual upgrade advisory prepended to its release notes pointing users
  to 0.8.2 (in-app auto-update reaches installed 0.8.1 clients).
- Same-day supersession rationale recorded: same-version re-publication
  cannot reach already-installed 0.8.1 auto-update clients, so 0.8.2 is the
  only effective replacement path.

## Verification

- `pnpm test:ci-config` (version alignment): 8/8 passed.
- `pnpm --filter @prompthub/cli test`: 123/123 passed (0.8.2 assertion).
- Full `pnpm verify:release` local gate: all checks passed (452.0s) —
  shared/db/core/cli/desktop (8 unit shards, 4 integration shards,
  performance, build, bundle budget, e2e smoke)/web/web-cloudflare/mobile.
- Release page: 13 assets, macOS 安全说明 present, v0.8.2 marked latest.

## Skipped Surfaces

- Screenshots/docs imagery unchanged: no visible GUI emphasis change beyond
  behavior fixes.
- No locale file changes: fix is behavior-only; no user-facing copy added.
