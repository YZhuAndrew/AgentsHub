# Release 0.8.1 Prep Proposal

## Phase And Status

- Phase: implement
- Status: in-progress
- Primary requirements: `FR-REL-081-001` through `FR-REL-081-003`
- Related shipped work: `storage-inventory-symlink-containment` (49418ce0),
  `canonical-workspace-reconcile-performance` (124c2644)
- Exit condition: 0.8.1 manifests, changelog, release record, localized docs,
  and website metadata are aligned; verify gates pass; the tagged draft
  release is promoted to latest stable.

## Why

v0.8.0 (published 2026-08-14) shipped two regressions that affect every
upgrader on first launch: a startup lockout for symlink-carrying imported
skills and a canonical workspace reconcile storm that stalls startup and
freezes the Skills page. Both fixes are committed to main; a hotfix release
is required so published 0.8.0 users can upgrade.

## Scope

- Version alignment to 0.8.1 across root and workspace manifests, the CLI
  runtime version, the version-alignment guard, and AGENTS.md.
- CHANGELOG 0.8.1 entry (bilingual) with the verbatim macOS unsigned-fork
  security notice.
- `spec/releases/0.8.1.md` record plus releases index.
- README + six localized README histories and version badges.
- Website release metadata via `pnpm --dir website sync:release`.
- Tag `v0.8.1`, CI draft release, promote after verification.

## Non-Goals

- Feature work beyond the two hotfix commits.
- GUI copy, i18n keys, or screenshot changes (no user-visible surface beyond
  performance/behavior fixes).
- Homebrew/R2 mirrors: handled by the release workflow after promote.

## Risks And Rollback

- Risk: none specific to prep; the release workflow gates builds behind the
  full verify profile.
- Rollback: hotfix is forward-only; a bad release would be superseded by
  0.8.2 after pulling the 0.8.1 tag.

## Impacted User Flows

- 0.8.0 upgraders: startup completes and the Skills page stays responsive;
  symlink-carrying imported skills publish successfully.
