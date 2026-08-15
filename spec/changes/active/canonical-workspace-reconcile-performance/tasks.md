# Tasks: Canonical Workspace Reconcile Performance

## 1. Tests (write first, expect failure)

- [x] packages/core: `canonical-skill-workspace-hydration.test.ts`
  - [x] unchanged bundle → second hydration does not rewrite workspace
        (sentinel file survives)
- [x] packages/core: republished bundle → hydration rewrites workspace and
      updates the marker
- [x] packages/core: missing `.canonical-bundle-hash` → hydration
      re-materializes
- [x] packages/core: core `initDatabase()` reconcile runs once per data root
- [x] apps/desktop unit: `readCustomAgentsFromSettings()` serves TTL cache and
      `invalidateCustomPathsCache()` forces a fresh read
- [x] apps/desktop unit: desktop `initDatabase()` wrapper reconcile runs once
      per data root

All four target tests failed against the pre-fix implementation (sentinel
wiped; memo helper missing; cache test observed 2 DB reads where 1 expected).

## 2. Implementation

- [x] `hydrateCanonicalSkillWorkspace`: marker equality short-circuit
- [x] core `initDatabase()`: per-data-root reconcile memo
  (`canonical-workspace-reconcile-memo.ts`)
- [x] desktop `initDatabase()` wrapper: per-data-root reconcile memo
- [x] `readCustomAgentsFromSettings()`: TTL cache + invalidation wiring

## 3. Verification

- [x] Run packages/core affected tests
- [x] Run apps/desktop affected unit tests
- [x] Full suites: packages/core 52 files / 514 tests passed; desktop unit
      602 files / 5397 tests passed
- [x] Real-userData relaunch: launch→renderer-ready >80 s → 3.3 s;
      launch→firstWindow 20.1 s → 2.7 s; startup canonical→proxy gap
      5.5 s → 1.8 s; Skills page interactive immediately after click
      (evaluate latency p95 40 ms over 45 s window)
- [x] ESLint clean on touched desktop files (packages/core has no standalone
      lint config; type correctness covered by vitest transform + suites)

## 4. Convergence

- [x] Update `implementation.md` with actual verification results
- [x] Sync stable docs (`spec/knowledge/behavior/data-recovery.md` hydration
      semantics) if statements there describe unconditional re-materialization
- [x] Update `spec/changes/index.md` with the new active change
