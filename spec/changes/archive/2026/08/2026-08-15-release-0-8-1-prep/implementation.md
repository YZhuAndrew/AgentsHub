# Implementation: Release 0.8.1 Prep

## What Shipped

- Version alignment to 0.8.1 across: root package.json, apps/desktop,
  apps/cli, apps/web, apps/web-cloudflare, apps/mobile package.json,
  apps/mobile/app.json, `CLI_VERSION`, the version-alignment guard, the CLI
  version test, and AGENTS.md.
- CHANGELOG 0.8.1 bilingual entry with the verbatim macOS unsigned-fork
  notice; `spec/releases/0.8.1.md` record; releases index row.
- README.md + docs/README.{en,zh-TW,ja,de,es,fr}.md version badges and 0.8.1
  history sections.
- Website metadata regenerated via `pnpm --dir website sync:release`
  (release.ts, changelog.md, both introduction docs).
- Commits: `49418ce0` (symlink containment), `124c2644` (reconcile
  performance), `6ea54be1` (release prep); tag `v0.8.1`.

## Verification

- `pnpm test:ci-config` (version alignment): 8/8 passed.
- `pnpm spec:index` / `spec:index:check` / `spec:test`: passed (21 changes).
- `pnpm verify:release:quick`: all listed checks passed (582.2s, max
  concurrency 2).
- `pnpm --filter @prompthub/cli test`: 123/123 passed (includes the 0.8.1
  CLI version assertion); `pnpm typecheck`: clean.
- CI release workflow run `31870190583` (workflow_dispatch on tag
  `v0.8.1`): verify (full `pnpm verify:release`) success; mac arm64 /
  win x64 / linux builds success; draft release created with 14 assets
  (dmg/zip/exe/AppImage/deb, merged `latest*.yml` update manifests verified
  by `verify-update-manifest`, CLI tarball).
- Release notes verified to include the macOS 安全说明 notice; draft
  promoted with `gh release edit v0.8.1 --draft=false --latest`.
- Mirror sync rerun dispatched (run `31870838308`) for Homebrew cask and
  R2 stable mirror.

## Skipped Surfaces

- GUI screenshots and desktop locale files: hotfix changes no visible copy;
  no i18n keys added.
- No GitHub issues were filed for the two defects, so no issue closure or
  `spec/issues/` snapshot refresh was required.

## Stable Docs Synced

- `spec/knowledge/behavior/data-recovery.md` (hydration + containment
  contracts) via the two fix changes.
- `spec/releases/README.md` index and `spec/releases/0.8.1.md`.
