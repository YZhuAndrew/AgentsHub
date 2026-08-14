# Implementation: Unify Skill Platform Visibility

Status: implemented; pending review/commit.

## What shipped

### Single authoritative predicate
- `packages/shared/constants/skill-distribution-targets.ts`: exported
  `SHARED_AGENT_SKILLS_TARGET_ID` as the shared contract constant (was an
  inline literal in the renderer and redeclared in `packages/core`).
- `apps/desktop/src/renderer/services/platform-visibility.ts`: added
  `isPlatformEnabled(platform, ctx)` and `filterEnabledPlatforms(platforms, ctx)`.
  Semantics: shared target always on; custom via `customAgentEnabled` resolver
  (default enabled); built-in = not in `disabledPlatformIds`. Detection is NOT
  consulted. Removed the old `filterDeployablePlatforms` (the detection-or-
  configured gate) after migrating all consumers; kept `filterDetectedPlatforms`
  for real-installation browsing.

### Target pickers / counts → toggle-authoritative (`filterEnabledPlatforms`)
- `use-skill-platform.ts` (global distribution — the cited surface), plus it now
  returns `detectedPlatformIds` for the row hint.
- `SkillBatchDeployDialog.tsx`, `SkillListView.tsx`, `SkillManager.tsx`,
  `useSidebarResourceController.tsx`. Dead detection state/IPC removed where it
  became unused; sidebar count var renamed `detectedSkillAgentCount` →
  `skillAgentCount`.

### Real-installation browser → detection-based
- `SkillAgentsView.tsx` now uses `filterDetectedPlatforms` (it scans real
  per-agent skill dirs and its toast says "Detected N agents"). This is a
  deliberate split, documented here, not an oversight.

### Detection demoted to a hint
- `SkillPlatformTargetRow.tsx`: optional `isDetected`; renders a
  `skill.platformNotDetectedHint` badge only when `!isInstalled && isDetected
  === false && id !== shared`. `SkillPlatformPanel.tsx` threads `isDetected`
  from the hook; `SkillFullDetailPage.tsx` passes `detectedPlatformIds`.

### Ordering completeness
- `packages/shared/constants/platforms.ts`: added `copilot` (after `claude`)
  and `amp` (after `codex`) to `DEFAULT_SKILL_PLATFORM_ORDER` (35 → 37, now
  covers every registry id).

### Settings consistency
- `SkillSettings.tsx`: the enabled badge and `ToggleSwitch.checked` now derive
  from the same `isPlatformEnabled` predicate used by distribution, so the
  Settings toggle state cannot drift from Skills visibility.

### i18n
- Added `skill.platformNotDetectedHint` to all 7 locales (en, zh, zh-TW, ja, fr,
  de, es).

## Tests

- `platform-visibility.test.ts`: `filterEnabledPlatforms` keeps an
  enabled-but-undetected built-in (regression for the reported bug), drops
  disabled built-ins, drops disabled custom agents, drops a configured-but-
  disabled built-in, keeps the shared target; `isPlatformEnabled` boundary
  cases. Removed obsolete `filterDeployablePlatforms` cases.
- `platform-visibility-integration.test.ts`: migrated to `filterEnabledPlatforms`.
- `packages/shared/tests/platforms.test.ts`: asserts
  `DEFAULT_SKILL_PLATFORM_ORDER` contains every `SKILL_PLATFORMS` id exactly
  once (guards the copilot/amp gap).
- `skill-platform-target-row.test.tsx`: hint shows only when undetected, not
  installed, and not the shared target; suppressed when detected/installed/
  unknown.
- `skill-batch-deploy-dialog.test.tsx`: updated two cases from the old
  detection-gate semantics to the toggle-authoritative semantics (every enabled
  target shown even when undetected; disabled built-in hidden while custom and
  shared remain).

## Verification

- Affected-area suite green (platform-visibility, integration, row, panel,
  use-skill-platform, agents-view, batch-deploy, list-view, skill-settings,
  sidebar-skills, locale-regression): 77/77 + row/visibility 15/15.
- `packages/shared` full suite: 26/26.
- Desktop full unit suite: the only failing tests are pre-existing and
  unrelated — confirmed by `git stash` → clean HEAD still fails the same files
  (agent-workspace-tabs qwen tab, skill-i18n-manager/runtime-export rendering,
  skill-installer-export-remote SSH temp path, updater-real-scenario network).
  None reference the changed APIs.
- `eslint --max-warnings 0` on all changed files: clean.
- `tsc --noEmit`: changed files are clean. One PRE-EXISTING unrelated error
  remains: `settings-general-actions.ts` references `startupModule`, which is
  not declared in the shared `Settings` type. This predates this change (the
  file was not touched here) and is recorded as a separate follow-up.

## Behavior change to flag

Default state has `disabledPlatformIds = []`, so by default the Skills global
distribution (and batch deploy / list / manager) now lists every enabled
platform, including those not yet installed on disk, each marked with a
"client directory not detected; will be created on install" hint. This is the
intended consistency with the Settings toggle and is the user-requested fix.

## Follow-ups

- Pre-existing TS error: add `startupModule` to the shared `Settings` type (and
  its persistence mapping) or remove the dangling action — separate change.
- Unify the duplicate `SHARED_AGENT_SKILLS_TARGET_ID` literal between
  `packages/core` and `packages/shared` (core can re-export the shared const).
- Consider whether `SkillAgentsView` should also list enabled-but-undetected
  agents (with scan skipping) for full parity; currently detection-based by
  design since it browses real installations.
