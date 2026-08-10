# Tasks

- [x] `T-STARTUP-001` Flip `minimizeOnLaunch` default from `true` to `false` in `settings-defaults.ts`
- [x] `T-STARTUP-002` Add `StartupModule` type, `startupModule` field, and `setStartupModule` action signature in `settings-types.ts`; default `"last"` in `settings-defaults.ts`
- [x] `T-STARTUP-003` Add `normalizeStartupModule` and apply it in `normalizeSharedSettingsState`; add `setStartupModule` action in `settings-general-actions.ts`
- [x] `T-STARTUP-004` Extract pure `resolveStartupAppModule` helper in `ui.store.ts` and apply it once in the `App.tsx` startup sequence
- [x] `T-STARTUP-005` Add the "Startup View" `Select` to `GeneralSettings.tsx`
- [x] `T-STARTUP-006` Add i18n keys to all 7 locale files
- [x] `T-STARTUP-007` Add regression tests (settings-startup, general-settings, app-startup-module) and confirm main/settings-startup still passes
- [x] `T-STARTUP-008` Run targeted tests and lint; record verification
