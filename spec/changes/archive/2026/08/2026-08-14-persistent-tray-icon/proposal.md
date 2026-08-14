# Persistent status-bar icon toggle

## Phase And Status

- Phase: implement
- Status: ready-for-release (0.7.2)
- Primary requirement: `FR-TRAY-001`

## Why

The tray (macOS menu-bar) icon is created only on minimize-to-tray, so users
who want AgentsHub always reachable from the menu bar — even while the window is
open — cannot get it. Add an opt-in "persistent status bar icon" toggle that
creates the tray on launch regardless of window state.

## Scope

- In scope: a persisted `showTrayIcon` setting (default off) plumbed through the
  shared `Settings` type, renderer settings store, preload bridge, main-process
  reader, and a General settings toggle. When on, the tray is created on
  app launch; toggling creates/destroys it live. The tray exists whenever
  `showTrayIcon || minimizeToTray`.
- Out of scope: changing the tray icon asset, menu, or the minimize-to-tray
  behavior; the restore/backup paths.

## Risks

- Two toggles can both request a tray; creation is idempotent (`if (tray) return`)
  and destroy only runs when BOTH are off, so they compose safely.

## Rollback Thinking

Revert the setting additions + the index.ts tray-create/IPC edits. The setting
defaults to false, so existing users see no behavior change.

## Related Records

- Stable: `spec/knowledge/reference/agent-platforms.md` (tray only by reference)
- Governing: `spec/rules/tdd-design-gate.md`, `spec/rules/submission-traceability-rules.md`
