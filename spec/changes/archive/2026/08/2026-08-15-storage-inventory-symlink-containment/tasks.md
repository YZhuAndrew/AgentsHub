# Tasks

## T-1 Core record-policy classification

- [x] T-1.1 Failing tests: record classification for internal relative,
      internal absolute, escaping relative, escaping absolute, dangling
      relative, dangling absolute; ELOOP cycle throws; `refuse` default still
      throws. (`FR-SYMLINK-001` / `DES-1` / `TEST-SYMLINK-001`)
- [x] T-1.2 Implement classification tightening (ENOENT-only dangling) and
      shared classifier helper.

## T-2 Core copy policies

- [x] T-2.1 Failing tests: `preserve` recreates internal (relative-normalized)
      and relative-dangling links, skips escaping and absolute-dangling;
      `preserve-strict` throws on escaping and absolute-dangling; copy-time
      source mutation throws. (`FR-SYMLINK-002` / `DES-2` / `TEST-SYMLINK-002`)
- [x] T-2.2 Implement `CopyStorageInventoryOptions.symlinks` in
      `copyStorageInventory`.

## T-3 Startup path

- [x] T-3.1 Failing tests: checkpoint capacity inventory tolerates links;
      projector materializes contained file links, throws on directory /
      escaping / dangling links. (`FR-SYMLINK-003` / `DES-3` /
      `TEST-SYMLINK-003`)
- [x] T-3.2 Failing test: `ensureCanonicalStorageAuthorityOnStartup`
      publishes on a root with an alias-linked Skill package (reported crash
      reproduction). (`FR-SYMLINK-003` / `DES-3` / `TEST-SYMLINK-004`)
- [x] T-3.3 Implement checkpoint `symlinkPolicy: "record"` and projector
      containment walk.

## T-4 Backup/restore symmetry

- [x] T-4.1 Failing tests: snapshot with absolute-target internal link stores
      a relative-target link; restore round-trips internal links; tampered
      escaping link still fails and rolls back. (`FR-SYMLINK-004` / `DES-4` /
      `TEST-SYMLINK-005`)
- [x] T-4.2 Migrate `upgrade-backup.ts` to shared copy policy; restore uses
      record + `preserve-strict`.

## T-5 Remaining consumers

- [x] T-5.1 Failing tests: portable candidate preserves links; capacity
      checks tolerate links; storage-root migration round-trips links;
      journaled recovery copies preserve links (live) and reject escaping
      (incoming). (`FR-SYMLINK-005` / `DES-5` / `TEST-SYMLINK-006`)
- [x] T-5.2 Implement record/preserve in portable-snapshot-restore,
      storage-root-operation, journaled-database-recovery.

## T-6 Verification and converge

- [x] T-6.1 Full core + desktop suites, lint, typecheck; changed-file
      coverage review with branch/condition notes.
- [x] T-6.2 Update `implementation.md`, sync stable knowledge
      (`spec/knowledge/behavior/data-recovery.md` containment boundary),
      refresh `spec/changes/index.md`.
