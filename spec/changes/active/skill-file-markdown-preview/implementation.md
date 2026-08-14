# Implementation

## Status

Shipped. Behavior verified by renderer component tests. Change remains active pending review/merge.

## What Shipped

Markdown files (`.md` / `.mdx`) in the Skill detail page "Files" tab now render as formatted Markdown by default instead of raw source. Clicking "Edit" switches the same file into the editable CodeMirror source editor; Cancel/Discard returns it to the rendered preview.

### Files changed

- `apps/desktop/src/renderer/components/skill/SkillFileEditor.tsx`
  - Imported `SkillMarkdown`, `SkillRenderBoundary`, and `stripFrontmatter`. The previously-imported-but-unused `isMarkdownFile` helper is now active.
  - Added a render branch in the `editor-content` ternary chain: when `isMarkdownFile(selectedFile) && !isEditingFileContent`, render `SkillMarkdown` (frontmatter stripped via `stripFrontmatter`) wrapped in `SkillRenderBoundary`, inside a new `.skill-file-editor__markdown-preview` container. Editing Markdown and all non-Markdown text files continue to use `SkillCodeEditor`.
- `apps/desktop/src/renderer/components/skill/SkillFileEditor.css`
  - Added `.skill-file-editor__markdown-preview` (flex, scrollable, padded) and included it in the shared thin-scrollbar selector groups.
- `apps/desktop/tests/unit/components/skill-file-editor.test.tsx`
  - Updated `keeps local package file browsing read-only when requested` to assert the rendered Markdown heading (and absence of the code editor) for a read-only `.md` file.
  - Added four tests: default rendered preview, switch to code editor on Edit, frontmatter stripped in preview but present in source mode, return to preview after canceling edits.

No DB, IPC, preload, storage, sync, or i18n changes. No new dependencies. Error-boundary strings reuse existing `skill.previewRenderError*` and `common.retry` keys.

## Frontmatter Decision

Rendered preview strips YAML frontmatter (reusing `stripFrontmatter`), matching the existing "Preview" tab so `SKILL.md` reads cleanly. The code editor always shows the complete file, so frontmatter remains fully editable in source mode.

## Verification

- `vitest run tests/unit/components/skill-file-editor.test.tsx` — 20 passed (16 pre-existing + 4 new; the read-only test updated).
- `eslint` on `SkillFileEditor.tsx` and `skill-file-editor.test.tsx` — clean.
- `edit-skill-modal.test.tsx` and `skill-code-editor.test.tsx` — pass (no collateral impact on consumers of the file editor / code editor).
- Full `tests/unit` run: the only failures (`skill-i18n-manager`, `skill-installer-export-remote`, `updater-real-scenario`, `agent-workspace-tabs`, `skill-i18n-runtime-export`) and the `skill-ui.integration` failures were confirmed pre-existing via a `git stash` baseline run (identical failures without these changes). They are unrelated to Markdown file rendering.

## Out of Scope / Follow-ups

- No split (edit + preview side-by-side) mode. Can be added as a separate change if desired.
- Non-Markdown text files (`.py`, `.ts`, etc.) are unchanged: read-only CodeMirror source view, code editor on Edit.
