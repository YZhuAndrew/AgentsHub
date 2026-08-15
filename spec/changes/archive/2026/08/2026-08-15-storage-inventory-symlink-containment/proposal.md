# Storage Inventory Symlink Containment Proposal

## Phase And Status

- Phase: archived
- Status: shipped in v0.8.1 (2026-08-15, release record: spec/releases/0.8.1.md)
- Primary requirements: `FR-SYMLINK-001` through `FR-SYMLINK-006`
- Related issues: none filed yet (user-reported startup lockout, 2026-08-14)
- Related shipped work: `release-0-8-0-prep` commit `78b4c4bf` (upgrade-backup
  record policy only)
- Exit condition: every inventory consumer tolerates contained symlinks with
  explicit per-context policy; startup lockout and backup/restore asymmetry
  have regression tests reproducing the original failures.

## Why

v0.8.0 (published 2026-08-14) bricks first-launch startup for any user whose
imported Skill packages contain intra-package relative symlinks (the common
`AGENTS.md -> CLAUDE.md` alias pattern). The canonical storage authority
publication path refuses symlinks twice: once in the checkpoint capacity
inventory (`canonical-storage-checkpoint.ts`, default `symlinkPolicy:
"refuse"`) and once in the skill package projection
(`canonical-storage-projector.ts collectPackageFiles`). Because publication is
one-shot and never completes, affected upgraders are locked out on every
launch.

Commit `78b4c4bf` restored the 0.7.1 snapshot contract for upgrade-backup
creation only (`symlinkPolicy: "record"` plus link recreation). It left the
startup path refusing, and introduced a new asymmetry: backups now contain
recreated symlinks while `upgrade-backup-restore` still refuses every symlink,
so the backups created for symlink-carrying users cannot be restored.

## Scope

- Complete the `record` policy rollout across every `createStorageInventory`
  consumer with an explicit per-context copy policy.
- Canonical projector: materialize contained skill-package symlinks as regular
  content in the canonical shadow; refuse escaping/dangling links there
  (fail-closed authority data).
- Backup side: normalize internal absolute link targets to relative targets so
  restored links resolve inside the restored root.
- Restore side: recreate contained links (strict policy — escaping links
  still fail closed, preserving the existing tamper boundary).
- Tighten record classification: only `ENOENT` from `realpath` classifies as
  dangling; `ELOOP`/`EACCES`-style failures throw.
- Core-level direct tests for classification and copy policies; desktop tests
  for checkpoint, projector, backup round-trip, restore, and the startup
  authority path with symlinked packages.

## Non-Goals

- Materializing links inside the live `data/skills` tree (live layout stays
  untouched; only copies/projections materialize or recreate).
- Changing `upgrade-backup` manifest schema to record link lists (links are
  physically preserved in backups; the backup itself is the record).
- Relaxing legacy-layout migration symlink refusals (`data-layout-migration`
  assertions stay fail-closed for legacy-epoch restores).
- Making the `refuse` default opt-out behavior stricter or looser.

## Risks And Rollback

- Risk: restore-side strict policy rejects v0.8.0 backups that contain
  absolute-target internal links (recreated verbatim by `78b4c4bf`). Those
  links resolve to the original live userData, i.e. outside the backup root,
  so restoring them would smuggle live-tree content; refusing with a clear
  error is the documented boundary. Users can re-snapshot on the fixed build.
- Risk: projector materialization changes canonical shadow content shape
  (regular file instead of link). The shadow is a derived projection, not the
  source of truth; DB metadata and the live tree are unchanged.
- Rollback: every change is behavior-scoped to symlink handling; reverting the
  commit restores the pre-change refusal semantics without data migration.

## Impacted User Flows

- Startup after 0.7.x → 0.8.x upgrade with symlinked Skill packages (crash →
  publishes successfully).
- Upgrade snapshot creation, restore, portable snapshot restore, storage-root
  migration, journaled database recovery on roots containing Skill symlinks.
- Canonical authority publication and rebuild verification.
