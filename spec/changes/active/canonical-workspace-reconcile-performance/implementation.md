# Implementation: Canonical Workspace Reconcile Performance

## What Shipped

1. **Hydration change detection** — `packages/core/src/canonical-skill-library.ts`
   adds `readWorkspaceBundleHash()` and a short-circuit in
   `hydrateCanonicalSkillWorkspace()`: when the existing workspace's
   `.canonical-bundle-hash` equals the bundle manifest `contentHash`, the
   workspace is returned as-is; staging, `rmSync`, and rename are skipped. Any
   read failure, missing marker, or mismatch falls through to the original
   atomic re-materialization path.

2. **Per-process reconcile memo** — new
   `packages/core/src/canonical-workspace-reconcile-memo.ts` (set of reconciled
   data roots, plus `resetCanonicalWorkspaceReconcileMemo()` for tests and
   fresh-process simulation). Wired into both `initDatabase()` wrappers:
   `packages/core/src/database.ts` and
   `apps/desktop/src/main/database/index.ts`. The non-canonical
   `reconcileDesktopSkillRepoPaths` branch is unchanged (already idempotent,
   DB-only). The desktop wrapper re-exports the reset alongside the existing
   `@prompthub/db` re-exports, and `packages/core/src/index.ts` re-exports the
   memo module.

3. **Custom agents TTL cache** —
   `apps/desktop/src/main/services/skill-installer-utils.ts`:
   `readCustomAgentsFromSettings()` now mirrors
   `readBuiltinAgentOverridesFromSettings()` (5 s TTL, module state, every
   terminal path populates the cache) and `invalidateCustomPathsCache()` clears
   it together with the existing caches. `settings.ipc.ts` already calls the
   invalidator on every successful `SETTINGS_SET`.

## What Changed During Execution

- The batch install-status handler (`skill:getMdInstallStatusBatch`) was left
  untouched: with the memo in place its per-skill `getSupportedPlatforms()`
  calls no longer trigger reconcile passes, and the settings read is cached,
  so a handler-level hoist became unnecessary (smaller diff, no service
  signature change).
- The rule-side hydration was left untouched per design (KB-scale writes).

## Verification

- New failing-first tests, all green after implementation:
  - `packages/core/tests/canonical-skill-workspace-hydration.test.ts` (4 tests)
  - `packages/core/tests/canonical-reconcile-memo.test.ts` (1 test)
  - `apps/desktop/tests/unit/main/canonical-reconcile-memo.test.ts` (1 test)
  - `apps/desktop/tests/unit/main/skill-installer-utils.test.ts` (new cache
    test inside `getCustomAgentPlatforms` describe)
- Full suites: packages/core 52 files / 514 tests passed; desktop unit
  602 files / 5397 tests passed (2026-08-15).
- ESLint clean on the touched desktop files.
- Real-userData relaunch (built app, reporting user's data: 228 skills,
  483 MB bundles, 456 MB workspaces):

  | Metric | Before fix | After fix |
  | --- | --- | --- |
  | launch → first window | 20.1 s | 2.7 s |
  | launch → renderer interactive | never (<80 s timeout) | 3.3 s |
  | startup `already-canonical` → `network_proxy_applied` | 3.5–6 s | 1.8 s |
  | Skills page after click | main process ~98% CPU, renderer frozen | interactive, evaluate latency p95 40 ms over 45 s |

  Before/after startup evidence: `logs/startup.log` pid 93482 (2026-08-15
  01:43) vs pid 99569 (2026-08-15 05:52). The remaining 1.8 s is the single
  per-process reconcile pass (manifest reads) plus database open, as designed.

## Stable Docs Synced

- `spec/knowledge/behavior/data-recovery.md`: hydration now changes
  re-materialization semantics (marker-based skip); updated the canonical
  workspace paragraph accordingly.

## Follow-ups

- The remaining once-per-launch reconcile pass costs ~1.5 s on a 228-skill
  library because `readSkillResourceBundle` parses each manifest fully. A
  manifest-header-only fast path (read `contentHash` before full validation)
  could shave this further; not required for the reported defects.
- `spec/issues/` entry not filed; the user-reported defect is tracked by this
  change. GitHub issue can be filed at 0.8.1 release preparation together with
  `storage-inventory-symlink-containment`.
