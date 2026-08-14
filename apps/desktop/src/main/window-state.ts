/**
 * Persist and restore the desktop main-window geometry.
 *
 * Window bounds live in the existing SQLite `settings` table under the
 * `windowState` key. This module is intentionally free of any Electron
 * dependency: the set of connected displays is injected by the caller
 * (`index.ts` passes `screen.getAllDisplays()`), which keeps the validation
 * and storage logic fully unit-testable with a real `:memory:` database.
 */

import type Database from "./database/sqlite";

// ── Types ────────────────────────────────────────────────────────────────────

/** Minimal rectangle shape (compatible with Electron's `Rectangle`). */
export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Minimal display shape consumed by the visibility/clamp logic. Electron's
 * `screen.Display` is structurally assignable to this, so callers can pass
 * `screen.getAllDisplays()` directly.
 */
export interface DisplayInfo {
  bounds: Rectangle;
  workArea: Rectangle;
}

/** Persisted window geometry. */
export interface WindowState {
  width: number;
  height: number;
  x: number;
  y: number;
  maximized: boolean;
}

/**
 * Bounds to apply when constructing the window. `x`/`y` are omitted for the
 * default fallback so the OS centers the window; when present they restore the
 * saved position.
 */
export interface ResolvedBounds {
  width: number;
  height: number;
  x?: number;
  y?: number;
  maximized: boolean;
}

// ── Constants ────────────────────────────────────────────────────────────────

export const WINDOW_STATE_KEY = "windowState";

/** Must stay in sync with the `BrowserWindow` minWidth/minHeight options. */
export const DEFAULT_WINDOW_WIDTH = 1200;
export const DEFAULT_WINDOW_HEIGHT = 800;
export const MIN_WINDOW_WIDTH = 800;
export const MIN_WINDOW_HEIGHT = 600;

type RawSettingsRow = { value: string } | undefined;

// ── Validation ───────────────────────────────────────────────────────────────

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Structural validity only: all five fields present with the right primitive
 * types and positive dimensions. Size clamping against the min window size and
 * the target display happens later in `resolveInitialBounds`, so an unusually
 * small saved size is repaired rather than discarded wholesale.
 */
function isValidState(value: unknown): value is WindowState {
  if (!value || typeof value !== "object") return false;
  // After the object guard above, field access requires narrowing to a record.
  // `isValidState` is a type guard, so this cast is local and bounded by the
  // boolean checks that follow; it never widens the public return type.
  const state = value as Record<string, unknown>;
  return (
    isFiniteNumber(state.width) &&
    isFiniteNumber(state.height) &&
    isFiniteNumber(state.x) &&
    isFiniteNumber(state.y) &&
    typeof state.maximized === "boolean" &&
    state.width > 0 &&
    state.height > 0
  );
}

// ── Storage ──────────────────────────────────────────────────────────────────

export function readWindowState(db: Database.Database): WindowState | null {
  try {
    // The SQLite driver types `.get()` as `unknown`; this cast maps the row
    // shape to the expected `{ value } | undefined` contract.
    const row = db
      .prepare("SELECT value FROM settings WHERE key = ?")
      .get(WINDOW_STATE_KEY) as RawSettingsRow;
    if (!row) {
      return null;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(row.value);
    } catch {
      return null;
    }

    return isValidState(parsed) ? parsed : null;
  } catch (error) {
    console.error(`Failed to read ${WINDOW_STATE_KEY} setting:`, error);
    return null;
  }
}

export function saveWindowState(db: Database.Database, state: WindowState): void {
  try {
    db.prepare(
      "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
    ).run(WINDOW_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    // Window geometry is non-critical UX state. A failed write must never
    // propagate into a resize/move/quit handler and destabilize the app; the
    // worst case is the next launch using the default centered window.
    console.error(`Failed to persist ${WINDOW_STATE_KEY} setting:`, error);
  }
}

// ── Display geometry ─────────────────────────────────────────────────────────

/**
 * True when the window overlaps at least one connected display. Using overlap
 * instead of a single containment point handles windows wider/taller than a
 * single monitor (whose center would otherwise land outside that monitor)
 * while still rejecting windows saved fully off-screen or on a now-disconnected
 * monitor, so we fall back to a visible centered default instead of trapping
 * the window.
 */
export function isBoundsVisible(
  bounds: Rectangle,
  displays: DisplayInfo[],
): boolean {
  return findVisibleDisplay(bounds, displays) !== null;
}

function rectanglesOverlap(a: Rectangle, b: Rectangle): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function findVisibleDisplay(
  bounds: Rectangle,
  displays: DisplayInfo[],
): DisplayInfo | null {
  for (const display of displays) {
    if (rectanglesOverlap(bounds, display.bounds)) {
      return display;
    }
  }
  return null;
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function defaultBounds(): ResolvedBounds {
  return {
    width: DEFAULT_WINDOW_WIDTH,
    height: DEFAULT_WINDOW_HEIGHT,
    maximized: false,
  };
}

// ── Resolution ───────────────────────────────────────────────────────────────

/**
 * Resolve the bounds to apply when creating the window.
 *
 * Reads saved state, checks it against the currently connected displays
 * (injected so this stays testable without Electron), clamps oversized
 * dimensions to the target display's work area, and otherwise falls back to the
 * default centered window.
 */
export function resolveInitialBounds(
  db: Database.Database,
  getDisplays: () => DisplayInfo[],
): ResolvedBounds {
  const saved = readWindowState(db);
  if (!saved) {
    return defaultBounds();
  }

  let displays: DisplayInfo[];
  try {
    displays = getDisplays();
  } catch (error) {
    // If the display enumeration itself fails (rare platform quirk), prefer a
    // safe default over a crash during window creation.
    console.error("Failed to enumerate displays for window-state restore:", error);
    return defaultBounds();
  }

  const target = findVisibleDisplay(saved, displays);
  if (!target) {
    return defaultBounds();
  }

  const workArea = target.workArea;
  return {
    width: clamp(
      Math.round(saved.width),
      MIN_WINDOW_WIDTH,
      Math.max(MIN_WINDOW_WIDTH, workArea.width),
    ),
    height: clamp(
      Math.round(saved.height),
      MIN_WINDOW_HEIGHT,
      Math.max(MIN_WINDOW_HEIGHT, workArea.height),
    ),
    x: Math.round(saved.x),
    y: Math.round(saved.y),
    maximized: saved.maximized,
  };
}
