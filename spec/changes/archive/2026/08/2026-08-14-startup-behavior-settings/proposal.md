# Proposal

## Phase And Status

- Phase: implement
- Status: complete
- Primary requirement: `FR-STARTUP-001`
- Exit condition: Users can choose whether the main window opens on launch (default: open), choose which home view opens on startup (default: last used), and control OS auto-launch (already shipped as `launchAtStartup`). All three are visible in Settings → General → Startup, persisted to the main SQLite settings table, and covered by regression tests.

## Why

Users want to control three distinct startup behaviors that the desktop app
currently hard-codes or omits:

1. Whether the main window appears on launch. The existing `minimizeOnLaunch`
   setting defaulted to `true` (start hidden to tray), which surprised users
   who expected the window to appear. The default should be "show the window".
2. Which home view (Prompts, Agents, Skills, MCP, Plugins, Rules, or last used)
   opens at startup. There was no setting for this; the app only restored the
   last-used module via `ui.store`.
3. Whether the app auto-launches at system login. This already exists as
   `launchAtStartup` (default off) and is reused unchanged.

## Scope

- In scope:
  - Change `minimizeOnLaunch` default from `true` to `false` (setting 1, reuse).
  - Add a new `startupModule` setting (default `"last"`) with a Settings UI dropdown and a pure `resolveStartupAppModule` decision applied once during app startup (setting 2).
  - Document that `launchAtStartup` already implements OS auto-launch and is reused unchanged (setting 3).
  - i18n keys in all 7 locales; regression tests.
- Out of scope:
  - No new `openMainWindowOnLaunch` flag (reuse `minimizeOnLaunch` to avoid two opposite-meaning toggles).
  - No change to the main-process `getMinimizeOnLaunchSetting` reader (its `?? false` fallback already yields "show window" for users who never set the key).
  - No change to `launchAtStartup` behavior or its OS integration.
  - No settings version bump (`mergeSettingsState` spreads defaults over persisted state, so new/missing keys resolve automatically).

## Risks

- **Breaking default change**: `minimizeOnLaunch` default flipped from `true` to `false`. New users and any existing user who never toggled the setting will now see the window on launch instead of starting hidden to tray. This is an intentional, user-confirmed product decision. Rollback is a one-line revert.
- `startupModule` interacts with the `ui.store` persistence of `appModule`. The `resolveStartupAppModule` helper is applied exactly once during the startup `useEffect`, before the first home render, so a concrete preference overrides the persisted module without a visible flash, while `"last"` leaves the existing restore behavior untouched.
- The setting is stored to SQLite via `syncSettingsToMain`, so the value survives reloads and is available even if the renderer's localStorage is cleared.

## Rollback Thinking

- `minimizeOnLaunch`: revert the default in `settings-defaults.ts` from `false` back to `true`. No migration needed.
- `startupModule`: removing the field, the UI dropdown, and the `resolveStartupAppModule` call reverts to the previous "restore last module" behavior. The persisted key is harmless if left in place (ignored).

## Related Records

- Stable docs: none updated (no user-facing behavior doc for these settings beyond in-app UI).
- Related existing setting: `launchAtStartup` (unchanged, reused).
