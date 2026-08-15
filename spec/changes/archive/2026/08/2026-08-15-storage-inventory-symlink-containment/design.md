# Design

## Context

`packages/core/src/storage-inventory.ts` walks the durable storage root and
produces a file manifest for snapshots, restores, capacity checks, and
rollback digests. Commit `78b4c4bf` added `symlinkPolicy: "refuse" |
"record"` plus `StorageInventory.symlinks`, but only the upgrade-backup
creation path opted in. Every other consumer still refuses, including both
refusals inside the startup authority publication flow, and restore-side
refusal contradicts backup-side recreation.

## Approach

Single classification primitive, per-context copy policy, no manifest schema
changes.

### 1. Core: classification tightening (storage-inventory.ts)

- Extract the per-link classification (readlink + realpath containment vs.
  realpath-resolved root) into a helper shared by inventory and copy.
- `dangling` is only for `realpath` failures with `code === "ENOENT"`;
  `ELOOP`/`EACCES`/other codes throw a descriptive error (fail closed).

### 2. Core: copy policies (storage-inventory.ts)

`copyStorageInventory(inventory, destinationRoot, options?)` gains:

```ts
interface CopyStorageInventoryOptions {
  symlinks?: "preserve" | "preserve-strict";
}
```

For each recorded link, re-classify at copy time (source may have changed
since inventory):

- `internal`: recreate in the destination with a target computed as
  `path.relative(dirname(destLink), destResolvedTarget)` where
  `destResolvedTarget` mirrors the source-resolved target under the
  destination root. This normalizes absolute internal targets to relative.
- `dangling` with relative target: recreate the raw target.
- `dangling` with absolute target: skip (`preserve`) / throw
  (`preserve-strict`).
- `escaping`: skip (`preserve`) / throw (`preserve-strict`).

Copy-time type changes (link became a regular file or disappeared) throw,
matching the existing source-mutation guards. `verifyStorageInventory` stays
regular-file-only; destination links are shape-preserving extras, which the
change spec documents.

### 3. Desktop: startup path

- `canonical-storage-checkpoint.ts assertCheckpointCapacity`:
  `symlinkPolicy: "record"` (capacity uses totals; links contribute nothing).
- `canonical-storage-projector.ts collectPackageFiles`: containment walk —
  for each symlink inside a skill package, realpath against the package root
  boundary (not the whole storage root; package boundary matches
  `spec/knowledge/behavior/plugins.md` semantics):
  - resolves inside the package to a regular file: include as a shadow entry
    keyed by the link path, carrying the target's content at read time
    (materialization);
  - resolves to a directory or outside the package, or fails to resolve:
    throw naming the package path.

### 4. Desktop: backup/restore symmetry

- `upgrade-backup.ts`: drop the local `restoreInventorySymlinks`; pass
  `symlinks: "preserve"` to the shared `copyStorageInventory`.
- `upgrade-backup-restore.ts prepareUpgradeRestoreCandidate`: inventory the
  backup with `symlinkPolicy: "record"` and copy with
  `symlinks: "preserve-strict"`. Escaping links keep failing the restore
  (existing tamper boundary and its test stay green). Internal links become
  relative-normalized in the staged candidate.
- Legacy-epoch restores still pass through `migrateLegacyDataLayout`'s
  fail-closed symlink assertions; documented boundary, unchanged.

### 5. Remaining consumers

- `portable-snapshot-restore.ts`: `prepareCandidate` inventory with record +
  copy with `preserve`; both capacity checks (`restorePortableSnapshotArchive`,
  `restorePortableLogicalSnapshot`) inventory with record (totals only).
- `packages/core/src/storage-root-operation.ts`: source inventory with
  record; stage copy with `preserve`; `targetMatchesSourceDigest` inventory
  with record so a root containing recreated links still compares digests
  instead of throwing into the rollback fallback.
- `journaled-database-recovery.ts copyDetachedRoot`: record + `preserve` for
  the live-root call site; the incoming detached-root call site keeps
  `preserve-strict` semantics by parameterizing the helper (untrusted
  source). `normalizeCandidate` legacy assertions unchanged.

## Trade-offs

- Links are excluded from `inventoryDigest` (0.7.1 parity). Integrity
  verification remains blind to link presence; the strict restore policy is
  the compensating control for untrusted roots.
- Projector materialization makes the canonical shadow a regular file where
  the live tree has a link. The shadow is derived data; rebuilds are
  deterministic either way.
- v0.8.0 backups containing absolute-target internal links (recreated
  verbatim by `78b4c4bf`) restore as `escaping` under the strict policy and
  fail with a clear error. Recreating them would point at the live tree.
  Users re-snapshot on the fixed build. Recorded as a known limitation.

## Data / Contract Impact

- No SQLite schema or IPC contract changes. `CopyStorageInventoryOptions` is
  a new core-exported type (additive). `StorageInventory.symlinks` already
  shipped in v0.8.0.
- No filesystem layout changes; live `data/skills` links are never rewritten.

## Verification Matrix

| Layer | Method |
| --- | --- |
| Core unit (classification) | black-box + adversarial: internal relative/absolute, escaping relative/absolute, dangling relative/absolute, ELOOP cycle, macOS realpath alias root |
| Core unit (copy policies) | white-box branches: preserve vs strict, normalization, copy-time mutation |
| Desktop unit (checkpoint/projector) | containment behavior, escaping/dangling failures |
| Desktop unit (backup/restore) | round-trip with internal links, tampered-escaping rejection, absolute-internal normalization |
| Desktop unit (startup authority) | end-to-end `ensureCanonicalStorageAuthorityOnStartup` on a root with a linked skill package (the reported crash) |
| Regression | pre-fix code must fail the startup and restore tests; post-fix green |
