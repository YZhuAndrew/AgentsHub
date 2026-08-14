/**
 * Tests for desktop window-geometry persistence (FR-WINSTATE-001).
 *
 * The main window used to always open at a hard-coded 1200x800 with no
 * remembered position. `window-state.ts` now persists {width,height,x,y,
 * maximized} to the SQLite `settings` table and restores it on launch, while
 * defending against off-screen / disconnected-monitor / malformed saved data.
 *
 * Coverage focus:
 *   - Real SQLite round-trip (no mocks).
 *   - Malformed / wrong-type / out-of-range rejection.
 *   - Display visibility (on-screen, off-screen, disconnected monitor).
 *   - resolveInitialBounds restore vs fallback vs clamp behavior.
 *   - Write failures must never throw into callers.
 */

import {
  SCHEMA_TABLES,
  SCHEMA_INDEXES,
} from "../../../src/main/database/schema";
import DatabaseAdapter from "../../../src/main/database/sqlite";
import {
  WINDOW_STATE_KEY,
  readWindowState,
  saveWindowState,
  isBoundsVisible,
  resolveInitialBounds,
  DEFAULT_WINDOW_WIDTH,
  DEFAULT_WINDOW_HEIGHT,
  MIN_WINDOW_WIDTH,
  MIN_WINDOW_HEIGHT,
  type DisplayInfo,
} from "../../../src/main/window-state";

describe("window-state (FR-WINSTATE-001)", () => {
  let rawDb: DatabaseAdapter.Database;

  beforeEach(() => {
    rawDb = new DatabaseAdapter(":memory:");
    rawDb.pragma("journal_mode = WAL");
    rawDb.pragma("foreign_keys = ON");
    rawDb.exec(SCHEMA_TABLES);
    rawDb.exec(SCHEMA_INDEXES);
  });

  afterEach(() => {
    // A test may close the db intentionally to exercise error paths.
    try {
      rawDb.close();
    } catch {
      // already closed
    }
  });

  const writeJson = (key: string, value: unknown) => {
    rawDb
      .prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
      .run(key, JSON.stringify(value));
  };

  const writeRaw = (key: string, rawValue: string) => {
    rawDb
      .prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
      .run(key, rawValue);
  };

  // A representative single-monitor setup (primary) plus a right-hand monitor.
  const primary: DisplayInfo = {
    bounds: { x: 0, y: 0, width: 1920, height: 1080 },
    workArea: { x: 0, y: 40, width: 1920, height: 1040 },
  };
  const secondary: DisplayInfo = {
    bounds: { x: 1920, y: 0, width: 1280, height: 1024 },
    workArea: { x: 1920, y: 0, width: 1280, height: 1024 },
  };

  // ── readWindowState ──────────────────────────────────────────────────────

  describe("readWindowState", () => {
    it("returns null when nothing has been persisted", () => {
      expect(readWindowState(rawDb)).toBeNull();
    });

    it("round-trips a valid state", () => {
      const state = { width: 1200, height: 800, x: 100, y: 80, maximized: false };
      writeJson(WINDOW_STATE_KEY, state);
      expect(readWindowState(rawDb)).toEqual(state);
    });

    it("tolerates unknown extra keys in the persisted object", () => {
      writeJson(WINDOW_STATE_KEY, {
        width: 1400,
        height: 900,
        x: 10,
        y: 20,
        maximized: true,
        extra: "ignored",
      });
      expect(readWindowState(rawDb)).toEqual({
        width: 1400,
        height: 900,
        x: 10,
        y: 20,
        maximized: true,
        extra: "ignored",
      });
    });

    it.each([
      ["malformed JSON", () => writeRaw(WINDOW_STATE_KEY, "{not-json")],
      ["JSON string", () => writeJson(WINDOW_STATE_KEY, "hello")],
      ["JSON number", () => writeJson(WINDOW_STATE_KEY, 42)],
      ["JSON null", () => writeJson(WINDOW_STATE_KEY, null)],
      ["JSON array", () => writeJson(WINDOW_STATE_KEY, [1, 2, 3])],
      [
        "missing width",
        () => writeJson(WINDOW_STATE_KEY, { height: 800, x: 0, y: 0, maximized: false }),
      ],
      [
        "missing maximized",
        () => writeJson(WINDOW_STATE_KEY, { width: 1200, height: 800, x: 0, y: 0 }),
      ],
      [
        "width as string",
        () => writeJson(WINDOW_STATE_KEY, { width: "1200", height: 800, x: 0, y: 0, maximized: false }),
      ],
      [
        "height as boolean",
        () => writeJson(WINDOW_STATE_KEY, { width: 1200, height: true, x: 0, y: 0, maximized: false }),
      ],
      [
        "x as null",
        () => writeJson(WINDOW_STATE_KEY, { width: 1200, height: 800, x: null, y: 0, maximized: false }),
      ],
      [
        "maximized as string",
        () => writeJson(WINDOW_STATE_KEY, { width: 1200, height: 800, x: 0, y: 0, maximized: "true" }),
      ],
      [
        "maximized as number",
        () => writeJson(WINDOW_STATE_KEY, { width: 1200, height: 800, x: 0, y: 0, maximized: 1 }),
      ],
      [
        "NaN width",
        () => writeJson(WINDOW_STATE_KEY, { width: NaN, height: 800, x: 0, y: 0, maximized: false }),
      ],
      [
        "Infinity height",
        () => writeJson(WINDOW_STATE_KEY, { width: 1200, height: Infinity, x: 0, y: 0, maximized: false }),
      ],
      [
        "zero width",
        () => writeJson(WINDOW_STATE_KEY, { width: 0, height: 800, x: 0, y: 0, maximized: false }),
      ],
      [
        "negative height",
        () => writeJson(WINDOW_STATE_KEY, { width: 1200, height: -1, x: 0, y: 0, maximized: false }),
      ],
    ])("returns null for invalid persisted value: %s", (_label, seed) => {
      seed();
      expect(readWindowState(rawDb)).toBeNull();
    });

    it("returns null (without throwing) when the database is closed", () => {
      writeJson(WINDOW_STATE_KEY, { width: 1200, height: 800, x: 0, y: 0, maximized: false });
      rawDb.close();
      expect(() => readWindowState(rawDb)).not.toThrow();
      expect(readWindowState(rawDb)).toBeNull();
    });
  });

  // ── saveWindowState ──────────────────────────────────────────────────────

  describe("saveWindowState", () => {
    it("writes a single JSON row that readWindowState returns", () => {
      const state = { width: 1280, height: 720, x: 50, y: 50, maximized: true };
      saveWindowState(rawDb, state);

      const row = rawDb
        .prepare("SELECT value FROM settings WHERE key = ?")
        .get(WINDOW_STATE_KEY) as { value: string };
      expect(JSON.parse(row.value)).toEqual(state);
      expect(readWindowState(rawDb)).toEqual(state);
    });

    it("a second save overwrites the first", () => {
      saveWindowState(rawDb, { width: 1000, height: 700, x: 1, y: 1, maximized: false });
      const next = { width: 1600, height: 1000, x: 200, y: 150, maximized: true };
      saveWindowState(rawDb, next);
      expect(readWindowState(rawDb)).toEqual(next);
    });

    it("does not throw when the database is closed", () => {
      rawDb.close();
      expect(() =>
        saveWindowState(rawDb, { width: 1200, height: 800, x: 0, y: 0, maximized: false }),
      ).not.toThrow();
    });
  });

  // ── isBoundsVisible ──────────────────────────────────────────────────────

  describe("isBoundsVisible", () => {
    it("is true when the window overlaps a display", () => {
      expect(
        isBoundsVisible({ x: 100, y: 100, width: 1200, height: 800 }, [primary]),
      ).toBe(true);
    });

    it("is false when the window is fully off-screen", () => {
      expect(
        isBoundsVisible({ x: -5000, y: -5000, width: 1200, height: 800 }, [primary]),
      ).toBe(false);
    });

    it("is false when the saved monitor is not in the connected list", () => {
      // Window lives on the secondary monitor, but only the primary is connected.
      expect(
        isBoundsVisible({ x: 2200, y: 100, width: 900, height: 700 }, [primary]),
      ).toBe(false);
    });

    it("is true when the window overlaps the second of multiple displays", () => {
      // Starts exactly at the secondary monitor's left edge.
      expect(
        isBoundsVisible({ x: 1920, y: 100, width: 800, height: 700 }, [primary, secondary]),
      ).toBe(true);
    });

    it("is true for a window wider than a single monitor as long as it overlaps", () => {
      // A 5000px-wide window anchored on the primary still reaches the display.
      expect(
        isBoundsVisible({ x: 100, y: 80, width: 5000, height: 3000 }, [primary]),
      ).toBe(true);
    });

    it("is false when the window only abuts a display edge without overlapping", () => {
      // Starts exactly at x = 1920 (primary's right edge): no overlap with primary.
      expect(
        isBoundsVisible({ x: 1920, y: 100, width: 800, height: 700 }, [primary]),
      ).toBe(false);
    });

    it("is false for an empty display list", () => {
      expect(
        isBoundsVisible({ x: 100, y: 100, width: 1200, height: 800 }, []),
      ).toBe(false);
    });
  });

  // ── resolveInitialBounds ─────────────────────────────────────────────────

  describe("resolveInitialBounds", () => {
    it("restores a valid, visible state and preserves maximized", () => {
      saveWindowState(rawDb, { width: 1200, height: 800, x: 100, y: 80, maximized: true });
      expect(resolveInitialBounds(rawDb, () => [primary])).toEqual({
        width: 1200,
        height: 800,
        x: 100,
        y: 80,
        maximized: true,
      });
    });

    it("rounds fractional saved dimensions", () => {
      saveWindowState(rawDb, { width: 1200.6, height: 799.4, x: 10.7, y: 20.2, maximized: false });
      expect(resolveInitialBounds(rawDb, () => [primary])).toEqual({
        width: 1201,
        height: 799,
        x: 11,
        y: 20,
        maximized: false,
      });
    });

    it("clamps an oversized window to the target display work area", () => {
      saveWindowState(rawDb, { width: 5000, height: 3000, x: 100, y: 80, maximized: false });
      expect(resolveInitialBounds(rawDb, () => [primary])).toEqual({
        width: primary.workArea.width, // 1920
        height: primary.workArea.height, // 1040
        x: 100,
        y: 80,
        maximized: false,
      });
    });

    it("raises an undersized window up to the minimum size", () => {
      saveWindowState(rawDb, { width: 500, height: 400, x: 100, y: 80, maximized: false });
      expect(resolveInitialBounds(rawDb, () => [primary])).toEqual({
        width: MIN_WINDOW_WIDTH,
        height: MIN_WINDOW_HEIGHT,
        x: 100,
        y: 80,
        maximized: false,
      });
    });

    it("falls back to the default centered window when nothing is saved", () => {
      const result = resolveInitialBounds(rawDb, () => [primary]);
      expect(result).toEqual({
        width: DEFAULT_WINDOW_WIDTH,
        height: DEFAULT_WINDOW_HEIGHT,
        maximized: false,
      });
      expect(result.x).toBeUndefined();
      expect(result.y).toBeUndefined();
    });

    it("falls back to defaults when the saved position is off-screen", () => {
      saveWindowState(rawDb, { width: 1200, height: 800, x: -3000, y: -3000, maximized: true });
      const result = resolveInitialBounds(rawDb, () => [primary]);
      expect(result).toEqual({
        width: DEFAULT_WINDOW_WIDTH,
        height: DEFAULT_WINDOW_HEIGHT,
        maximized: false,
      });
      expect(result.x).toBeUndefined();
    });

    it("falls back to defaults when no displays are connected", () => {
      saveWindowState(rawDb, { width: 1200, height: 800, x: 100, y: 80, maximized: true });
      expect(resolveInitialBounds(rawDb, () => [])).toEqual({
        width: DEFAULT_WINDOW_WIDTH,
        height: DEFAULT_WINDOW_HEIGHT,
        maximized: false,
      });
    });

    it("falls back to defaults when display enumeration throws", () => {
      saveWindowState(rawDb, { width: 1200, height: 800, x: 100, y: 80, maximized: true });
      const crashing = () => {
        throw new Error("screen unavailable");
      };
      expect(resolveInitialBounds(rawDb, crashing)).toEqual({
        width: DEFAULT_WINDOW_WIDTH,
        height: DEFAULT_WINDOW_HEIGHT,
        maximized: false,
      });
    });

    it("restores across multi-monitor layouts using the owning display's work area", () => {
      // On the secondary monitor; secondary work area is smaller (1280x1024).
      saveWindowState(rawDb, { width: 4000, height: 2500, x: 1920, y: 100, maximized: false });
      expect(resolveInitialBounds(rawDb, () => [primary, secondary])).toEqual({
        width: secondary.workArea.width, // 1280
        height: secondary.workArea.height, // 1024
        x: 1920,
        y: 100,
        maximized: false,
      });
    });
  });
});
