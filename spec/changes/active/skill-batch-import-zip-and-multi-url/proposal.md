# Skill Batch Import (ZIP drag/drop + multi-ZIP + multi-GitHub-URL)

## Phase And Status

- Phase: implement
- Status: in-progress
- Primary requirement: `FR-BATCH-001`
- Exit condition: users can install skills in batch by dragging/selecting one
  or more local `.zip` archives and/or by entering multiple GitHub URLs, with
  per-item preview, progress, per-item failure isolation, safety review, and a
  summary — reusing the existing atomic install lifecycle.

## Why

Skill install today is one-source-at-a-time: a single GitHub repo, a single
local directory scan, or a single SKILL.md. There is no path for a local ZIP
archive at all, and no way to import many sources in one action. Users who
curate skill packs (ZIPs) or want to pull several repos at once must repeat the
flow per item.

## Scope

- In scope:
  - new `local-zip` package source kind in the atomic install lifecycle
    (read local `.zip` → reuse `extractSkillZipArchive` → validate/fingerprint/
    safety/atomic-apply), plus a read-only local-zip snapshot IPC for preview;
  - a multi-ZIP file picker dialog (`dialog:selectSkillArchives`);
  - a new "Batch Import" mode in `CreateSkillModal` accepting multiple dropped/
    picked ZIPs and multiple GitHub URLs, with preview + sequential install +
    progress + per-item failures + summary toast;
  - My Skills global drag-and-drop now recognizes `.zip` and routes into batch
    import.
- Out of scope:
  - renderer-side unzip (all extraction stays main-process via `fflate`);
  - changing the managed-skill storage layout or `SkillDB` schema;
  - remote ZIP-by-URL batch (existing remote-zip path is unchanged);
  - per-URL multi-skill expand in batch (a repo with multiple skills is flagged
    for individual import).

## Risks

- Local ZIP bytes come from user disk; rely on the hardened extractor
  (traversal/size/depth/zip-bomb defenses) plus main-side readability/extension
  checks.
- Batch must isolate per-item failures so one bad zip/url does not abort the
  run or leave half-applied state — the lifecycle already applies atomically
  per item.
- Duplicate skill names across the batch are handled by existing `SkillDB`
  de-dup; surfaced as per-item skip/failure, not a crash.

## Rollback Thinking

No schema or persisted-state change. The `local-zip` source kind is additive;
older code that does not produce it is unaffected. Removing the new IPC
channels, preload methods, source-kind branches, and the batch UI fully
reverts the feature without touching existing installs.

## Related Records

- Stable reference: `spec/knowledge/reference/agent-platforms.md`
- Related active change: `spec/changes/active/skills-issue-194-shared-global-target/`
- Governing rules: `spec/rules/tdd-design-gate.md`, `spec/rules/testing-standards.md`,
  `spec/rules/submission-traceability-rules.md`
