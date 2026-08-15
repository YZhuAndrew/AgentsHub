# Design

## Affected Modules

- `apps/desktop/src/renderer/components/skill/use-skill-platform.ts` — selection lifecycle and refresh trigger.
- `apps/desktop/src/renderer/components/skill/SkillFullDetailPage.tsx` — auto-scan effect dependency list.
- `apps/desktop/src/renderer/components/skill/SkillMarkdown.tsx` — render isolation.
- `apps/desktop/src/renderer/stores/skill/skill-library-actions.ts` — no-op safety-report store writes.

## Approach

### 1. Selection lifecycle in `useSkillPlatform`

Current behavior: `refreshInstallStatus` is recreated whenever the `skill` object identity changes, its effect re-runs on every recreation, and every run executes `setSelectedPlatforms(new Set())`.

New behavior:

- `refreshInstallStatus(skillId)` takes the skill id as a parameter, so its callback identity is stable across skill object churn.
- The mount/change effect is keyed on `skill?.id`. On id change it clears the selection and refreshes install status.
- Routine refreshes no longer clear the selection. Instead they prune ids that the fresh status reports as installed, preserving the invariant `selection ⊆ uninstalled platforms` without discarding user intent.
- `batchInstall` clears the selection once its refresh completes, preserving the existing post-install UX.

Consumers of the hook (`SkillFullDetailPage`, `SkillQuickInstall`) keep the same returned API.

### 2. Auto-scan loop in `SkillFullDetailPage`

The scan effect currently lists the whole `selectedSkill` object as a dependency while persisting its result through `saveSafetyReport`, which replaces the skill object in the store — producing an endless scan/save/render cycle when auto-scan is on.

The effect is changed to depend on the scan-relevant primitives (`id`, `name`, `source_url`, `content_url`, `local_repo_path`) plus the existing `resolvedSkillMdContent`, `aiModels`, `autoScanInstalledSkills`, and `isAgentDetail` dependencies. The store `saveSafetyReportToState` additionally skips the state write when the incoming report is deep-equal to the skill's current report, so repeated identical scans do not churn the store at all.

### 3. Render isolation in `SkillMarkdown`

The component rebuilds its `rehypePlugins` array and component overrides on every render, defeating any memoization and forcing react-markdown to re-parse and re-highlight the document on unrelated parent re-renders (copy feedback, scroll-driven flags, store updates).

The plugin arrays and the markdown component override map become module-level constants (the link/image renderers already depend only on props), and the component is wrapped in `React.memo`. Content-derived props stay live, so genuine content changes still re-render.

## Data / IPC / Sync Impact

None. No IPC channels, payloads, persistence, or filesystem behavior change. The only store change is suppressing a redundant state write.

## Tradeoffs

- Pruning (instead of clearing) selection on refresh means a selection made before a refresh survives; if a platform was installed by another surface meanwhile, it silently drops from the selection rather than causing a redundant install attempt. This matches the invariant users see in the row list.
- Deep-equality check for safety reports uses JSON serialization of the small report object; acceptable for the report shape and far cheaper than the re-render churn it prevents.

## Verification

- New hook regression tests via `renderHook` covering delayed refresh resolution, identity churn, skill switch, pruning, and post-install clearing (`TEST-SDSS-001..004`).
- New detail-page test bounding scan invocations with auto-scan enabled (`TEST-SDSS-005`).
- New store test asserting no-op safety-report saves preserve object identity (`TEST-SDSS-006`).
- Existing suites for the skill detail page, platform panel, and markdown rendering stay green; full desktop Vitest run plus ESLint.
