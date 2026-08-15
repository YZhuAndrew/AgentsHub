# Implementation

## Status

- Phase: converge
- Date: 2026-08-15
- All tasks in `tasks.md` complete; verification green (see below).

## What Shipped

### Core (`packages/core`)

- `storage-inventory.ts`
  - Record-mode classification tightened: only realpath `ENOENT` classifies a
    link as `dangling`; `ELOOP`/`EACCES`-style failures throw with the path
    and errno. Classification compares against the realpath-resolved root.
  - `copyStorageInventory` gained `CopyStorageInventorySymlinkOptions` with
    `symlinks: "preserve" | "preserve-strict"`. Both recreate internal links
    with a relative, destination-normalized target (absolute internal targets
    are rewritten) and recreate dangling links with relative targets;
    `preserve` skips escaping links and absolute-dangling targets, while
    `preserve-strict` throws on them. Copy-time type changes and source
    mutations throw.
- `journaled-storage-restore.ts`
  - `validateCandidateTree` no longer refuses every candidate link. Each link
    is checked for containment against the realpath-resolved stage: the
    lexical target (resolved in realpath space, so macOS `/var` aliases
    cannot misfire) and the fully resolved path must stay inside; only
    `ENOENT` (relative dangling) is tolerated. Links count against the entry
    limit. Escaping/cyclic/absolute links still fail the candidate.
- `storage-root-operation.ts`
  - Migration source inventory uses `symlinkPolicy: "record"`; the staged copy
    uses `preserve`; `targetMatchesSourceDigest` uses `record` so roots
    containing recreated links still compare digests instead of falling into
    the rollback branch.

### Desktop (`apps/desktop/src/main/services`)

- `canonical-storage-checkpoint.ts` — capacity inventory uses `record`.
- `canonical-storage-projector.ts` — `collectPackageFiles` rewritten as a
  containment walk: file symlinks resolving inside the package materialize
  (the shadow carries the target content under the link path); directory
  symlinks inside the package expand with prefix mapping and a cycle guard;
  escaping, dangling, and special-file links fail closed naming the package
  path. The duplicated scan-limit condition was consolidated into
  `recordPackageFile`. Package root is realpath-normalized for containment.
- `upgrade-backup.ts` — local `restoreInventorySymlinks` removed; snapshot
  staging uses the shared `preserve` policy, so absolute internal targets are
  now stored as relative links in new backups.
- `upgrade-backup-restore.ts` — restore candidate uses `record` +
  `preserve-strict`: contained links round-trip; escaping links still fail
  the restore and roll back (existing tamper boundary and its test kept).
- `portable-snapshot-restore.ts` — candidate preparation uses `record` +
  `preserve`; both capacity inventories use `record`.
- `journaled-database-recovery.ts` — `copyDetachedRoot` gained a link policy:
  the live-root base copy uses `preserve`; the incoming untrusted source
  keeps the original refuse-all behavior.

## Deviations From Design

- The `targetSuffix === null` defensive branch designed for copy-time
  reclassification was removed instead of tested: `classifyStorageSymlink`
  now returns the resolved path, making the double check dead code. Copy-time
  reclassification still happens (the classifier is re-run per link at copy
  time) and is tested.
- Trust hierarchy refined during implementation: managed backup roots use
  `preserve-strict` (round-trip required), while raw incoming recovery
  sources keep refusing all links (pre-existing test boundary preserved).
- Backup manifests do not record link lists (non-goal, unchanged): links are
  physically present in backups; restore re-classifies against the backup
  root.

## Known Limitations

- v0.8.0-created backups that recreated absolute-target internal links
  verbatim classify as escaping at restore time and fail with a clear error;
  recreating them would point at the live tree. Affected users re-snapshot on
  the fixed build.
- Link targets are excluded from `inventoryDigest` (0.7.1 parity); restore
  strictness is the compensating control.
- Legacy-layout restores still pass through `data-layout-migration`'s
  fail-closed symlink assertions (documented boundary).
- Desktop service files retain pre-existing uncovered legacy branches outside
  the changed hunks (whole-file coverage 69–95%); every changed line and
  condition is covered (verified by intersecting coverage data with diff
  hunks — NONE uncovered). Core changed files reach 100% statements/branches/
  functions/lines.

## Verification

- Test-first: all new tests were confirmed red against the pre-change code
  (4 core, 6 desktop), then green after implementation.
- `packages/core`: 50 files / 509 tests green; `tsc --noEmit` clean.
- Desktop targeted suites (projector, authority, startup, checkpoint,
  upgrade-backup, restore, portable restore, journaled recovery): green.
- Desktop full unit suite: green (607 files; final-state rerun recorded in
  the session log).
- ESLint on all changed files: clean. Desktop + core typecheck: clean.
- Coverage: core `storage-inventory.ts`, `journaled-storage-restore.ts` at
  100% lines/branches/functions/statements; desktop changed hunks at 100%
  via JSON-coverage × diff-hunk intersection.
- Adversarial cases: symlink cycles (ELOOP), chained escapes (lexical-in-root
  but resolved-out), dangling relative/absolute, escaping relative/absolute,
  macOS realpath alias roots, copy-time mutation/removal/reclassification,
  special-file link targets, sparse 11 GiB byte-limit trigger, 20k-link
  count-limit trigger, tampered-backup escape rejection with rollback.

## Stable Docs Synced

- `spec/knowledge/behavior/data-recovery.md` — containment and copy-policy
  boundary added.
- `spec/changes/index.md` — active change registered.

## Follow-ups

- Ship as 0.8.1 hotfix; the published v0.8.0 remains startup-locked for
  symlink-carrying upgraders until then.
- Optional: record link lists in backup manifests if restore-side auditing
  ever needs them.
