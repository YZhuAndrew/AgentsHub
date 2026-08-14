/**
 * Live capture of the desktop main-window geometry.
 *
 * Owns the resize/move/maximize listeners that keep the persisted window state
 * (`window-state.ts`) in sync, plus the quit-time flush. Extracted from
 * `index.ts` so the main entrypoint does not accumulate window-geometry wiring.
 *
 * The database handle is injected via a getter (`getDb`) because the
 * main-process `appDb` is a mutable module-level binding that can be reopened
 * or nulled (e.g. during a data-directory migration); reading it at event time
 * always sees the current database rather than a stale capture.
 */

import type { BrowserWindow } from "electron";

import type Database from "./database/sqlite";
import { saveWindowState, type WindowState } from "./window-state";

const WINDOW_STATE_SAVE_DEBOUNCE_MS = 500;

// Tracks the last non-maximized bounds so a quit while maximized still records
// the user's normal window size, plus the pending (debounced) save timer.
let windowStateTracker: WindowState | null = null;
let windowStateSaveTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Read the current bounds/maximized flag from the live window, preferring the
 * tracked normal (non-maximized) bounds when the window is maximized so that an
 * un-maximize still returns to the user's chosen size. Returns null if the
 * window is unavailable.
 */
function collectWindowState(win: BrowserWindow): WindowState | null {
  if (win.isDestroyed()) return null;
  const maximized = win.isMaximized();
  const tracked = windowStateTracker;
  if (maximized && tracked) {
    return {
      width: tracked.width,
      height: tracked.height,
      x: tracked.x,
      y: tracked.y,
      maximized: true,
    };
  }
  const { width, height, x, y } = win.getBounds();
  return { width, height, x, y, maximized };
}

/**
 * Schedule a debounced write of the current window state to the settings table.
 * Debouncing coalesces a burst of resize/move events into a single write.
 */
function scheduleWindowStateSave(
  win: BrowserWindow,
  getDb: () => Database.Database | null,
): void {
  if (!getDb()) return;
  const next = collectWindowState(win);
  if (!next) return;
  windowStateTracker = next;
  if (windowStateSaveTimer) {
    clearTimeout(windowStateSaveTimer);
  }
  windowStateSaveTimer = setTimeout(() => {
    windowStateSaveTimer = null;
    const db = getDb();
    if (db) {
      const current = collectWindowState(win);
      if (current) saveWindowState(db, current);
    }
  }, WINDOW_STATE_SAVE_DEBOUNCE_MS);
}

/**
 * Attach the listeners that keep `windowStateTracker` and the persisted state
 * in sync. Seeds the tracker with the window's opening bounds, optionally
 * re-maximizes before the window becomes visible (to avoid a resize flash), and
 * is called once after the window is created.
 */
export function attachWindowStateCapture(
  win: BrowserWindow,
  getDb: () => Database.Database | null,
  options: { maximize?: boolean } = {},
): void {
  // Seed the tracker with the bounds the window actually opened with so the
  // first save (and a quit before any resize) records something sensible.
  windowStateTracker = collectWindowState(win);
  if (options.maximize) {
    win.maximize();
  }
  win.on("resize", () => {
    // Ignore the transient sizes reported while maximized/minimized — we keep
    // the last normal bounds via `windowStateTracker` instead.
    if (!win.isMaximized() && !win.isMinimized()) {
      scheduleWindowStateSave(win, getDb);
    }
  });
  win.on("move", () => {
    if (!win.isMaximized() && !win.isMinimized()) {
      scheduleWindowStateSave(win, getDb);
    }
  });
  win.on("maximize", () => scheduleWindowStateSave(win, getDb));
  win.on("unmaximize", () => scheduleWindowStateSave(win, getDb));
}

/**
 * Flush the latest window state immediately, cancelling any pending debounced
 * write. Called during quit, before the database is closed.
 */
export function flushWindowStateSave(
  win: BrowserWindow,
  getDb: () => Database.Database | null,
): void {
  if (windowStateSaveTimer) {
    clearTimeout(windowStateSaveTimer);
    windowStateSaveTimer = null;
  }
  const db = getDb();
  if (!db) return;
  const current = collectWindowState(win);
  if (current) saveWindowState(db, current);
}
