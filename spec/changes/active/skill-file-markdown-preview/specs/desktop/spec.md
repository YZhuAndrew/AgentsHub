# Desktop Spec Delta — Skill Files Markdown Preview

## Scope

`apps/desktop` renderer: `SkillFileEditor` component (Files tab of the Skill detail page).

## Added Requirements

### FR-SKMDPREVIEW-001 — Render Markdown files by default

**When** the selected file in the Files tab is a Markdown file (`.md` / `.mdx`) and the editor is not in editing mode,
**then** the content area renders the file as formatted Markdown (headings, lists, code blocks, tables, links) rather than raw source.

- Acceptance: selecting `SKILL.md` shows a rendered `<h1>` for a leading `# heading`; the read-only CodeMirror source view is not shown for Markdown files in this state.
- Acceptance: non-Markdown text files (e.g. `.py`, `.ts`) are unaffected and continue to show the CodeMirror source view.

### FR-SKMDPREVIEW-002 — Switch to code editor on Edit

**When** the user clicks "Edit" on a Markdown file,
**then** the content area switches to the editable CodeMirror source editor showing the complete file content (including frontmatter).

- Acceptance: after clicking Edit, an editable code editor is shown with the full source; editing and saving work as before.
- Acceptance: clicking Cancel/Discard exits editing and returns the file to the rendered Markdown preview.

### FR-SKMDPREVIEW-003 — Strip frontmatter in preview

**When** a Markdown file with YAML frontmatter is rendered in preview mode,
**then** only the body (frontmatter removed) is rendered.

- Acceptance: `SKILL.md` preview does not render the `---` metadata block; the metadata remains visible/editable in code mode.

## Non-Functional

### NFR-SKMDPREVIEW-001 — No regression for existing files

Resource files (image/audio/video/pdf) keep their `ResourcePreview`. The CodeMirror editor remains the view for non-Markdown text and for Markdown while editing. Existing save/discard/unsaved-change guards are unchanged.

### NFR-SKMDPREVIEW-002 — Render robustness

A malformed Markdown file that fails to render must not blank the editor panel; the existing `SkillRenderBoundary` degradation surface is reused.
