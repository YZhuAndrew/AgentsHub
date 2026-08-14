# Design

## Requirement Traceability

| Requirement | Design point |
| --- | --- |
| `FR-SKMDPREVIEW-001` render Markdown by default | New preview branch in `editor-content` |
| `FR-SKMDPREVIEW-002` switch to code on Edit | Branch keyed on `!isEditingFileContent`; header Edit logic unchanged |
| `FR-SKMDPREVIEW-003` strip frontmatter in preview | `stripFrontmatter(currentContent)` feeds `SkillMarkdown` |
| `NFR-SKMDPREVIEW-001` no regression for other files | Non-Markdown and editing paths keep `SkillCodeEditor` |
| `NFR-SKMDPREVIEW-002` robustness | `SkillRenderBoundary` wraps the preview |

## Affected Modules

- `apps/desktop/src/renderer/components/skill/SkillFileEditor.tsx` — render branch only.
- `apps/desktop/src/renderer/components/skill/SkillFileEditor.css` — one new container rule + scrollbar group.
- `apps/desktop/tests/unit/components/skill-file-editor.test.tsx` — one updated test, three new tests.

No `packages/*`, DB, IPC, preload, or storage changes.

## Data / Contract Impact

None. The change is purely renderer-side presentation. File read/write, `SkillCodeEditor`, `modifiedFiles`, save, and discard flows are untouched.

## Approach

`SkillFileEditor` already imports `isMarkdownFile` (currently unused) and computes `currentContent`, `isEditingFileContent`, and `selectedFile`. The `editor-content` block is a ternary chain:

```
loading -> ResourcePreview -> SkillCodeEditor
```

Insert a Markdown preview branch before the final `SkillCodeEditor`:

```
loading
  -> ResourcePreview (image/audio/video/pdf/data-url)
  -> isMarkdownFile(selectedFile) && !isEditingFileContent
       -> SkillRenderBoundary > .skill-file-editor__markdown-preview > SkillMarkdown(stripFrontmatter(currentContent))
  -> SkillCodeEditor (editing Markdown + all non-Markdown text files)
```

The header toolbar logic already distinguishes preview (`!isEditingFileContent` shows the Edit button) from editing (`isEditingFileContent` shows Editing + Discard + Cancel). No header change is required: clicking Edit flips `isEditingFileContent`, which moves a Markdown file from the preview branch into the `SkillCodeEditor` branch.

## Frontmatter Decision

Preview strips YAML frontmatter via `stripFrontmatter`. Rationale:
- `SKILL.md` is the most common Markdown file and always carries frontmatter; rendering it as `<hr>` + raw metadata text is noisy.
- Matches the existing "Preview" tab, giving consistent rendered output across the two surfaces.
- The editor branch still shows the complete file, so frontmatter remains editable.

## Error Handling

`SkillMarkdown` uses `rehype-sanitize`; `SkillRenderBoundary` catches any rendering throw so the editor panel degrades to a retry affordance instead of blanking. `resetKey={selectedFile}` resets the boundary when the user switches files.

## Tradeoffs

- Two-state toggle (preview/code) chosen over a three-way edit/preview/split control. Split adds layout, synchronized-scroll, and state complexity that the request does not ask for; the `RuleMarkdownWorkspace` reference shows the cost. A split mode can be added later as a separate change if desired.
