# Proposal

## Phase And Status

- Phase: implement
- Status: in-progress
- Primary requirement: `FR-WINSTATE-001`
- Exit condition: Closing and reopening the desktop app restores the previous main-window geometry (size, on-screen position, and maximized state). First launch and invalid/off-screen saved state fall back to the default centered `1200×800` window. Behavior is persisted to the existing SQLite `settings` table and covered by regression tests.

## Why

The main window is created in `apps/desktop/src/main/index.ts` with hard-coded
`width: 1200, height: 800` and no `x`/`y`. Nothing calls `getBounds()` and
nothing persists window geometry, so every relaunch discards the user's chosen
size, position, and maximized state. Other UI state (active module, sidebar
collapse, pane widths, sort/view) already restores via zustand `persist`; the
missing piece is the window geometry itself.

## Scope

- In scope:
  - Persist `{ width, height, x, y, maximized }` for the main window to the existing SQLite `settings` table under a new key `windowState`.
  - Restore bounds in `createWindow()` before the window is shown; restore maximized state without a visible resize flash.
  - Capture bounds on resize/move (debounced) and on maximize/unmaximize, plus a guaranteed final save in `before-quit` before the database closes.
  - Validate saved bounds against current displays so a window saved on a now-disconnected monitor falls back to a visible, centered default.
  - Unit tests for the new pure module with real SQLite.
- Out of scope:
  - Restoring the last-selected folder/prompt (`folder.store.ts` does not persist `selectedFolderId`). Recorded as an optional follow-up.
  - Restoring OS full-screen state (macOS full-screen Spaces behavior is intrusive). Recorded as an optional follow-up.
  - No new dependency (`electron-window-state`/`electron-store`), no new IPC/preload/renderer contract, no schema migration (the `settings` table is a generic key/value store).

## Risks

- **Quit ordering**: `before-quit` calls `closeDatabase()` and fires before the window `close` event, so the quit-time save must run before `closeDatabase()`. Mitigated by saving inside the existing `before-quit` handler before the close call, with the debounced capture path as the primary mechanism.
- **Maximized bounds**: while maximized, `getBounds()` returns the work-area size, not the user's normal size. The module tracks the last non-maximized bounds and saves those together with `maximized: true` so un-maximize returns to the right size.
- **Off-screen restore**: a saved position on a disconnected external monitor would render the window unreachable. Mitigated by the display-visibility check on restore.

## Rollback Thinking

- Revert is isolated to `index.ts` wiring (stop reading/applying/restoring) plus the new `window-state.ts` module. A leftover `windowState` row in the `settings` table is inert and harmless; no migration or data cleanup is required.

## Related Records

- Stable docs: none updated (no user-facing behavior doc for window geometry beyond in-app behavior).
- Reuses the existing SQLite `settings` persistence pattern (`settings-readers.ts`, `settings.ipc.ts`).
