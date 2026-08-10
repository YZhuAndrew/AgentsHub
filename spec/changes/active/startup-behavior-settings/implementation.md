# Implementation

## Status

- Phase: implement
- Status: complete

## Shipped

- Changed the `minimizeOnLaunch` default from `true` to `false` in
  `apps/desktop/src/renderer/stores/settings/settings-defaults.ts`, so the main
  window opens by default on launch. The main-process reader's `?? false`
  fallback already matches this, so no main-process change was needed.
- Added a new `startupModule` setting (`StartupModule = "last" | DesktopHomeModule`,
  default `"last"`):
  - Type, field, and `setStartupModule` action signature in `settings-types.ts`.
  - Default value in `settings-defaults.ts`.
  - `normalizeStartupModule` whitelisting helper in `settings-normalizers.ts`,
    applied in `normalizeSharedSettingsState` (covers both merge and migrate).
  - `setStartupModule` action (normalizes + syncs to main) in
    `settings-general-actions.ts`, registered in `GeneralActionKey` and the
    action group `satisfies` clause.
- Extracted a pure `resolveStartupAppModule(startupPreference, persistedAppModule)`
  helper in `ui.store.ts` and applied it once in the `App.tsx` startup sequence
  (after `loadSettingsFromMainProcess()`, before `init()`), overriding the
  persisted module only when a concrete preference is set.
- Added a "Startup View" `Select` to `GeneralSettings.tsx` (Startup section),
  with options `"last"` + `DESKTOP_HOME_MODULES`.
- Added i18n keys (`settings.startupModule`, `settings.startupModuleDesc`,
  `settings.startupModuleLast`, `settings.startupModuleOption.*`) to all 7
  locales (`en`, `zh`, `zh-TW`, `ja`, `es`, `de`, `fr`).
- Documented that `launchAtStartup` (OS auto-launch) already exists and is
  reused unchanged; no duplicate control added.

## Verification

- `TEST-STARTUP-001`: `tests/unit/renderer/app-startup-module.test.ts` — the
  pure `resolveStartupAppModule` returns the concrete preference, restores the
  persisted module for `"last"`, and clamps invalid persisted values to
  `"prompt"` (3 tests).
- `TEST-STARTUP-002`: `tests/unit/stores/settings-startup.test.ts` —
  `startupModule` defaults to `"last"`; `setStartupModule` syncs each valid
  value to the main process; an invalid value normalizes to `"last"`
  (added 9 tests; file now 13 tests).
- `TEST-STARTUP-003`: `tests/unit/components/general-settings.test.tsx` — the
  "Startup View" dropdown changes the store from last-used to Agents
  (added 1 test; file now 7 tests).
- `TEST-STARTUP-004`: `tests/unit/main/settings-startup.test.ts` — the
  `getMinimizeOnLaunchSetting` reader still behaves correctly (unchanged, 6
  tests pass; the default flip did not break it because the reader's `?? false`
  fallback is unchanged).
- i18n regression: `tests/unit/services/i18n-init.test.ts` passes (4 tests),
  confirming the 7 locales stay in sync after the new keys.
- Lint: ESLint passes (exit 0) on all changed TS files.
- Targeted Vitest run: `4 test files, 29 tests passed`.

## Analyze

- Traceability complete: yes (`FR-STARTUP-001` -> `DES-STARTUP-001/002/003` ->
  `TEST-STARTUP-001..004` -> `T-STARTUP-001..008`).
- Conflicts/blockers resolved: yes. The `minimizeOnLaunch` default flip was a
  confirmed product decision, recorded as a breaking default change.

## Converge

- Stable workflow/knowledge/rules synced: not required (no user-facing behavior doc beyond in-app UI).
- Issues/releases/ADRs synced: not required.
- Final change destination: `spec/changes/archive/` (pending maintainer archival).
