# Design: Release 0.8.1 Prep

## Approach

Hotfix release following the 0.8.0 procedure with a reduced surface (no
features, no GUI/i18n/screenshot changes):

1. Version bump to 0.8.1 in root and workspace manifests, `app.json`
   (expo), `CLI_VERSION`, the version-alignment guard, the CLI version test,
   and AGENTS.md.
2. CHANGELOG entry + verbatim macOS notice; `spec/releases/0.8.1.md`;
   releases index row; README + 6 localized README sections/badges.
3. Website metadata via the sync command (generated files only).
4. Local gates: version-alignment test, spec index/traceability checks,
   `pnpm verify:release:quick`. The CI release workflow re-runs the full
   `pnpm verify:release` before building.
5. Tag `v0.8.1` creates the draft release; promote with
   `gh release edit v0.8.1 --draft=false --latest` after asset verification,
   then rerun the workflow for Homebrew/R2 mirrors.

## Traceability

| Requirement | Design | Verification | Task |
| --- | --- | --- | --- |
| `FR-REL-081-001` | D1 version bump set | `TEST-REL-081-1` guard run | `T-REL-081-1` |
| `FR-REL-081-002` | D2 docs/changelog set | `TEST-REL-081-2` doc inspection | `T-REL-081-2` |
| `FR-REL-081-003` | D3 website sync | `TEST-REL-081-3` generated diff | `T-REL-081-3` |

## Tradeoffs

- Skipping GUI screenshots and locale files: the hotfix changes no visible
  copy; recorded rather than silently skipped.
- Local full `verify:release` is deferred to CI (the workflow gates on it);
  quick profile runs locally to catch prep mistakes early.
