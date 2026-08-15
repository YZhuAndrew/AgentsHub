# Canonical Workspace Reconcile Performance Proposal

## Phase And Status

- Phase: implement
- Status: in-progress
- Primary requirements: `FR-RECON-001` through `FR-RECON-003`
- Related issues: none filed yet (user-reported slow startup and Skills-page
  freeze on 2026-08-15, dev build 0.8.0 + symlink containment working tree)
- Related shipped work: v0.8.0 canonical storage authority
  (`localAuthority === "canonical-files"` execution path)
- Exit condition: opening the Skills page and launching the app no longer
  re-materialize unchanged canonical Skill workspaces; regression tests prove
  the skip, the change-detection rehydrate, and the per-process reconcile memo.

## Why

v0.8.0 makes the desktop `initDatabase()` wrapper run
`CanonicalSkillDB.reconcileCanonicalWorkspaces()` on every call. That method
calls `hydrateCanonicalSkillWorkspace(skillId)` per Skill, which unconditionally
re-copies the whole package from the canonical bundle into a stage directory,
deletes the previous workspace, and renames the stage into place. The
`.canonical-bundle-hash` marker written during hydration is never read back, so
there is no change detection.

The wrapper is invoked from hot paths, most severely
`readCustomAgentsFromSettings()` (uncached), which every
`getSupportedPlatforms()` call executes. The Skills page batch install-status
handler calls `getSupportedPlatforms()` twice per Skill, so a library of 228
Skills (456 MB of hydrated workspaces under `cache/skill-workspaces`) queues
roughly 456 full reconcile passes on the main process. Measured on the
reporting user's machine:

- one full reconcile pass: ~5.5 s (observed as the `already-canonical` →
  `network_proxy_applied` gap in `logs/startup.log`);
- opening the Skills page pegs the main process at ~98% CPU for minutes
  (verified with CDP stacks landing inside `reconcileCanonicalWorkspaces` →
  `rmSync`/`copyFileSync`), freezing the renderer.

0.7.x did not exhibit this because the non-canonical branch
(`reconcileDesktopSkillRepoPaths`) only updates DB path columns.

## Scope

- `hydrateCanonicalSkillWorkspace`: skip re-materialization when the existing
  workspace's `.canonical-bundle-hash` equals the bundle manifest
  `contentHash`.
- Desktop `initDatabase()` wrapper and core `initDatabase()`: reconcile
  canonical workspaces at most once per process per data root.
- `readCustomAgentsFromSettings()`: 5 s TTL cache mirroring
  `readBuiltinAgentOverridesFromSettings()`, invalidated by the existing
  `invalidateCustomPathsCache()` hook (settings updates).

## Non-Goals

- Changing the canonical bundle format, publication flow, or workspace layout.
- Adding drift detection between workspace files and the bundle (the bundle
  stays the authority; workspace edits flow back through the existing
  `skill:update` publication path).
- Touching the rule-side hydration (`CanonicalRuleDB` rewrites a few KB per
  rule; measured cost is negligible).
- Virtualizing or lazily hydrating workspaces.

## Risks And Rollback

- Risk: a workspace file deleted or corrupted in place while the hash marker
  still matches is no longer healed by a later `initDatabase()` call within the
  same process. Previously every call healed it at the cost of a full
  re-materialization storm. A restart heals the workspace. Bundles remain the
  source of truth, so no durable data is at risk.
- Risk: per-process reconcile memo could skip a reconcile after in-process data
  replacement. Verified consumers: successful backup/portable restores relaunch
  the app (`app.relaunch()`), and the failed-restore path reopens unchanged
  data, so the memo is safe; recorded in `design.md`.
- Risk: 5 s staleness for `customAgents` reads, identical to the accepted
  staleness of `builtinAgentOverrides` in the same module, and cleared on
  settings updates.
- Rollback: each fix is behavior-scoped; reverting the commits restores the
  unconditional re-materialization semantics without data migration.

## Impacted User Flows

- Startup after the canonical storage authority is established: main-process
  init stops paying one full workspace re-materialization per launch and per
  IPC-triggered `initDatabase()` call.
- Opening the Skills page (`skill:getMdInstallStatusBatch`): no longer queues
  hundreds of reconcile passes; renderer stays responsive.
- Agent platform listing and rules workspace services that call
  `readCustomAgentsFromSettings()` per operation: served from cache.
