# Tasks

## 1. Module

- [x] 1.1 Add `apps/desktop/src/main/window-state.ts`: `WindowState`, constants, `readWindowState`, `saveWindowState`, `isBoundsVisible`, `resolveInitialBounds`.
- [x] 1.2 Inject `getDisplays` so `resolveInitialBounds` is unit-testable; keep all other logic pure + SQLite-backed.

## 2. Tests (written before/failing-first)

- [x] 2.1 Add `apps/desktop/tests/unit/main/window-state.test.ts` using real `DatabaseAdapter(":memory:")` + schema.
- [x] 2.2 Cover: round-trip, missing key, malformed/wrong-type/out-of-range rejection, `isBoundsVisible` (overlap/off/disconnected/oversized/abutting/empty), `resolveInitialBounds` (restore/fallback/clamp/maximized), double-save, write-failure no-throw.
- [x] 2.3 Achieve 100% line/branch/function/condition coverage for `window-state.ts`.

## 3. Wiring

- [x] 3.1 In `createWindow()`: read `resolveInitialBounds(appDb)`, pass size + optional position into the `BrowserWindow` options, maximize before show when applicable.
- [x] 3.2 Attach debounced resize/move/maximize/unmaximize capture with tracked normal bounds.
- [x] 3.3 Add final flush in `before-quit` before `closeDatabase()`.

## 4. Verify & converge

- [x] 4.1 `vitest run tests/unit/main/window-state.test.ts` green (39 passed).
- [x] 4.2 `eslint` clean on changed files.
- [x] 4.3 Fill `implementation.md`; record optional follow-ups (folder/prompt selection, fullscreen). Change remains active pending review/merge.
