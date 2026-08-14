# Spec Delta: Desktop Window Geometry

## Added Requirements

### `FR-WINSTATE-001`: Restore main-window geometry across relaunch

The desktop app MUST restore the main window's size, on-screen position, and
maximized state to the values in effect when the app was last closed.

#### Scenario: Restore after normal close and reopen

- **GIVEN** the user has resized/moved and optionally maximized the main window and then quit the app
- **WHEN** the app is launched again
- **THEN** the main window opens at the saved size and position
- **AND** if it was maximized when closed, it opens maximized and un-maximizes back to the saved normal size.

#### Scenario: First launch and missing state

- **GIVEN** no `windowState` has ever been persisted
- **WHEN** the app launches
- **THEN** the window opens at the default size (`1200×800`) centered by the OS, not maximized.

#### Scenario: Off-screen or invalid saved state

- **GIVEN** a persisted `windowState` whose position lies outside all currently connected displays, or whose stored value is malformed/out of range
- **WHEN** the app launches
- **THEN** the window falls back to the default size and an OS-centered position instead of appearing off-screen.

#### Scenario: Persistence survives DB-only resets

- **GIVEN** geometry was saved to the SQLite `settings` table
- **WHEN** the app relaunches even if the renderer's localStorage is cleared
- **THEN** the saved geometry is still restored, because the main process reads it from SQLite.

## Modified Requirements

- None.

## Removed Requirements

- None.

## Verification

- `TEST-WINSTATE-001` (unit, real SQLite): `saveWindowState` then `readWindowState` round-trips the exact state.
- `TEST-WINSTATE-002` (unit): `readWindowState` returns `null` for missing key, malformed JSON, wrong types, non-finite numbers, and out-of-range sizes.
- `TEST-WINSTATE-003` (unit): `isBoundsVisible` is true for on-screen top-center, false for fully off-screen and for a disconnected second monitor not present in the display list.
- `TEST-WINSTATE-004` (unit): `resolveInitialBounds` restores valid+visible state, falls back to defaults (no `x`/`y`) for off-screen/missing, clamps oversized dimensions, and propagates `maximized` only when the state is usable.
- `TEST-WINSTATE-005` (unit): two saves keep the second; write failures do not throw into callers.
