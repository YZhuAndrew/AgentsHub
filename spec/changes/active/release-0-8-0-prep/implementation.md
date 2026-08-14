# AgentsHub 0.8.0 Release Preparation Implementation

## Executed

- Created the active change with proposal, release delta spec, design (with
  traceability matrix), tasks, and this implementation record.
- Confirmed the exact version-bearing surface from the `v0.7.2` release
  commit (`09fcef08`): 8 manifests, `CLI_VERSION`, the CLI `--version` test,
  changelog, release record/index, localized READMEs, and generated website
  files.
- Enumerated `git log v0.7.2..HEAD` (49 non-merge commits, 4 merges) and
  grouped the user-visible changes for the changelog entry.
- Aligned all manifests to `0.8.0`: root, desktop, cli, web, web-cloudflare,
  mobile package, Expo `app.json`, `CLI_VERSION`, and the CLI `--version`
  assertion. Aligned `AGENTS.md` project version.
- Fixed the stale version guard in `scripts/version-alignment.test.mjs`
  (`expectedVersion` was still `0.6.0-beta.1` from the upstream preview line,
  so `governance-ci-config` was already failing before this release prep).
- Added the bilingual `[0.8.0] - 2026-08-14` changelog entry with the verbatim
  macOS 安全说明 notice (byte-identical to the `release.yml` notice apart
  from markdown blockquote markers).
- Added `spec/releases/0.8.0.md` (Status: Preparation) and indexed it as
  `preparation` in `spec/releases/README.md` so website sync keeps selecting
  the published `0.7.2` stable until promotion.
- Ran `pnpm --dir website sync:release`: `website/src/generated/release.ts`
  still reports `v0.7.2` (published-stable isolation) and only
  `website/src/content/docs/changelog.md` changed (0.8.0 section mirrored).
- Added the condensed `v0.8.0` history entry to `README.md` and the six
  localized `docs/README.*.md` files. Version badges intentionally still say
  `v0.7.2`; they flip together with the release-record status at publication.
- Regenerated `spec/changes/index.md`; `pnpm spec:test` passed (traceability
  validated for 25 changes).

## Surfaces Intentionally Not Changed

- Desktop locale files: this release prep adds no new user-facing desktop
  copy; every feature commit in the range already shipped its locale keys
  across all 7 locales (e.g. `macUnsignedUpdateHint` in `06a4c0de`).
- GUI screenshots: `docs/imgs/` and `website/public/imgs/` are dated
  2026-08-09/10 (0.6.x era) and predate this batch's window-state, Markdown
  preview, and agent-workbench changes. Refreshing them is tracked by the
  deferred `readme-screenshots-v0-5-6` change and requires manual GUI
  capture; the 0.7.x stable line shipped with the same assets. Recorded as a
  skipped surface with residual staleness risk.
- Non-generated website copy (`website/src/i18n/ui.ts`, index pages): the
  release contract (channels, download shapes) is unchanged.
- `apps/desktop/tests/e2e/self-hosted-sync.spec.ts` `clientVersion` fixture:
  synthetic payload, not a version-bearing manifest (v0.7.2 bump also left it).

## Verification

- `pnpm spec:index` / `spec:index:check` / `spec:test`: passed (25 changes).
- `node --test scripts/detect-ci-surfaces.test.mjs
  scripts/version-alignment.test.mjs`: passed after the guard fix.
- `pnpm verify:release:quick` (run 1): failed on `governance-ci-config`
  (stale `0.6.0-beta.1` guard, fixed above), `governance-file-size`
  (pre-existing: `apps/desktop/src/main/index.ts` 2031 lines vs 1974 legacy
  baseline, explicitly deferred by commit `b8d23f94`), and all 8
  `desktop-unit` shards.
- `pnpm verify:release:quick` (run 2, after the guard fix): 27/30 checks
  passed. Remaining failures: `governance-file-size` and the `desktop-unit`
  shards (82 failed tests across ~19 files, largest clusters:
  `agent-pi-model-catalog-panel` 11, `skill-i18n-manager` 9,
  `agent-provider-profile-workbench` 8,
  `agent-provider-profile-form-dialog-opencode` 6, `upgrade-backup` 4).

### Desktop unit failure classification (all pre-existing on main)

Verified pre-existing by stashing the release edits and reproducing failures
on pristine HEAD (`b8d23f94`): `upgrade-backup.test.ts` fails identically
(4/29), and the three largest component clusters fail 45/80 together. None
of the release-prep edits (version strings, docs, generated website files)
touch production code paths. Three distinct causes:

1. **AgentsHub rebrand test drift** (e.g. tests expect "Import from
   PromptHub" while the component renders "Import from AgentsHub"): owned by
   `spec/changes/active/brand-agentshub-prompthub-replacement/`, whose
   tasks were left unchecked while the proposal says done.
2. **Storage inventory symlink refusal** (`Refusing symbolic link in storage
   inventory` in `upgrade-backup` symlink tests): interacts with the
   canonical storage hardening commits and/or sandbox filesystem semantics;
   owned by `legacy-upgrade-recovery-audit` and the archived
   storage-recovery work.
3. **`skill-i18n-manager` runtime TypeError** (`Cannot convert undefined or
   null to object`): independent component/store defect on main.

The GitHub release workflow (`release.yml`) builds without running the unit
suite, and the published 0.7.0/0.7.1/0.7.2 records carry focused
verification rather than a full green harness, so these pre-existing
failures do not block the tag build itself; they are recorded as residual
release risk for the maintainer's go/no-go decision.

- Full `pnpm verify:release` (2026-08-14): 31/42 checks passed. All
  production builds passed (desktop build + bundle budget, CLI build, web
  build + smoke, worker build, mobile), as did all lint/typecheck and
  non-desktop test suites. The 11 failures are the pre-existing
  `governance-file-size` gate, the 8 `desktop-unit` shards classified above,
  `desktop-integration-1/2` (same `TypeError: Cannot convert undefined or
  null to object` signature as the skill-i18n unit cluster), and
  `desktop-e2e-smoke` (5/7 pass; the two failures are a WebDAV
  hidden-launch timing assertion and a live self-hosted sync round-trip
  that needs real network — consistent with the sandbox limitations
  recorded in earlier release runs). No failure is attributable to the
  release-prep diff; production artifacts build cleanly.

## Notes

- The historical `0.6.0-beta.1` prerelease tag (`2ed96c7f`) sits inside the
  `v0.7.2..HEAD` range; its content is folded into the `0.8.0` stable entry
  because the stable line jumps from `0.7.2` to `0.8.0`.
