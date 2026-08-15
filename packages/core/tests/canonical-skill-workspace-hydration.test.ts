import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { DatabaseAdapter, SCHEMA } from "@prompthub/db";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { CanonicalSkillDB } from "../src/canonical-skill-db";
import {
  getCanonicalSkillWorkspacePath,
  hydrateCanonicalSkillWorkspace,
} from "../src/canonical-skill-library";
import { configureRuntimePaths, resetRuntimePaths } from "../src/runtime-paths";
import {
  writeCanonicalStorageAuthority,
  writeRuntimeLayoutState,
} from "../src";

function writeWorkspaceSentinel(workspacePath: string): string {
  const sentinelPath = path.join(workspacePath, "hydration-sentinel.txt");
  fs.writeFileSync(sentinelPath, "sentinel");
  return sentinelPath;
}

describe("canonical Skill workspace hydration change detection", () => {
  let root: string;
  let database: DatabaseAdapter.Database;
  let skillDb: CanonicalSkillDB;
  let sourcePath: string;
  let skillId: string;
  let workspacePath: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "prompthub-hydration-"));
    configureRuntimePaths({ userDataPath: root });
    writeRuntimeLayoutState(root);
    writeCanonicalStorageAuthority(root, {
      consistencyId: "d".repeat(64),
      operationId: "hydration-test",
    });
    database = new DatabaseAdapter(":memory:");
    database.exec(SCHEMA);
    skillDb = new CanonicalSkillDB(database);
    sourcePath = path.join(root, "incoming-skill");
    fs.mkdirSync(sourcePath);
    fs.writeFileSync(path.join(sourcePath, "SKILL.md"), "# Initial\n");
    const created = skillDb.create({
      name: "hydration-skill",
      protocol_type: "skill",
      content: "Initial",
      is_favorite: false,
      local_repo_path: sourcePath,
    });
    skillId = created.id;
    workspacePath = getCanonicalSkillWorkspacePath(skillId);
    expect(fs.readFileSync(path.join(workspacePath, "SKILL.md"), "utf8")).toBe(
      "# Initial\n",
    );
  });

  afterEach(() => {
    database.close();
    resetRuntimePaths();
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("keeps an unchanged workspace intact instead of re-materializing it", () => {
    const sentinelPath = writeWorkspaceSentinel(workspacePath);

    const result = hydrateCanonicalSkillWorkspace(skillId);

    expect(result).toBe(workspacePath);
    expect(fs.existsSync(sentinelPath)).toBe(true);
    expect(fs.readFileSync(path.join(workspacePath, "SKILL.md"), "utf8")).toBe(
      "# Initial\n",
    );
  });

  it("re-materializes the workspace when the marker hash goes stale", () => {
    const sentinelPath = writeWorkspaceSentinel(workspacePath);
    fs.writeFileSync(
      path.join(workspacePath, ".canonical-bundle-hash"),
      "0".repeat(64),
    );

    const result = hydrateCanonicalSkillWorkspace(skillId);

    expect(result).toBe(workspacePath);
    expect(fs.existsSync(sentinelPath)).toBe(false);
    expect(fs.readFileSync(path.join(workspacePath, "SKILL.md"), "utf8")).toBe(
      "# Initial\n",
    );
  });

  it("re-materializes the workspace when the marker is missing", () => {
    const sentinelPath = writeWorkspaceSentinel(workspacePath);
    fs.rmSync(path.join(workspacePath, ".canonical-bundle-hash"));

    const result = hydrateCanonicalSkillWorkspace(skillId);

    expect(result).toBe(workspacePath);
    expect(fs.existsSync(sentinelPath)).toBe(false);
    expect(
      fs.existsSync(path.join(workspacePath, ".canonical-bundle-hash")),
    ).toBe(true);
  });

  it("picks up new bundle content after a republish", () => {
    fs.writeFileSync(path.join(workspacePath, "SKILL.md"), "# Edited\n");
    skillDb.update(skillId, {
      content: "Edited",
      directory_fingerprint: "f".repeat(64),
    });

    expect(
      fs.readFileSync(path.join(workspacePath, "SKILL.md"), "utf8"),
    ).toBe("# Edited\n");
    expect(
      fs.existsSync(path.join(workspacePath, ".canonical-bundle-hash")),
    ).toBe(true);
  });
});
