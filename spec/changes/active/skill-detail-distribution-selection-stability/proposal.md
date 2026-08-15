# Proposal

## Phase And Status

- Phase: implement
- Status: in-progress
- Primary requirement: `FR-SDSS-001`
- Exit condition: Skill detail users can select distribution targets and keep that selection while background refreshes run, and the preview tab scrolls without periodic stutter caused by renderer update loops.

## Why

Two user-visible defects reported on the Skill preview (detail) page:

1. Opening the distribution panel and selecting platforms (全局分发 / 项目分发) is impossible: the selection is immediately cleared back to the unselected state, so distribution cannot be performed.
2. Scrolling the preview content up and down stutters periodically instead of staying smooth.

Root cause analysis found a shared renderer instability chain:

- `useSkillPlatform` keys its install-status refresh effect on the whole `skill` object and unconditionally clears `selectedPlatforms` on every refresh. Any store write that replaces the skill object (for example `syncSkillFromRepo` always rebuilding the array, or `saveSafetyReport` replacing the item) re-triggers the refresh, which wipes the user's in-progress selection. The quick-install dialog has the same failure because its mount-time refresh resolves after the user starts clicking.
- The Skill detail auto-scan effect depends on the whole `selectedSkill` object and persists its report through `saveSafetyReport`, which always replaces the skill object in the store. With auto-scan enabled this forms an infinite scan → save → identity change → rescan loop that continuously re-renders the page (scroll stutter) and re-runs the platform refresh (selection wipe).
- `SkillMarkdown` is not memoized and rebuilds its remark/rehype plugin arrays on every render, so any unrelated re-render fully re-parses the markdown document with syntax highlighting, amplifying the stutter.

## Scope

- In scope:
  - `apps/desktop/src/renderer/components/skill/use-skill-platform.ts` selection lifecycle.
  - `apps/desktop/src/renderer/components/skill/SkillFullDetailPage.tsx` auto-scan effect dependencies.
  - `apps/desktop/src/renderer/components/skill/SkillMarkdown.tsx` render isolation.
  - Renderer store `saveSafetyReport` no-op suppression when the persisted report is unchanged.
  - Regression tests for each behavior above.
- Out of scope:
  - IPC, preload, database, and filesystem contracts (no contract changes).
  - Distribution install/uninstall semantics, platform lists, or target-dir behavior.
  - Visual redesign or copy changes.

## Risks

- Keeping a selection across refreshes must not allow installing a platform that became installed concurrently; the fix prunes newly installed ids from the selection instead of clearing everything.
- Memoizing `SkillMarkdown` must not freeze genuinely changed content; content-derived props remain live.
- Removing the selection reset from routine refreshes changes when stale selections can appear; pruning plus skill-id reset plus post-install clearing covers those paths.

## Rollback Thinking

Renderer-only, behavior-preserving revert: restore the three renderer files and the store guard. No data migration, storage, or sync impact.

## Related Records

- Issue: none (user report, 2026-08-15)
- ADR: none
