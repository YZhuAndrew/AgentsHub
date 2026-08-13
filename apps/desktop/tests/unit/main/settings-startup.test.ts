/**
 * Tests for settings IPC helpers used by the main process on startup.
 *
 * Issue #115: when the user enables "minimize on launch" in settings, the
 * value must be persisted to the SQLite `settings` table so the main process
 * can read it before the window is shown. Previously the value lived only in
 * the renderer's localStorage (zustand persist), which is invisible to main.
 */

import {
  SCHEMA_TABLES,
  SCHEMA_INDEXES,
} from "../../../src/main/database/schema";
import DatabaseAdapter from "../../../src/main/database/sqlite";
import {
  getMinimizeOnLaunchSetting,
  getShowTrayIconSetting,
} from "../../../src/main/settings/settings-readers";

describe("getMinimizeOnLaunchSetting (issue #115)", () => {
  let rawDb: DatabaseAdapter.Database;

  beforeEach(() => {
    rawDb = new DatabaseAdapter(":memory:");
    rawDb.pragma("journal_mode = WAL");
    rawDb.pragma("foreign_keys = ON");
    rawDb.exec(SCHEMA_TABLES);
    rawDb.exec(SCHEMA_INDEXES);
  });

  afterEach(() => {
    rawDb.close();
  });

  const writeSetting = (key: string, value: unknown) => {
    rawDb
      .prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
      .run(key, JSON.stringify(value));
  };

  it("returns false when the setting has never been written", () => {
    expect(getMinimizeOnLaunchSetting(rawDb)).toBe(false);
  });

  it("returns true when the renderer has persisted true", () => {
    writeSetting("minimizeOnLaunch", true);
    expect(getMinimizeOnLaunchSetting(rawDb)).toBe(true);
  });

  it("returns false when the renderer has persisted false", () => {
    writeSetting("minimizeOnLaunch", false);
    expect(getMinimizeOnLaunchSetting(rawDb)).toBe(false);
  });

  it("returns false for non-boolean persisted values (defensive)", () => {
    // Defensive: the column stores JSON-encoded text; a corrupted row should
    // not cause the window to silently stay hidden.
    writeSetting("minimizeOnLaunch", "maybe");
    expect(getMinimizeOnLaunchSetting(rawDb)).toBe(false);
  });

  it("survives a malformed JSON value without throwing", () => {
    rawDb
      .prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
      .run("minimizeOnLaunch", "{not-json");
    expect(getMinimizeOnLaunchSetting(rawDb)).toBe(false);
  });

  it("is independent from other setting keys", () => {
    writeSetting("launchAtStartup", true);
    writeSetting("minimizeOnLaunch", true);
    writeSetting("autoSave", false);
    expect(getMinimizeOnLaunchSetting(rawDb)).toBe(true);
  });
});

describe("getShowTrayIconSetting", () => {
  let rawDb: DatabaseAdapter.Database;

  beforeEach(() => {
    rawDb = new DatabaseAdapter(":memory:");
    rawDb.pragma("journal_mode = WAL");
    rawDb.pragma("foreign_keys = ON");
    rawDb.exec(SCHEMA_TABLES);
    rawDb.exec(SCHEMA_INDEXES);
  });

  afterEach(() => {
    rawDb.close();
  });

  const writeSetting = (key: string, value: unknown) => {
    rawDb
      .prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
      .run(key, JSON.stringify(value));
  };

  it("defaults to false (off; tray stays minimize-to-tray only)", () => {
    expect(getShowTrayIconSetting(rawDb)).toBe(false);
  });

  it("returns true when the renderer has persisted true", () => {
    writeSetting("showTrayIcon", true);
    expect(getShowTrayIconSetting(rawDb)).toBe(true);
  });

  it("returns false for a non-boolean persisted value (defensive)", () => {
    writeSetting("showTrayIcon", "yes");
    expect(getShowTrayIconSetting(rawDb)).toBe(false);
  });

  it("is independent from minimizeOnLaunch", () => {
    writeSetting("minimizeOnLaunch", true);
    expect(getShowTrayIconSetting(rawDb)).toBe(false);
    writeSetting("showTrayIcon", true);
    expect(getShowTrayIconSetting(rawDb)).toBe(true);
  });
});
