# Implementation

## What shipped

Persist and restore the desktop main-window geometry (size, position, maximized
state) across close/reopen, so the window reopens the way it was closed instead
of always at the hard-coded `1200×800` default.

## Files changed

- **New** `apps/desktop/src/main/window-state.ts` — Electron-free, unit-testable
  module: `readWindowState`, `saveWindowState`, `isBoundsVisible`,
  `resolveInitialBounds`, plus types (`WindowState`, `ResolvedBounds`,
  `DisplayInfo`) and constants. Reuses the existing SQLite `settings` table
  under key `windowState`.
- **New** `apps/desktop/tests/unit/main/window-state.test.ts` — 39 tests with
  real `DatabaseAdapter(":memory:")` + schema.
- **Edited** `apps/desktop/src/main/index.ts`:
  - Imported `screen` and the window-state helpers.
  - Added module-level capture state (`windowStateTracker`, debounced save timer).
  - Added `collectWindowState` / `scheduleWindowStateSave` / `flushWindowStateSave` / `attachWindowStateCapture` helpers before `createWindow`.
  - `createWindow()` now reads `resolveInitialBounds(appDb, () => screen.getAllDisplays())`, passes restored width/height/x/y into the `BrowserWindow` options, seeds the tracker, restores `maximized` before the window is shown, and attaches capture listeners.
  - `before-quit` now flushes the latest geometry before `closeDatabase()`.

## How capture works

- `resize` / `move` listeners ignore transient sizes while maximized/minimized and schedule a ~500 ms debounced save of the normal bounds.
- `maximize` / `unmaximize` listeners update the maximized flag.
- `windowStateTracker` holds the last non-maximized bounds; on a maximized quit, those normal bounds are saved together with `maximized: true`, so un-maximize returns to the user's chosen size.
- `before-quit` cancels any pending debounce and writes immediately before the DB closes (verified quit ordering: `before-quit` precedes window `close`, and `closeDatabase()` is called at the end of the existing handler).

## Design deviation from plan

- The plan specified a "top-center inside a display" visibility rule. During
  testing this rejected legitimately-placed oversized windows (a window wider
  than its monitor has its center outside that monitor). Replaced with
  **rectangle overlap**: a window is reachable if it overlaps any connected
  display, which still rejects fully off-screen / disconnected-monitor saves.
  `design.md` describes the shipped overlap semantics.

## Verification

- `npx vitest run tests/unit/main/window-state.test.ts` → 39 passed.
- Coverage for `window-state.ts`: 100% statements / branches / functions / lines.
- `npx eslint src/main/window-state.ts src/main/index.ts tests/unit/main/window-state.test.ts` → clean.
- `tsc --noEmit`: no errors introduced by these files (one pre-existing, unrelated `startupModule` error in `settings-general-actions.ts` from in-flight work).
- Full `tests/unit/main/` run: 2290 passed, 2 failed. Both failures are pre-existing network-dependent tests unrelated to this change:
  - `skill-installer-export-remote.test.ts` — clones a real GitHub SSH URL (needs network/SSH).
  - `updater-real-scenario.test.ts` — fetches a real `latest.yml` over HTTP.

## Test coverage layer note

`window-state.ts` (validation, storage, display geometry) is covered to 100% by
unit tests with real SQLite. The `index.ts` wiring (`createWindow` restore,
event listeners, `before-quit` flush) is thin Electron glue and is covered at
the integration level — manual verification: resize/move/maximize → quit →
relaunch restores geometry; disconnect the saved monitor → relaunch falls back
to the centered default instead of opening off-screen.

## Converge

- Stable docs: none require update (no user-facing behavior doc for window geometry beyond in-app behavior; no settings UI surface added).
- No IPC/preload/renderer/shared-type contract changes.
- No schema migration; the `windowState` row is inert if the feature is reverted.
- Optional follow-ups recorded: restore last-selected folder/prompt (requires enabling `persist` in `folder.store.ts`); restore OS full-screen state (deferred — macOS Spaces behavior is intrusive).
