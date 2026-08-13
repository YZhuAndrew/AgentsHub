# Implementation: TRAE Work CN shares the TRAE IDE CN root

Status: implemented; pending commit.

## What shipped

- `packages/shared/constants/platforms.ts`: `trae-work-cn` `rootDir`
  (darwin/win32/linux) changed from `~/.trae-work-cn` to `~/.trae-cn`, matching
  `trae-cn` (user-confirmed shared data directory).
- `spec/knowledge/reference/agent-platforms.md`: updated the platform table row,
  the modeling table row, the 建模建议 bullet, and the TRAE isolation rationale
  to reflect the shared root.
- `apps/desktop/tests/unit/main/skill-installer-utils.test.ts`: the
  `trae-work-cn` path test now asserts resolution to `.trae-cn` (not
  `.trae-work-cn`) and equality with `trae-cn`'s resolved root.

## Verification

- `skill-installer-utils.test.ts`: the updated `trae-work-cn` case passes.
- Shared suite + platforms order test still pass (no id/order change).
- `eslint` / `tsc` on changed files: clean (only the pre-existing unrelated
  `startupModule` TS error remains).

## Notes / Follow-ups

- No platform-id change, so `disabledPlatformIds` / `skillPlatformOrder` entries
  for `trae-work-cn` keep working; custom root overrides are honored first.
- Skills previously installed to `~/.trae-work-cn` are not auto-migrated; users
  can reinstall under the corrected path.
