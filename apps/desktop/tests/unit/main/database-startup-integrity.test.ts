import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";

import { closeDatabase, getDatabase, initDatabase } from "@prompthub/db";
import DatabaseAdapter from "../../../src/main/database/sqlite";

/**
 * Startup integrity-scan budget: opening a healthy, existing database must
 * not quick_check the whole file more than twice (pre-open decision +
 * post-migration verification). The historical implementation ran four
 * scans, dominated cold-start time on large libraries.
 */
describe("database startup integrity scan consolidation", () => {
  const tempDirs: string[] = [];
  let pragmaSpy: ReturnType<typeof spyQuickCheck>;

  function spyQuickCheck() {
    return vi.spyOn(DatabaseAdapter.prototype, "pragma");
  }

  function quickCheckCount(): number {
    return pragmaSpy.mock.calls.filter(([source]) => source === "quick_check")
      .length;
  }

  beforeEach(() => {
    pragmaSpy = spyQuickCheck();
  });

  afterEach(() => {
    pragmaSpy.mockRestore();
    closeDatabase();
    for (const directory of tempDirs.splice(0)) {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });

  function createDatabasePath(): string {
    const root = fs.mkdtempSync(
      path.join(os.tmpdir(), "prompthub-integrity-scan-"),
    );
    tempDirs.push(root);
    return path.join(root, "prompthub.db");
  }

  it("quick-checks a healthy existing database at most twice per open", () => {
    const dbPath = createDatabasePath();

    // First open creates the schema (scan count irrelevant here).
    const first = initDatabase(dbPath);
    first.run(
      "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
      "scan-budget-marker",
      "1",
    );
    closeDatabase();

    pragmaSpy.mockClear();
    const second = initDatabase(dbPath);

    expect(second).toBe(getDatabase());
    expect(quickCheckCount()).toBeLessThanOrEqual(2);
    expect(quickCheckCount()).toBeGreaterThanOrEqual(1);

    // The reopened database is fully usable.
    const marker = second.get(
      "SELECT value FROM settings WHERE key = ?",
      "scan-budget-marker",
    ) as { value: string } | undefined;
    expect(marker?.value).toBe("1");
  });

  it("still detects a corrupted database file", () => {
    const dbPath = createDatabasePath();
    initDatabase(dbPath);
    closeDatabase();

    // Overwrite the file header so quick_check cannot pass.
    const handle = fs.openSync(dbPath, "r+");
    fs.writeSync(handle, Buffer.from("this is not a sqlite database at all"), 0);
    fs.closeSync(handle);

    expect(() => initDatabase(dbPath)).toThrow();
  });
});
