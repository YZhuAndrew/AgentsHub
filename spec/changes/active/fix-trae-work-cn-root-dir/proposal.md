# Fix: TRAE Work CN shares the TRAE IDE CN root

## Phase And Status

- Phase: implement
- Status: ready-for-commit
- Primary requirement: `FR-TRAEWCN-001`

## Why

`trae-work-cn` (TRAE Work CN) was modeled with an isolated default root
`~/.trae-work-cn`, distinct from `trae-cn` (TRAE IDE CN) at `~/.trae-cn`. The
user confirmed that, in reality, TRAE Work CN shares the TRAE IDE CN data
directory `~/.trae-cn`. The isolated root was a PromptHub-inferred convention,
not a product-confirmed path, so it was incorrect.

## Scope

- In scope:
  - change `trae-work-cn` default `rootDir` (darwin/win32/linux) to `~/.trae-cn`;
  - sync the stable reference doc (`spec/knowledge/reference/agent-platforms.md`);
  - update the registry/path unit test to lock the shared root.
- Out of scope:
  - changing the `trae-work-cn` platform id (settings/toggles keep working);
  - automatic on-disk migration of skills previously installed to
    `~/.trae-work-cn` (left to the user — see Risks);
  - the international `trae-work` root (`~/.trae-work`), which is unaffected.

## Risks

- `trae-work-cn` and `trae-cn` now resolve to the same directory. Installing a
  skill to both writes to the same path, and detection couples them. This is
  accepted because the user confirmed they share the data directory.
- Existing users who installed skills to `~/.trae-work-cn` before this change
  will see those installs no longer detected under `trae-work-cn` (which now
  checks `~/.trae-cn`); they can reinstall to reconcile. Custom root overrides
  (`builtinAgentOverrides`) are honored first, so users who customized the path
  are unaffected.

## Rollback Thinking

No schema or persisted-state change. Reverting the `rootDir` constant and the
doc/test restores the previous isolated-root behavior.

## Related Records

- Stable reference: `spec/knowledge/reference/agent-platforms.md`
- Prior decision (superseded): isolated `~/.trae-work-cn` root, recorded in
  archived change `spec/changes/archive/2026/07/2026-07-06-agent-skill-management/`.
