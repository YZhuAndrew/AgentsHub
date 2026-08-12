# Design: Unify Skill Platform Visibility

## Approach

Introduce one authoritative enabled predicate and route both Settings and all
Skills list surfaces through it. Disk detection stops being a membership gate
and becomes a row hint.

## Module Impacts

### `packages/shared/constants/skill-distribution-targets.ts`
- Export `SHARED_AGENT_SKILLS_TARGET_ID = "agent-skills-global"` as the shared
  contract constant so renderer services do not hardcode the literal.
- (Follow-up, out of scope here): `packages/core/src/skill-distribution-targets.ts`
  can re-export this instead of redeclaring it; left as a documented follow-up
  to keep the change local.

### `apps/desktop/src/renderer/services/platform-visibility.ts`
- Add `isPlatformEnabled(platform, ctx)` and `filterEnabledPlatforms(platforms,
  ctx)` where `ctx = { disabledPlatformIds; customAgentEnabled? }`.
  - `platform.id === SHARED_AGENT_SKILLS_TARGET_ID` → `true`
  - `platform.isCustom` → `ctx.customAgentEnabled?.(id) !== false`
  - else → `!ctx.disabledPlatformIds.includes(platform.id)`
- Keep `filterVisiblePlatforms` (disabled-only) as the low-level helper.
- Keep `filterDetectedPlatforms` (detection-only) for surfaces that browse real
  installations.
- Mark `filterDeployablePlatforms` `@deprecated`; after call-site migration it
  delegates to `filterEnabledPlatforms` (detection inputs become unused) so any
  unmigrated consumer stays correct under the new semantics.

### Skills list surfaces (membership migration → `filterEnabledPlatforms`)
- `apps/desktop/src/renderer/components/skill/use-skill-platform.ts`
  (`availablePlatforms`)
- `apps/desktop/src/renderer/components/skill/SkillAgentsView.tsx` (two sites)
- `apps/desktop/src/renderer/components/skill/SkillBatchDeployDialog.tsx`
- `apps/desktop/src/renderer/components/skill/SkillListView.tsx`
- `apps/desktop/src/renderer/components/skill/SkillManager.tsx`
- `apps/desktop/src/renderer/components/layout/useSidebarResourceController.tsx`
  — decision required at implementation time: if it browses real installed
  skill directories, switch it to `filterDetectedPlatforms`; if it is a target
  picker, switch to `filterEnabledPlatforms`. Record the decision in
  `tasks.md`/`implementation.md`.

### Detection hint
- `use-skill-platform.ts` already keeps `detectedPlatforms`; thread
  `isDetected={detectedPlatforms.includes(p.id)}` through `SkillPlatformPanel`
  into `SkillPlatformTargetRow`.
- `SkillPlatformTargetRow.tsx`: optional `isDetected`; render a small badge
  when `!isInstalled && !isDetected && platform.id !== SHARED_TARGET`.

### `packages/shared/constants/platforms.ts`
- Add `copilot` (after `claude`) and `amp` (after `codex`) to
  `DEFAULT_SKILL_PLATFORM_ORDER` → 37 entries, matching the registry.

### Settings consistency
- `apps/desktop/src/renderer/components/settings/SkillSettings.tsx`: replace
  the two inlined enabled expressions (badge + `ToggleSwitch.checked`) with
  `isPlatformEnabled`, so the Settings toggle state is structurally identical
  to the distribution membership predicate.

## Data / Contracts

- No SQLite schema change.
- No persisted-state shape change. `disabledPlatformIds`, `skillPlatformOrder`,
  and `customAgents[].enabled` keep their current meaning.
- Public/shared contract addition: `SHARED_AGENT_SKILLS_TARGET_ID` exported
  from the shared package.

## Tradeoffs

- Showing all enabled platforms by default makes the distribution list longer
  than the old detected-only list. Accepted for consistency; mitigated by
  ordering, the detection hint, and user-managed toggles/order.
- Per-surface migration (rather than editing the shared filter's body blindly)
  is more verbose but prevents accidentally changing a surface that needs
  detection-only semantics.

## Verification Layers

- Unit: predicate + order-completeness + row hint.
- Component: regression asserting distribution includes enabled-undetected
  built-in.
- Manual: toggle off → disappears from Skills; toggle on an undetected
  platform → appears with hint → install succeeds and creates the directory.
