# Implementation: persistent status-bar icon toggle

Status: implemented; pending 0.7.2 release.

## What shipped

- `packages/shared/types/settings.ts`: added `showTrayIcon?: boolean` to the
  shared `Settings` type (so it syncs to the main DB).
- Renderer settings store:
  - `settings-types.ts`: `showTrayIcon: boolean` + `setShowTrayIcon` action.
  - `settings-defaults.ts`: default `false`.
  - `settings-general-actions.ts`: `setShowTrayIcon` action (calls
    `window.electron.setShowTrayIcon` + syncs) + added to `GeneralActionKey`.
  - `settings.store.ts`: load-from-main merge + sync-if-missing guard.
- `preload/index.ts`: `setShowTrayIcon(enabled)` + type declaration.
- Main:
  - `settings-readers.ts`: `getShowTrayIconSetting(db)`.
  - `index.ts`: `showTrayIcon` var; on `ready-to-show` read the setting and
    `createTray()` when on (independent of the minimize path); `app:setShowTrayIcon`
    IPC (create on enable, destroy only when `minimizeToTray` also off); the
    existing `app:setMinimizeToTray` destroy now respects `showTrayIcon`.
- UI: `GeneralSettings.tsx` toggle next to "Minimize on Launch".
- i18n: `settings.showTrayIcon` + `settings.showTrayIconDesc` in all 7 locales.

## Tray composition rule

Tray exists when `showTrayIcon || minimizeToTray`. `createTray()` is idempotent;
`destroyTray()` runs only when both flags are off. Both toggles' IPC handlers
honor this.

## Verification

- `vitest settings-startup.test.ts`: 10/10 (added `getShowTrayIconSetting`
  cases: default false, true when persisted, defensive on non-boolean,
  independent of minimizeOnLaunch).
- `eslint --max-warnings 0` + `tsc` on changed files: clean (only the
  pre-existing unrelated `startupModule` TS error remains).

## Notes

- Default off — existing users see no change; the menu-bar icon remains
  minimize-to-tray only until they opt in.
