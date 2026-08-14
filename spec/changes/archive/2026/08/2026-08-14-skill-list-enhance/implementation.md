# Implementation

Status: complete.

## What shipped

### A. Default list mode + persistence migration

- `apps/desktop/src/renderer/stores/skill/skill-library-slice.ts`: `viewMode` default `"gallery"` → `"list"`.
- `apps/desktop/src/renderer/stores/skill/skill-store-persistence.ts`: added `SKILL_STORE_SCHEMA_VERSION = 2` with a dedicated `skill-store-schema-version` localStorage key. On merge, if the persisted schema version is below current, `viewMode` resets to the new default `"list"` once; a later explicit choice is preserved because the schema key is then current. `partializeSkillState` does not leak session-only state (`filterAuthor`, `skillUpdateStatuses`, `isCheckingAllUpdates`, `lastBulkCheckAt`).

### B. SkillListView: header + single-row colored metadata pills

- `apps/desktop/src/renderer/components/skill/SkillListView.tsx`:
  - Added a sticky `SkillListColumnHeader` (Name + Platforms) at the top of the scroll container.
  - Added a `SkillListMetadataRow` rendered inside each virtualized row as a **single wrap row of colored pills**: source (primary), author (violet), version (emerald), created/updated (muted). Each pill is a `SkillMetaPill` with a label + value, colored by tone, omitted when the value is "—". This puts source/author/version/created/updated on one row in color-coded blocks for easy scanning.
  - Estimated row height raised from 72 → 88 to accommodate the extra metadata line; `measureElement` still corrects real heights.
  - All existing interactions preserved: selection checkbox, context menu, drag-drop tagging, favorite/quick-install/delete actions, platform icons + count, update-available badge, safety icon.

### C. Author filter + chip-style source/author filters

- Store: `filterAuthor: string | null` + `setFilterAuthor` (trims/nulls blank), session-only (not persisted). Added to `SkillLibrarySlice` Pick and `createSkillLibraryState`.
- `apps/desktop/src/renderer/services/skill-filter.ts`: `filterVisibleSkills` gains an author predicate (null/blank → skip; else case-insensitive trimmed equality). `getFilteredSkills` and `SkillManager`'s `baseFilteredSkills` memo pass `filterAuthor` through.
- UI: the source and author filters in `LibraryFilterBar` are now **toggle-pill chip groups** (`FilterChipGroup`), matching the sidebar tag-filter visual style (rounded-full, active = filled primary, inactive = muted hover-to-primary). Options beyond a preview limit (6) collapse behind a "+N" toggle. This replaces the previous `Select` dropdowns for both source and author filters.

### D. Batch check all updates + batch update selected

- Store state: `skillUpdateStatuses: Record<string, RegistrySkillUpdateCheck>`, `isCheckingAllUpdates: boolean`, `lastBulkCheckAt: number | null` (session-only).
- Actions (`skill-registry-actions.ts`):
  - `checkAllSkillUpdates()`: collects skills with a resolvable source candidate, runs the existing public per-skill check (`getInstalledSkillSourceUpdateStatus`) with bounded concurrency (3), aggregates statuses, tolerates per-skill failures, sets/clears `isCheckingAllUpdates`, records `lastBulkCheckAt`, returns a `{checked, updated, upToDate, failed}` summary. Guards against concurrent runs.
  - `batchUpdateSelectedSkills(skillIds)`: sequentially updates each via `updateInstalledSkillFromSource`, returns `{succeeded, failed}`.
  - `clearSkillUpdateStatuses()`: resets statuses + timestamp.
- `SkillManager` augments `skillsWithStoreUpdates` with IDs flagged `update-available` by the last batch check, so the list badge reflects live results.
- UI: "Check all updates" button in `LibraryHeaderControls` (spinner + disabled while running); "Update Selected" button in `BatchActions` (selection mode); summary toasts on completion. Handlers + author-filter options extracted to `useSkillManagerBulkActions.tsx` to keep `SkillManager.tsx` under the 1500-line budget.

### E. i18n (7 locales)

Added to all locales (`en`, `zh`, `zh-TW`, `ja`, `fr`, `de`, `es`): `skill.listCol.*` (name/source/author/version/createdAt/updatedAt/platform), `authorFilterLabel`, `authorFilterAll`, `checkAllUpdates`, `checkingAllUpdates`, `checkAllUpdatesSummary`, `batchUpdateSelected`, `batchUpdateSummary`. Key parity verified.

## Data / Storage Impact

- `viewMode` localStorage now carries a one-time schema migration (v1 → v2). No schema field is added to the runtime `SkillState` type.
- Author filter and update statuses are session-only (never persisted).

## Verification

- `pnpm --filter @prompthub/desktop typecheck` — all changed files pass (only the pre-existing, unrelated `startupModule` error in `settings-general-actions.ts` from the separate `startup-behavior-settings` change remains).
- `pnpm lint` (root) — pass; file-size limit pass (`SkillManager.tsx` 1465 ≤ 1500 after extraction); ESLint 0 warnings.
- Locale JSON validity + key parity verified across all 7 locales.
- Focused tests (all pass, 81 total across 10 files):
  - `skill-filter.test.ts` (7) — added author-filter cases (match, case-insensitive/trimmed, null/blank skip, combined with search).
  - `skill-store-bulk-update-check.test.ts` (6, new) — aggregation, failure tolerance, concurrent-run guard, default view, `setFilterAuthor` trim/null, `clearSkillUpdateStatuses`.
  - `skill-store-persistence-migration.test.ts` (4, new) — old-schema reset to list, explicit choice preserved after migration, invalid-value fallback, session-only fields not persisted.
  - Existing skill store / filter / locale / update-status tests — all green.

## Follow-ups (not in this change)

- Column sorting is display-only; adding sort by version/date/author is a natural follow-up.
- Gallery card view is unchanged; users who switch back keep their choice.
- The batch update check uses the public per-skill check; a future optimization could dedupe remote fingerprint fetches across skills sharing a repo.
