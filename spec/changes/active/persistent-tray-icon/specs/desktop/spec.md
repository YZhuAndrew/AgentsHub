# Spec Delta: persistent status-bar icon toggle

## Added Requirements

### `FR-TRAY-001`: optional persistent status-bar icon

PromptHub MUST provide a persisted "show status-bar icon" setting (default off).
When enabled, the tray/menu-bar icon MUST be created on app launch and remain
present while the window is open. When disabled, the tray MUST behave as before
(created only on minimize-to-tray). The tray MUST exist whenever the persistent
setting OR minimize-to-tray is active; it MUST be destroyed only when both are
inactive. Toggling the setting at runtime MUST create/destroy the tray live
without a restart.

#### Scenario: Enabled — icon shown with window open

- **GIVEN** `showTrayIcon` is enabled and the window is shown normally on launch
- **THEN** the menu-bar/tray icon is present.

#### Scenario: Disabled — preserves prior behavior

- **GIVEN** `showTrayIcon` is disabled (default)
- **THEN** no tray icon appears unless the user minimizes to tray.

#### Scenario: Composes with minimize-to-tray

- **GIVEN** `showTrayIcon` disabled and the window minimized to tray
- **THEN** the tray icon appears; and turning `showTrayIcon` off while not
  minimized destroys the tray.

## Verification

- `TEST-TRAY-001`: `getShowTrayIconSetting` reads the persisted boolean from the
  settings table (default false; true when set; defensive on non-boolean/malformed;
  independent of minimizeOnLaunch).
