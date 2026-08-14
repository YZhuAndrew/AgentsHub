# Proposal

## Phase And Status

- Phase: implement
- Status: in-progress
- Primary requirement: `FR-SKMDPREVIEW-001`
- Exit condition: In the Skill detail page "Files" tab, selecting a Markdown (`.md`/`.mdx`) file renders it as formatted Markdown by default instead of raw source. Clicking "Edit" switches the same file to the code editor (editable source). Non-Markdown files and editing sessions are unchanged. Behavior is covered by renderer component tests.

## Why

The "Files" tab opens every text file in a CodeMirror editor. For Markdown files this means the user always sees raw `# heading` / `**bold**` source even when they only want to read the rendered document. Markdown is the one text format in a skill package that has a meaningful rendered representation, and the app already ships a `SkillMarkdown` renderer used by the "Preview" tab. Surfacing that renderer in the file viewer lets users read documents in place and drop into source only when they need to edit.

## Scope

- In scope:
  - In `SkillFileEditor.tsx`, render Markdown files through `SkillMarkdown` while not editing, and through `SkillCodeEditor` while editing (or for any non-Markdown file).
  - Strip YAML frontmatter in the rendered preview (reuse `stripFrontmatter`) so `SKILL.md` reads cleanly, matching the existing "Preview" tab.
  - Add a scrollable Markdown preview container style in `SkillFileEditor.css`.
  - Update the affected renderer test and add regression tests for the preview/edit/cancel lifecycle.
- Out of scope:
  - No split (edit + preview side-by-side) mode. The request is a two-state toggle (preview vs. code).
  - No change to non-Markdown files (`.py`, `.ts`, etc.) — they keep the read-only CodeMirror source view.
  - No DB, IPC, preload, storage, or sync contract changes. No new i18n keys.

## Risks

- **Preview vs. edit content mismatch**: preview strips frontmatter while edit shows the full file. This is intentional and matches the "Preview" tab; the source is never lost because the editor always shows the complete file.
- **Render failure on malformed Markdown**: mitigated by wrapping the preview in the existing `SkillRenderBoundary` so a single bad file cannot blank the editor panel.
- **Existing test assumptions**: one test asserted a read-only CodeMirror for a `.md` file; it is updated to assert the rendered preview instead.

## Rollback Thinking

- Revert is isolated to one render branch in `SkillFileEditor.tsx`, one CSS rule, and the test file. No persisted state, migration, or contract is introduced, so rollback is a pure code revert with no data cleanup.

## Related Records

- Reuses `SkillMarkdown` (`apps/desktop/src/renderer/components/skill/SkillMarkdown.tsx`) and `SkillRenderBoundary`, both already used by `SkillPreviewPane`.
- Reuses `stripFrontmatter` from `detail-utils.ts`.
- Pattern reference: `RuleMarkdownWorkspace.tsx` (CodeMirror + `SkillMarkdown` view switching).
- Stable docs: none require updates (no user-facing doc describes the Files tab render mode).
