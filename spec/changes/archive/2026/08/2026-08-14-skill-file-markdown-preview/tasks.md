# Tasks

## 1. Tests (written first, failing)

- [x] 1.1 Update `keeps local package file browsing read-only when requested`: a read-only `.md` file now renders as Markdown preview; assert rendered heading present and code editor absent (other read-only assertions unchanged).
- [x] 1.2 Add `renders markdown files as rendered preview by default instead of raw source`.
- [x] 1.3 Add `switches a markdown file to a code editor when entering edit mode` and `strips frontmatter in markdown preview but keeps it editable in source mode`.
- [x] 1.4 Add `returns to rendered preview after canceling markdown edits`.

## 2. Implementation

- [x] 2.1 `SkillFileEditor.tsx`: import `SkillMarkdown`, `SkillRenderBoundary`, `stripFrontmatter`; enable existing `isMarkdownFile` import.
- [x] 2.2 Insert Markdown preview branch in `editor-content` (after resource preview, before `SkillCodeEditor`), gated on `isMarkdownFile(selectedFile) && !isEditingFileContent`.
- [x] 2.3 `SkillFileEditor.css`: add `.skill-file-editor__markdown-preview` and include it in the scrollbar selector groups.

## 3. Verify & converge

- [x] 3.1 `vitest run tests/unit/components/skill-file-editor.test.tsx` green (20 passed).
- [x] 3.2 `eslint` clean on changed files.
- [x] 3.3 Fill `implementation.md` with shipped behavior and verification results. Confirmed unrelated suite failures are pre-existing via `git stash` baseline.
