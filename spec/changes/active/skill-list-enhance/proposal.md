# Proposal

## Problem

Skill management list view lacks the information density and update tooling users need:

1. The library defaults to the gallery (card) view. The list view exists but has no column header and does not show source, author, version, created, or updated time.
2. Only tag filtering exists (sidebar). There is no author filter.
3. Update checks are per-skill, available only on the detail page. There is no "check all updates" or batch update.

## Scope

- Make the list view the default, with a one-time persistence migration so existing users see the new default.
- Refactor `SkillListView` into a column-header + aligned-grid-row table layout showing: name (+ description), source, author, version, created time, updated time, platform status, actions.
- Add an author filter (store state + filter predicate + Select control in the filter bar).
- Add a "check all updates" action that performs real per-skill network fingerprint checks (reusing `getInstalledSkillSourceUpdateCheck`) with bounded concurrency, aggregates results, and surfaces "update available" badges in the list. Add batch update for selected skills.

## Non-Goals

- No column sorting in this change (display only).
- No changes to the gallery card view (keep as-is for users who switch back).
- No new persistence for update statuses (session-only state).
- No change to the underlying update-check network logic (reuse existing).
