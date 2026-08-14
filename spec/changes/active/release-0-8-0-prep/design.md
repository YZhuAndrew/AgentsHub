# AgentsHub 0.8.0 Release Preparation Design

<!-- traceability: enforced -->

## `DES-REL080-001`: Distribution Version Sources

Update the root `package.json`, each shipped app's `package.json`
(desktop, cli, web, web-cloudflare, mobile), the Expo `apps/mobile/app.json`,
`CLI_VERSION` in `packages/core/src/cli/types.ts`, and the CLI `--version`
assertion in `apps/cli/tests/run.test.ts`. Keep `packages/core`,
`packages/db`, and `packages/shared` on their independent private package
versions. Align the `AGENTS.md` project context version to `0.8.0`.

## `DES-REL080-002`: Changelog Entry Structure

Add a `[0.8.0] - 2026-08-14` section above `[0.7.2]` following the existing
bilingual bullet format (Chinese line plus indented English line). Group the
content as 新功能 / Features, 性能 / Performance, 修复 / Fixes, and 维护 /
Maintenance. The entry describes changes relative to the previous stable
`0.7.2`, which includes content previously previewed only in the historical
`0.6.0-beta.1` prerelease tag. The verbatim macOS 安全说明 blockquote is
included once under the entry.

## `DES-REL080-003`: Release Record And Publication State

Create `spec/releases/0.8.0.md` with Status `Preparation` until the GitHub
Release is published, then update to `Published` with the tag and promotion
evidence. Add the record to the `spec/releases/README.md` index. Public
website badges stay on the published stable until `0.8.0` is marked as a
stable record with a dated changelog entry, after which
`pnpm --dir website sync:release` selects it automatically.

## `DES-REL080-004`: Localized README Sync

Update the release-history section of `README.md` and the six localized
`docs/README.*.md` files with the `0.8.0` entry and refresh the version
badges only after publication is confirmed; during preparation the badges
keep pointing at `v0.7.2` (published-stable isolation).

## Affected Areas

- Data model: none
- IPC / API: none
- Filesystem / sync: manifest, changelog, release record, and generated
  documentation files only
- UI / UX: no runtime UI change

## Tradeoffs

- Preparing the changelog before the tag risks a date shift if publication is
  delayed; the release record keeps the authoritative date and the changelog
  heading is corrected at publication time if needed.
- Bumping all distributions at once (rather than desktop-only) matches the
  established fork release pattern and keeps the sync-client version contract
  aligned across apps.

## Traceability Matrix

| Requirement     | Design                        | Verification                                  | Task                     |
| --------------- | ----------------------------- | --------------------------------------------- | ------------------------ |
| `FR-REL080-001` | `DES-REL080-001`              | `TEST-REL080-001`                             | `T-REL080-001`           |
| `FR-REL080-002` | `DES-REL080-002`              | `TEST-REL080-002`                             | `T-REL080-002`           |
| `FR-REL080-003` | `DES-REL080-002`              | `TEST-REL080-003`                             | `T-REL080-002`           |
| `FR-REL080-004` | `DES-REL080-003`, `DES-REL080-004` | `TEST-REL080-004`                        | `T-REL080-003`, `T-REL080-004` |
| `NFR-REL080-001` | `DES-REL080-003`             | `TEST-REL080-005`                             | `T-REL080-005`           |
