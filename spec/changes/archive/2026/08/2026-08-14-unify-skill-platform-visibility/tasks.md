# Tasks: Unify Skill Platform Visibility

## 1. Shared contract
- [x] Export `SHARED_AGENT_SKILLS_TARGET_ID` from
      `packages/shared/constants/skill-distribution-targets.ts`.
- [x] Switch renderer `shared-skill-distribution-target.ts` to import the
      constant instead of the hardcoded literal.

## 2. Authoritative predicate (test-first)
- [x] Add failing tests in `platform-visibility.test.ts` for
      `isPlatformEnabled`/`filterEnabledPlatforms` (enabled-undetected kept,
      disabled built-in dropped, disabled custom dropped, shared always on).
- [x] Implement `isPlatformEnabled`/`filterEnabledPlatforms` in
      `platform-visibility.ts`; remove `filterDeployablePlatforms` after
      migrating consumers.

## 3. Ordering completeness (test-first)
- [x] Add failing test asserting `DEFAULT_SKILL_PLATFORM_ORDER` contains every
      `SKILL_PLATFORMS` id exactly once.
- [x] Add `copilot` (after `claude`) and `amp` (after `codex`) to the order.

## 4. Migrate call sites
- [x] `use-skill-platform.ts` (`availablePlatforms`).
- [x] `SkillBatchDeployDialog.tsx` → `filterEnabledPlatforms`.
- [x] `SkillListView.tsx` → `filterEnabledPlatforms`.
- [x] `SkillManager.tsx` → `filterEnabledPlatforms`.
- [x] `useSidebarResourceController.tsx` → `filterEnabledPlatforms` (count).
- [x] `SkillAgentsView.tsx` → `filterDetectedPlatforms` (real-installation
      browser; documented split).

## 5. Detection hint
- [x] Thread `isDetected` from `use-skill-platform` → `SkillPlatformPanel` →
      `SkillPlatformTargetRow`.
- [x] Add optional `isDetected` to `SkillPlatformTargetRow`; render hint when
      `!isInstalled && isDetected===false && id !== SHARED`.
- [x] Add `skill.platformNotDetectedHint` to all 7 locale files.
- [x] Add failing row test asserting hint visibility rules.

## 6. Settings consistency
- [x] Refactor `SkillSettings.tsx` badge + toggle to use `isPlatformEnabled`.

## 7. Converge
- [x] Affected tests + shared suite green; changed-file lint clean; typecheck
      clean for changed files (one pre-existing unrelated `startupModule` error
      recorded as follow-up).
- [x] Update `implementation.md`. No stable-doc edit needed — the detection gate
      was an implementation detail, not a documented stable rule.
