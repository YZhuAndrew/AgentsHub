import { describe, expect, it, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { PromptDB } from "../../../src/main/database/prompt";
import {
  SCHEMA_TABLES,
  SCHEMA_INDEXES,
} from "../../../src/main/database/schema";
import DatabaseAdapter from "../../../src/main/database/sqlite";
import { closeDatabase, initDatabase } from "@prompthub/db";

/**
 * Hot-path behavior for the prompts table:
 * - the FTS update trigger only rewrites the FTS row when an indexed column
 *   changes (usage_count / is_favorite / current_version updates must not)
 * - PromptDB.create is atomic (prompt row + initial version commit together)
 *
 * These tests use real SQLite so trigger SQL and transaction semantics are
 * exercised for real.
 */

const FTS_INDEXED_COLUMNS = [
  "title",
  "description",
  "system_prompt",
  "user_prompt",
  "tags",
] as const;

const LEGACY_PROMPTS_AU = `CREATE TRIGGER prompts_au AFTER UPDATE ON prompts BEGIN
  INSERT INTO prompts_fts(prompts_fts, rowid, title, description, system_prompt, user_prompt, tags)
  VALUES ('delete', OLD.rowid, OLD.title, OLD.description, OLD.system_prompt, OLD.user_prompt, OLD.tags);
  INSERT INTO prompts_fts(rowid, title, description, system_prompt, user_prompt, tags)
  VALUES (NEW.rowid, NEW.title, NEW.description, NEW.system_prompt, NEW.user_prompt, NEW.tags);
END`;

function getTriggerSql(db: DatabaseAdapter.Database): string {
  const row = db.get(
    "SELECT sql FROM sqlite_master WHERE type = 'trigger' AND name = 'prompts_au'",
  ) as { sql: string } | undefined;
  return (row?.sql ?? "").replace(/\s+/g, " ").trim();
}

describe("prompts FTS update trigger narrowing", () => {
  let rawDb: DatabaseAdapter.Database;
  let db: PromptDB;

  beforeEach(() => {
    rawDb = new DatabaseAdapter(":memory:");
    rawDb.pragma("foreign_keys = ON");
    rawDb.exec(SCHEMA_TABLES);
    rawDb.exec(SCHEMA_INDEXES);
    db = new PromptDB(rawDb);
  });

  afterEach(() => {
    rawDb.close();
  });

  it("defines prompts_au with AFTER UPDATE OF restricted to the FTS indexed columns", () => {
    const triggerSql = getTriggerSql(rawDb);
    expect(triggerSql).toContain("AFTER UPDATE OF");
    for (const column of FTS_INDEXED_COLUMNS) {
      expect(triggerSql).toContain(column);
    }
    expect(triggerSql).not.toMatch(/AFTER\s+UPDATE\s+ON\s+prompts/);
  });

  it("still refreshes the FTS row when an indexed column changes (title)", () => {
    const prompt = db.create({ title: "original-title", userPrompt: "body" });

    db.update(prompt.id, { title: "renamed-title" });

    expect(db.search({ keyword: "renamed-title" }).map((p) => p.id)).toContain(
      prompt.id,
    );
    expect(db.search({ keyword: "original-title" }).map((p) => p.id)).not.toContain(
      prompt.id,
    );
  });

  it("still refreshes the FTS row when tags change via renameTag", () => {
    const prompt = db.create({
      title: "tagged",
      userPrompt: "body",
      tags: ["old-tag"],
    });

    db.renameTag("old-tag", "new-tag");

    expect(db.search({ keyword: "new-tag" }).map((p) => p.id)).toContain(
      prompt.id,
    );
    expect(db.search({ keyword: "old-tag" }).map((p) => p.id)).not.toContain(
      prompt.id,
    );
  });

  it("keeps FTS search working after usage-count and favorite updates", () => {
    const prompt = db.create({ title: "stable-title", userPrompt: "body" });

    db.incrementUsage(prompt.id);
    db.incrementUsage(prompt.id);
    db.update(prompt.id, { isFavorite: true });

    const refreshed = db.getById(prompt.id);
    expect(refreshed?.usageCount).toBe(2);
    expect(refreshed?.isFavorite).toBe(true);
    expect(db.search({ keyword: "stable-title" }).map((p) => p.id)).toContain(
      prompt.id,
    );
  });
});

describe("prompts FTS trigger migration (existing installs)", () => {
  const tempDirs: string[] = [];

  function createLegacyDatabase(dbPath: string): string {
    const adapter = new DatabaseAdapter(dbPath);
    adapter.pragma("foreign_keys = ON");
    adapter.exec(SCHEMA_TABLES);
    adapter.exec(SCHEMA_INDEXES);
    // Recreate the pre-narrowing trigger exactly as older versions shipped it.
    adapter.exec("DROP TRIGGER prompts_au");
    adapter.exec(LEGACY_PROMPTS_AU);
    const legacyDb = new PromptDB(adapter);
    legacyDb.create({ title: "legacy-prompt", userPrompt: "legacy body" });
    adapter.close();
    return dbPath;
  }

  afterEach(() => {
    closeDatabase();
    for (const directory of tempDirs.splice(0)) {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });

  it("replaces the legacy broad trigger on init and records the migration", () => {
    const root = fs.mkdtempSync(
      path.join(os.tmpdir(), "prompthub-fts-trigger-"),
    );
    tempDirs.push(root);
    const dbPath = createLegacyDatabase(path.join(root, "prompthub.db"));

    const migrated = initDatabase(dbPath);

    const triggerSql = getTriggerSql(migrated);
    expect(triggerSql).toContain("AFTER UPDATE OF");
    expect(
      migrated.get(
        "SELECT 1 FROM schema_migrations WHERE name = 'narrow_prompts_fts_update_trigger_v1'",
      ),
    ).toBeTruthy();

    // Indexed-column updates still sync FTS after the migration.
    const legacyPrompt = migrated.get(
      "SELECT id FROM prompts WHERE title = 'legacy-prompt'",
    ) as { id: string };
    const promptDb = new PromptDB(migrated);
    promptDb.update(legacyPrompt.id, { title: "legacy-prompt-renamed" });
    expect(
      promptDb.search({ keyword: "legacy-prompt-renamed" }).map((p) => p.id),
    ).toContain(legacyPrompt.id);
  });

  it("re-running init on a migrated database is idempotent", () => {
    const root = fs.mkdtempSync(
      path.join(os.tmpdir(), "prompthub-fts-trigger-idempotent-"),
    );
    tempDirs.push(root);
    const dbPath = createLegacyDatabase(path.join(root, "prompthub.db"));

    initDatabase(dbPath);
    closeDatabase();
    const reopened = initDatabase(dbPath);

    expect(getTriggerSql(reopened)).toContain("AFTER UPDATE OF");
    expect(
      reopened
        .all(
          "SELECT applied_at FROM schema_migrations WHERE name = 'narrow_prompts_fts_update_trigger_v1'",
        )
        .map((row) => (row as { applied_at: number }).applied_at),
    ).toHaveLength(1);
  });
});

describe("PromptDB.create atomicity", () => {
  let rawDb: DatabaseAdapter.Database;

  beforeEach(() => {
    rawDb = new DatabaseAdapter(":memory:");
    rawDb.pragma("foreign_keys = ON");
    rawDb.exec(SCHEMA_TABLES);
    rawDb.exec(SCHEMA_INDEXES);
  });

  afterEach(() => {
    rawDb.close();
  });

  it("rolls back the prompt row when the initial version insert fails", () => {
    class ExplodingCreateVersionDB extends PromptDB {
      createVersion(): never {
        throw new Error("injected version failure");
      }
    }
    const db = new ExplodingCreateVersionDB(rawDb);

    expect(() =>
      db.create({ title: "doomed", userPrompt: "content" }),
    ).toThrow("injected version failure");

    const remaining = rawDb
      .prepare("SELECT COUNT(*) AS count FROM prompts")
      .get() as { count: number };
    expect(remaining.count).toBe(0);
    const versions = rawDb
      .prepare("SELECT COUNT(*) AS count FROM prompt_versions")
      .get() as { count: number };
    expect(versions.count).toBe(0);
  });

  it("commits prompt and initial version together in the success path", () => {
    const db = new PromptDB(rawDb);
    const prompt = db.create({ title: "atomic", userPrompt: "content" });

    const promptRow = rawDb
      .prepare("SELECT current_version FROM prompts WHERE id = ?")
      .get(prompt.id) as { current_version: number };
    expect(promptRow.current_version).toBe(1);
    expect(db.getVersions(prompt.id)).toHaveLength(1);
  });
});
