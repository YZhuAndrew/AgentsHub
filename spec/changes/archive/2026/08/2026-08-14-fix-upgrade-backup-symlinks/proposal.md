# Fix: upgrade backup aborts on symlinks (symlink-installed skills)

## Phase And Status

- Phase: implement
- Status: ready-for-release (0.7.1)
- Primary requirement: `FR-UPGSYM-001`

## Why

`createUpgradeDataSnapshot` used an `fs.cp` filter (`shouldCopySnapshotPath`)
that THREW on any symbolic link. Symlink-mode Skill installs (e.g.
`data/skills/<skill>/CLAUDE.md` → managed repo) are legitimate, so the very
first symlink in userData aborted the whole pre-upgrade backup, which blocks the
upgrade entirely. Reported at runtime:
`Error invoking remote method 'upgradeBackup:create': ... Cannot copy upgrade
backup path from symbolic link: .../skills/tw93-Waza/CLAUDE.md`.

## Scope

- In scope: change the snapshot copy filter to preserve symlinks that resolve
  within the source root (faithful + restorable copies of internal links) and
  SKIP symlinks that escape the root (keeps the snapshot restorable, since the
  restore path rejects links resolving outside userData). Dangling links are
  preserved as-is.
- Out of scope: the RESTORE path's existing external-symlink rejection
  (intentional security guard, unchanged); database schema; backup layout.

## Risks

- A backup now may contain internal symlinks; restore recreates them faithfully.
  Escaping symlinks are skipped so the snapshot remains restorable.
- `realpath` normalization is applied to both the root and link target so the
  within-root check is correct on platforms where system dirs are themselves
  symlinks (macOS `/var` → `/private/var`).

## Rollback Thinking

Reverting `createSnapshotCopyFilter` to the old throw-on-symlink filter restores
prior behavior. No persisted-state or schema change.

## Related Records

- Stable: `spec/knowledge/behavior/skills.md` (symlink install mode)
- Governing: `spec/rules/testing-standards.md`, `spec/rules/tdd-design-gate.md`
