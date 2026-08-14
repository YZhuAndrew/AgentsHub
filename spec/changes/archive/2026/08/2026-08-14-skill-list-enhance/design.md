# Design

## Current Behavior

- `SkillViewMode = "gallery" | "list"`, default `"gallery"` in `skill-library-slice.ts:28`, persisted to localStorage (`skill-store`).
- `SkillListView` is a `@tanstack/react-virtual` virtualized list of flexible-height rows (~72px), card-style: icon + name + description + source badges + tags + platform icons + actions. No column header, no discrete columns.
- `Skill` type already has `author?`, `version?`, `created_at`, `updated_at`, and source identity fields (`source_url`, `source_label`, `registry_slug`, `is_builtin`). No `source_type` enum; source label derived via `getSkillSourceMeta()` (`detail-utils.ts:217`).
- Tag filter exists in store (`filterTags`); source filter is local component state in `SkillManager` (`sourceFilterKey`); no author filter.
- Single-skill update check: `getInstalledSkillSourceUpdateCheck(skillId)` (`skill-registry-actions.ts:257`) does full network fingerprint comparison. No batch check. Offline `getSkillsWithStoreUpdates()` powers the existing list badge.

## Changes

### A. Default list mode + persistence migration

- `skill-library-slice.ts`: `viewMode` initial `"gallery"` → `"list"`.
- `skill-store-persistence.ts`: add `SKILL_STORE_SCHEMA_VERSION = 2`. In merge, if persisted `schemaVersion` < current, reset `viewMode` to the new default `"list"` (so existing users on the old default see list once), then write current schemaVersion. Users who later explicitly choose gallery keep their choice.

### B. SkillListView → column header + aligned grid rows

- Add a sticky column header row with labels: name, source, author, version, created, updated, platform, (actions spacer).
- Define a shared grid template (e.g. a constant `SKILL_LIST_GRID` class string) used by both header and rows so columns align.
- Each virtual row becomes a grid: name cell (icon + name + description + update badge + safety icon + tags inline), source cell, author cell, version cell, created cell, updated cell, platform cell, actions cell.
- Source cell: `getSkillSourceMeta(skill, t)?.sourceLabel` (already i18n'd), fallback "—".
- Author/version: `skill.author` / `skill.version`, fallback "—".
- Created/updated: format epoch ms via a shared date formatter (`Intl.DateTimeFormat`), fallback "—".
- Switch virtualizer to a fixed estimated row height (~64px) for stable alignment.
- Preserve: selection checkbox, context menu, drag-drop tagging, favorite/quick-install/delete actions, platform icons + count, update-available badge.
- Responsive: on narrow widths hide source/author/created/updated columns via responsive grid template.

### C. Author filter

- Store: `filterAuthor: string | null` + `setFilterAuthor` + `clearFilterAuthor`; session-only (not persisted).
- `skill-filter.ts` `filterVisibleSkills`: add author predicate (null → skip; else case-insensitive trimmed equality on `skill.author`).
- UI: `LibraryFilterBar` gains an author `Select` next to the source `Select`; options derived from distinct authors across loaded skills.

### D. Batch check all updates

- Store state: `skillUpdateStatuses: Record<string, RegistrySkillUpdateCheck>`, `isCheckingAllUpdates: boolean`, `lastBulkCheckAt: number | null`.
- Action `checkAllSkillUpdates()`: collect skills with a remote source / registry candidate; run `getInstalledSkillSourceUpdateCheck` over them with bounded concurrency (3–4); record each result in `skillUpdateStatuses`; failures recorded as `source-unavailable`; set `isCheckingAllUpdates` during run and `lastBulkCheckAt` on completion; return a summary ({ updated, upToDate, failed }).
- List badge: row shows "update available" when `skillUpdateStatuses[id]?.status === "update-available"` (augments offline badge).
- Header button "Check all updates" with spinner while `isCheckingAllUpdates`; summary toast on completion.
- Batch update selected: in selection mode, a button updates each selected skill via `updateInstalledSkillFromSource` sequentially, with a summary toast.

### E. i18n (7 locales)

New `skill.*` keys: column labels (`listCol.*`), author filter (`authorFilterLabel`, `authorFilterAll`), check-all (`checkAllUpdates`, `checkingAllUpdates`, `checkAllUpdatesSummary`), batch update (`batchUpdateSelected`, `batchUpdateSummary`).

## Data / Storage Impact

None persistent beyond the existing `viewMode` localStorage (with a schema-version migration). Update statuses and author filter are session-only state.

## Test Strategy

- Author filter predicate: unit tests (match/no-match/null-skip/case-insensitive).
- `checkAllSkillUpdates`: store action test with mocked per-skill check; assert concurrency aggregation, failure tolerance, state transitions.
- SkillListView: component test asserting column header presence and correct source/author/version/date cell rendering + "—" fallback.
- Default view: store initial state asserts `viewMode === "list"`.
- Persistence migration: old `"gallery"` + old schemaVersion resets to `"list"`.
