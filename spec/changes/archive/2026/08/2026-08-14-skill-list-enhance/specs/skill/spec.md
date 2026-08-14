# spec.md — Skill List Enhancement

## Requirements

- The Skill library defaults to list view; existing users are migrated once to the new default.
- The list view shows a column header and per-skill columns: name (with description), source, author, version, created time, updated time, platform status, and actions.
- Users can filter the library by author via a control in the filter bar.
- Users can trigger "check all updates" to perform real per-skill remote update checks; results surface an "update available" badge per skill and a summary.
- In selection mode, users can batch-update the selected skills.

## Scenarios

### Default view

- **Given** a fresh install, **when** the user opens the Skill library, **then** the list view is shown (not gallery).
- **Given** an existing user whose persisted view was gallery on the old schema, **when** the store loads, **then** viewMode resets to list once; a later explicit switch to gallery is preserved.

### List columns

- **When** a skill has source/author/version/timestamps, **then** each column shows the derived value (source from `getSkillSourceMeta`, author/version from the skill, timestamps formatted locally).
- **When** a field is missing, **then** the cell shows "—".
- **When** a skill has an update available, **then** an "update available" badge appears at the name.

### Author filter

- **When** the user selects an author in the filter bar, **then** only skills by that author remain (case-insensitive, trimmed).
- **When** the author filter is cleared, **then** all authors are shown again.

### Check all updates

- **When** the user clicks "Check all updates", **then** each skill with a remote source is checked (bounded concurrency), the button shows a spinner, and on completion a summary toast reports updated / up-to-date / failed counts.
- **When** a skill's check fails, **then** it is recorded as unavailable without aborting the batch.
- **When** a checked skill has an update, **then** its row shows the "update available" badge.

### Batch update selected

- **Given** selection mode with skills selected, **when** the user clicks batch update, **then** each selected skill is updated sequentially and a summary toast reports success/failure.
