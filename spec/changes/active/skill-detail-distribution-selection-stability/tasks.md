# Tasks

## 1. Regression tests (test-first)

- [x] `use-skill-platform` hook tests: selection survives delayed refresh, identity churn, skill switch reset, installed-id pruning, post-install clearing. (`tests/unit/components/use-skill-platform-selection.test.tsx`)
- [x] Skill detail page test: bounded safety scans with auto-scan enabled. (`tests/unit/components/skill-full-detail-autoscan-stability.test.tsx`)
- [x] Store test: unchanged safety report save keeps skill object identity. (`tests/unit/stores/skill-store-safety-report-persistence.test.ts`)

## 2. Implementation

- [x] `use-skill-platform.ts`: stable `refreshInstallStatus(skillId)`, id-keyed effect, selection-preserving refresh with pruning, post-install clear.
- [x] `SkillFullDetailPage.tsx`: auto-scan effect depends on scan-relevant primitives keyed by effective scan content.
- [x] `skill-library-actions.ts`: skip no-op safety report state writes.
- [x] `SkillMarkdown.tsx`: module-level plugin/component constants plus `React.memo`.

## 3. Verification

- [x] Targeted new tests fail before the fix and pass after.
- [x] `vitest run` green for touched-module tests (7 files, 61 tests) and all store tests (38 files, 301 tests).
- [x] Full `pnpm test:run` green (desktop suite: 612 files / 5445 tests).
- [x] `pnpm lint` green for touched files; Prettier clean.

## 4. Converge

- [x] Update `implementation.md` with shipped behavior and verification results.
