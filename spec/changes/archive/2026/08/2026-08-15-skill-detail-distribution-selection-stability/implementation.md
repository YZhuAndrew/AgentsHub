# Implementation

## Shipped

Root cause for both reported defects was renderer update/identity churn on the Skill detail page, not the distribution IPC itself.

1. **Distribution selection reset (`use-skill-platform.ts`)**
   - `refreshInstallStatus` previously closed over the whole `skill` object and unconditionally executed `setSelectedPlatforms(new Set())` on every run. Any store write that replaced the skill object (repo sync, safety report save) or any in-flight mount refresh resolving after the user clicked cleared the selection.
   - `refreshInstallStatus(targetSkillId)` now takes the skill id, so its identity is stable; the refresh effect is keyed on `skill?.id`.
   - Routine refreshes keep the selection and prune platform ids that the fresh status reports as installed (`pruneInstalledPlatforms`, reference-stable when nothing is pruned).
   - Selection resets only when the skill id changes or a batch install completes (`batchInstall` clears it after its refresh, preserving the previous post-install UX).

2. **Rescan loop (`SkillFullDetailPage.tsx`)**
   - The auto-scan effect depended on the whole `selectedSkill` object while persisting through `saveSafetyReport`, which replaces the skill object — an endless scan → save → identity change → rescan loop whenever auto-scan was enabled.
   - The effect now depends on scan-relevant primitives (`id`, `name`, `source_url`, `content_url`, `local_repo_path`, effective scan content `resolvedSkillMdContent || instructions || content`) plus the existing settings inputs. Effective-content keying also removes the duplicate scan that used to fire when repo sync resolved the same content the DB already had.

3. **Store churn (`skill-library-actions.ts`)**
   - `saveSafetyReportToState` keeps the stored skill object identity when the incoming report is unchanged (`isSameSafetyReport` JSON comparison), so repeated identical scans no longer re-render every skill subscriber.

4. **Scroll stutter (`SkillMarkdown.tsx`)**
   - The component rebuilt its remark/rehype plugin arrays and component overrides every render, so unrelated parent re-renders (copy feedback, scroll flag, store updates, the loops above) re-parsed and re-highlighted the whole document.
   - Plugin bases are module-level constants, overrides are created per stable `markdownBase` via `useMemo`, and the component is wrapped in `React.memo`. Content-derived props stay live.

## Deviations From Design

- `SkillFullDetailPage` scan deps additionally key on the effective scan content instead of the raw resolved string; recorded rationale: the mount-time repo sync resolves the same content the DB already stores, and keying on the raw string caused exactly one redundant rescan.

## Verification

- New regression tests (all failed before the fix, pass after):
  - `tests/unit/components/use-skill-platform-selection.test.tsx` — selection survives delayed mount refresh and same-id identity churn; skill switch resets; installed ids are pruned instead of clearing; batch install clears.
  - `tests/unit/components/skill-full-detail-autoscan-stability.test.tsx` — auto-scan runs exactly once for stable inputs (pre-fix: repeated scans), report persisted to store.
  - `tests/unit/stores/skill-store-safety-report-persistence.test.ts` — changed reports replace the stored object; unchanged reports keep object identity.
- Existing suites for touched modules: 7 files / 61 tests green; all store tests: 38 files / 301 tests green.
- `tsc --noEmit` green; ESLint green on touched files; Prettier clean.
- Full desktop suite result: see tasks.md verification checklist.

## Release

- Shipped in v0.8.2 (tag `v0.8.2`, run 31884342315, promoted to latest
  2026-08-15); fix commit `aa00c90c`.

## Stable Docs Sync

- No stable `spec/knowledge` or `spec/rules` boundary changed: this is a renderer behavior fix within existing distribution and safety contracts.
