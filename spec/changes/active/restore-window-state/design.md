# Design

## Goal

Persist and restore the desktop main-window geometry (size, position, maximized
state) across close/reopen, entirely in the Electron main process, reusing the
existing SQLite `settings` key/value store.

## Approach

### Storage

- New `settings` key: `windowState`, value is a JSON string:
  `{ "width": number, "height": number, "x": number, "y": number, "maximized": boolean }`.
- Read: `SELECT value FROM settings WHERE key = 'windowState'` → `JSON.parse` → validate.
- Write: `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)` with `JSON.stringify`, mirroring `settings.ipc.ts`.
- No schema migration: the `settings` table (`packages/db/src/schema.ts`) is generic key/value. The key is absent on first launch and on upgrade; both resolve to defaults.

### New module: `apps/desktop/src/main/window-state.ts`

Pure + DB logic, decoupled from Electron where possible for testability:

- `WindowState` type and constants (`WINDOW_STATE_KEY`, `DEFAULT_WIDTH/HEIGHT`, `MIN_WIDTH/HEIGHT`).
- `readWindowState(db): WindowState | null` — returns validated state or `null` for missing/malformed/wrong-type/out-of-range values.
- `saveWindowState(db, state): void` — upsert; never throws into event handlers (logs on failure, since window geometry is non-critical UX state).
- `isBoundsVisible(bounds, displays): boolean` — pure; true if the window **overlaps** any connected display (rectangle intersection). Overlap — rather than a single containment point — handles windows wider/taller than a single monitor (whose center would otherwise land outside that monitor) while still rejecting windows saved fully off-screen or on a now-disconnected monitor.
- `resolveInitialBounds(db, getDisplays?): ResolvedBounds` — read → validate visible + min size → clamp oversized dimensions to the target display work area → return `{ width, height, x?, y?, maximized }`; otherwise default (no `x`/`y`, `maximized: false`). `screen.getAllDisplays()` is injected so the function is unit-testable.

`screen` is referenced only as the default `getDisplays` argument; all other logic is pure or SQLite-backed, so the module is covered by `DatabaseAdapter(":memory:")` tests.

### Wiring in `apps/desktop/src/main/index.ts`

- `createWindow()`:
  - Compute `const initial = appDb ? resolveInitialBounds(appDb) : null;` before constructing the `BrowserWindow`.
  - Pass `width/height` (always) and `x/y` (only when restored) into the constructor options; keep `minWidth/minHeight`.
  - After construction, before `ready-to-show` shows the window, call `mainWindow.maximize()` when `initial.maximized` is true.
- Capture listeners (attached once after construction):
  - Track `trackedBounds` (last non-maximized bounds) and `trackedMaximized`.
  - `resize` / `move`: when `!isMaximized() && !isMinimized()`, update `trackedBounds` from `getBounds()` and schedule a debounced (~500 ms) save.
  - `maximize` / `unmaximize`: update `trackedMaximized` and schedule a debounced save.
- `before-quit` (existing handler at the end of `index.ts`): flush the latest state immediately and cancel any pending debounce timer, before `closeDatabase()` is called. At quit time, use live `mainWindow.isMaximized()` for the flag and `trackedBounds` for `x/y/w/h` when maximized (so the normal size survives), otherwise live `getBounds()`.

### Lifecycle ordering (verified)

Electron emits `before-quit` → window `close` events → `will-quit` → `quit`. The existing `before-quit` calls `closeDatabase()` at its end, so saving before that call is safe and the window object still exists. Tray-minimize keeps the same window object alive, so geometry is retained in memory and the debounced capture keeps the DB in sync.

## Data and Storage Change Gate

- Current source of truth: none (window geometry is ephemeral today).
- Schema/layout delta: new `settings` row key `windowState` (JSON). No table/column/index/trigger change.
- Migration/compatibility: absent key ⇒ defaults; existing users see no change until they close once; backward compatible.
- Rollback/recovery: remove the read/write wiring; the orphaned row is inert. No backup/recovery impact.
- Verification: real SQLite round-trip, malformed-input rejection, display-visibility, oversize clamp tests.

## Contracts

- No new IPC channel, no preload exposure, no renderer change, no shared type crossing packages. Window geometry is main-process-owned.

## Tradeoffs

- Chose the existing SQLite `settings` table over a new dependency (`electron-window-state`/`electron-store`) for consistency with `minimizeOnLaunch`/`githubToken` and zero new dependencies.
- Chose debounced capture + a `before-quit` flush over save-on-close-only, so a crash or force-quit does not lose geometry and the quit-time DB-close ordering is respected.
- Chose "rectangle overlap with a connected display" as the visibility rule (keeps the window reachable) over "fully contained", which would be too strict for multi-monitor edge placement, and over a single containment point (e.g. top-center), which rejects legitimately-placed oversized windows.
