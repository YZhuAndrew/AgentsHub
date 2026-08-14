# General Settings Delta Spec

## Modified Requirements

### Requirement: The main window must open by default when the app launches

The `minimizeOnLaunch` setting controls whether the app starts hidden to the
system tray. Its default changes from `true` (start hidden) to `false` (show the
window), so a fresh install and any user who never toggled the preference now
see the main window on launch. Users can still enable "minimize on launch" to
start hidden. The OS-level hidden signals (`--hidden` argv on Windows,
`wasOpenedAsHidden` on macOS) still take precedence over the setting.

#### Scenario: First launch shows the main window

- Given a fresh install with no persisted `minimizeOnLaunch` value
- When the app launches
- Then the main window is shown (not hidden to tray)

#### Scenario: User who opted into minimize still starts hidden

- Given the user enabled "Minimize on Launch" in Settings
- When the app launches
- Then the app starts hidden to tray, as before

## Added Requirements

### Requirement: Users can choose which home view opens at startup

PromptHub must provide a `startupModule` setting (default `"last"`) that
selects which home module is active when the app starts. Valid concrete values
are the `DESKTOP_HOME_MODULES`: `prompt`, `agents`, `skill`, `mcp`, `plugin`,
`rules`. The value `"last"` restores the module that was active when the app
last closed (the existing `ui.store` persistence behavior).

#### Scenario: User picks Agents as the startup view

- Given the user sets the "Startup View" setting to Agents
- When the app launches
- Then the home view is Agents, regardless of which module was last active

#### Scenario: Default restores the last-used view

- Given the "Startup View" setting is "Last used" (the default)
- And the user last had Skills open
- When the app launches
- Then the home view is Skills

#### Scenario: Invalid persisted value falls back safely

- Given the settings table contains a corrupt `startupModule` value
- When settings are loaded
- Then `startupModule` is normalized to `"last"`
- And the app starts on the last-used module rather than crashing

### Requirement: Users can control OS auto-launch (existing)

The `launchAtStartup` setting (default off) already toggles OS auto-launch at
login via Electron's `setLoginItemSettings`. This change reuses it unchanged and
does not introduce a duplicate control.

#### Scenario: User enables launch-at-startup

- Given the user enables "Launch at Startup"
- Then the OS login item is registered and the app launches on the next system login
