# Design: Canonical Workspace Reconcile Performance

## Diagnosis (verified 2026-08-15)

- `hydrateCanonicalSkillWorkspace` (packages/core/src/canonical-skill-library.ts)
  always performs stage-copy → `rmSync(workspace)` → rename. The
  `.canonical-bundle-hash` marker is written (line 170) and skipped during
  package collection (line 59) but never compared.
- Desktop `initDatabase()` (apps/desktop/src/main/database/index.ts) and core
  `initDatabase()` (packages/core/src/database.ts) call
  `reconcileCanonicalWorkspaces()` on every invocation; only the SQLite
  connection is memoized.
- `readCustomAgentsFromSettings()` (skill-installer-utils.ts) calls
  `initDatabase()` uncached. `getSupportedPlatforms()` invokes it, and
  `getSkillMdInstallStatusForSkill` invokes `getSupportedPlatforms()` twice per
  skill, so `skill:getMdInstallStatusBatch` over N skills queues ~2N reconcile
  passes.
- Measured on the reporting machine: 228 skills, 483 MB bundles, 456 MB
  hydrated workspaces; one reconcile ≈ 5.5 s; CDP stacks during the freeze sit
  in `reconcileCanonicalWorkspaces` → `rimrafSync`.

## Approach

Three scoped fixes, ordered by root-cause depth:

1. **Hydration change detection** (`canonical-skill-library.ts`):
   before staging, read
   `<workspace>/.canonical-bundle-hash`; if it equals
   `resource.bundleManifest.contentHash`, return `workspacePath` immediately.
   Any read failure, missing marker, or mismatch falls through to the existing
   atomic stage/rename path. `contentHash` covers the manifest payload list
   including per-file SHA-256 values, so equality implies identical package
   file sets and contents.

2. **Reconcile memo per process and data root**:
   - desktop wrapper `apps/desktop/src/main/database/index.ts`
   - core wrapper `packages/core/src/database.ts`
   A module-level `Set<string>` keyed by the resolved data directory records
   completed reconciles. Per-mutation `publish()` inside `CanonicalSkillDB`
   still hydrates affected skills, so runtime edits stay consistent.

   Restore-flow safety: successful `UPGRADE_BACKUP_RESTORE` ends in
   `app.relaunch()` (fresh process → memo resets); the failed-restore branch
   reopens unchanged data. `portable-snapshot-restore` performs its own
   rehydration and relaunches. No consumer requires a mid-process re-reconcile
   after data replacement.

3. **Custom agents TTL cache** (`skill-installer-utils.ts`):
   mirror `readBuiltinAgentOverridesFromSettings()` (5 s TTL, module state,
   cleared by `invalidateCustomPathsCache()` which `settings.ipc.ts` already
   calls on every successful `SETTINGS_SET`).

With (1)+(2), a no-change reconcile costs one manifest read per skill on first
init only; with (3), the batch install-status path stops touching
`initDatabase()` entirely inside the TTL window.

## Alternatives Considered

- Hoisting `getSupportedPlatforms()` out of the batch loop only: leaves every
  other `initDatabase()` caller (tray, rules workspace, skill installer token
  reads) triggering reconcile storms; rejected as incomplete.
- Time-based debounce of reconcile: nondeterministic healing; rejected.
- Workspace drift detection (hashing workspace files on init): reintroduces a
  full-tree read per init; the marker comparison achieves the same guarantee
  from the manifest for the price of one small-file read.

## Data Model / Migration Impact

None. No schema, bundle format, or on-disk layout changes; existing hash
markers become meaningful on the next hydration.

## Testing Strategy

- packages/core unit tests (new `canonical-skill-workspace-hydration.test.ts`):
  sentinel-file survival proves skip; republish proves rehydrate; marker
  deletion proves fallback. Also initDatabase-wrapper memo coverage through the
  core wrapper test.
- Desktop unit test for `readCustomAgentsFromSettings` caching + invalidation
  via `invalidateCustomPathsCache()` (DB-backed, real SQLite).
- Real-userData verification relaunch (dev parity) measuring startup gap and
  Skills-page responsiveness.
