# Proposal

## Phase And Status

- Phase: implement
- Status: in-progress
- Primary requirement: `FR-REL-082-001`
- Exit condition: all shipped distributions align on 0.8.2, the bilingual CHANGELOG entry and release record are published, and the v0.8.2 stable release supersedes v0.8.1 as latest.

## Why

A user reported two serious Skill detail page defects shortly after v0.8.1
was published (2026-08-15): distribution selections were cleared immediately,
making distribution impossible, and preview scrolling stuttered. The fixes
landed in `skill-detail-distribution-selection-stability` and must reach users
as the latest stable.

## Scope

- In scope:
  - Version alignment to 0.8.2 across root, CLI, desktop, web, worker, and
    mobile manifests plus version assertions and `CLI_VERSION`.
  - CHANGELOG 0.8.2 entry with the verbatim macOS unsigned-fork notice.
  - `spec/releases/0.8.2.md` record and release index row.
  - README + 7 localized README version badges and history sections.
  - Website generated release metadata via `pnpm --dir website sync:release`.
  - Publish v0.8.2 as latest stable; add an upgrade advisory to the published
    v0.8.1 release notes.
- Out of scope:
  - Any behavior change beyond the already-committed fix
    (`skill-detail-distribution-selection-stability`).
  - Re-publication of v0.8.1 artifacts (same-version replacement cannot reach
    already-installed 0.8.1 auto-update clients; 0.8.2 is the upgrade path).

## Risks

- Publishing a second stable on the same day as v0.8.1; mitigated by the
  v0.8.1 release-notes advisory pointing users to 0.8.2.
- Release workflow must pass the full verify gate before artifact upload.

## Rollback Thinking

Docs/manifest-only before tagging. After publication, the release is
immutable in practice; rollback means a follow-up 0.8.3.

## Related Records

- Change: `spec/changes/active/skill-detail-distribution-selection-stability`
- Release: `spec/releases/0.8.2.md`
