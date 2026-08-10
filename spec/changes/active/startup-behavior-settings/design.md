# Design

## `DES-STARTUP-001`: Reuse `minimizeOnLaunch` with a flipped default

`minimizeOnLaunch` already drives the main-process show/hide decision at launch
(`index.ts` `ready-to-show` handler reads `getMinimizeOnLaunchSetting(appDb)`).
The main-process reader uses `readBooleanSetting(db, "minimizeOnLaunch") ?? false`,
so a user with no persisted row already gets `false` ("show window"). Flipping
the renderer default in `settings-defaults.ts` from `true` to `false` aligns the
renderer's first-write with that fallback and changes the behavior for users who
previously inherited the `true` default without ever toggling it. No main-process
change is required.

## `DES-STARTUP-002`: Add `startupModule` setting + pure startup decision

A new `startupModule` field (`StartupModule = "last" | DesktopHomeModule`,
default `"last"`) is added to the settings store, following the existing
toggle/select pattern:

- `settings-types.ts`: `StartupModule` type, field, and `setStartupModule` action signature.
- `settings-defaults.ts`: `startupModule: "last"`.
- `settings-general-actions.ts`: `setStartupModule` normalizes input via `normalizeStartupModule` and syncs to the main SQLite table.
- `settings-normalizers.ts`: `normalizeStartupModule` whitelists `"last"` and `DESKTOP_HOME_MODULES`, else `"last"`, defending against corrupt persisted values. Applied in `normalizeSharedSettingsState` so both the merge and migrate paths sanitize it.

The startup application is a **pure helper** `resolveStartupAppModule(startupPreference, persistedAppModule)` in `ui.store.ts` so the contract is unit-testable without booting the full `App`. It returns the concrete preference, or the persisted module for `"last"` (clamped via `normalizeAppModule`). `App.tsx` calls it once after `loadSettingsFromMainProcess()` and before `init()`, applying the result to `useUIStore` only when it differs from the current module (avoiding a redundant write and any flash).

## `DES-STARTUP-003`: Reuse `launchAtStartup` unchanged

OS auto-launch is already fully wired (`setLaunchAtStartup` action → preload
`setAutoLaunch` → `app:setAutoLaunch` IPC → `app.setLoginItemSettings`). No
change is made; the change record documents the reuse.

## Affected Areas

- Data model: no DB schema change. `startupModule` is a new key in the existing `settings` key/value table; `minimizeOnLaunch` row value default shifts.
- IPC / API: no new channels. `startupModule` rides the existing `SETTINGS_SET` partial-sync path.
- Filesystem / sync: no change.
- UI / UX: one new `Select` ("Startup View") in Settings → General → Startup, after the "Minimize on Launch" toggle.

## Tradeoffs

- Reusing `minimizeOnLaunch` (inverted semantics) instead of a new `openMainWindowOnLaunch` avoids two opposite toggles in the UI. The cost is a default-value behavior change, which is an intentional product decision.
- The `startupModule` decision lives in a pure helper rather than inline in `App.tsx` to keep it testable and the `App` effect small (per code-quality rules).
- `"last"` is the default so existing users see no change to their startup view; only users who explicitly pick a module are affected.

## Failure And Rollback

- Invalid `startupModule` values are normalized to `"last"` on load and on set, so corrupt data cannot crash the app or land on an invalid module.
- Rollback: revert the `minimizeOnLaunch` default and remove the `startupModule` field/UI/helper. A leftover persisted `startupModule` key is ignored.

## Analyze Result

- Requirement links: `FR-STARTUP-001`
- Verification links: `TEST-STARTUP-001`, `TEST-STARTUP-002`, `TEST-STARTUP-003`, `TEST-STARTUP-004`
- Blocking conflicts: none. The `minimizeOnLaunch` default flip is a confirmed product decision, not a silent override.
- Unresolved `[待确认]`: none.

## Traceability

| Requirement | Design | Verification | Task |
| --- | --- | --- | --- |
| `FR-STARTUP-001` | `DES-STARTUP-001`, `DES-STARTUP-002`, `DES-STARTUP-003` | `TEST-STARTUP-001`, `TEST-STARTUP-002`, `TEST-STARTUP-003`, `TEST-STARTUP-004` | `T-STARTUP-001` through `T-STARTUP-008` |
