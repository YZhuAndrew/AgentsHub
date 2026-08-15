import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  closeDatabase,
  initDatabase,
  resetCanonicalWorkspaceReconcileMemo,
} from "../src/database";
import { CanonicalSkillDB } from "../src/canonical-skill-db";
import { getCanonicalSkillWorkspacePath } from "../src/canonical-skill-library";
import {
  configureRuntimePaths,
  resetRuntimePaths,
} from "../src/runtime-paths";
import {
  writeCanonicalStorageAuthority,
  writeRuntimeLayoutState,
} from "../src";

describe("core initDatabase canonical reconcile memo", () => {
  let root: string;
  let sourcePath: string;

  beforeEach(() => {
    resetCanonicalWorkspaceReconcileMemo();
    root = fs.mkdtempSync(path.join(os.tmpdir(), "prompthub-reconcile-memo-"));
    configureRuntimePaths({ userDataPath: root });
    writeRuntimeLayoutState(root);
    writeCanonicalStorageAuthority(root, {
      consistencyId: "d".repeat(64),
      operationId: "reconcile-memo-test",
    });
    sourcePath = path.join(root, "incoming-skill");
    fs.mkdirSync(sourcePath);
    fs.writeFileSync(path.join(sourcePath, "SKILL.md"), "# Initial\n");
  });

  afterEach(() => {
    closeDatabase();
    resetRuntimePaths();
    resetCanonicalWorkspaceReconcileMemo();
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("reconciles once per process for the same data root", () => {
    const database = initDatabase();
    const skillDb = new CanonicalSkillDB(database);
    const created = skillDb.create({
      name: "memo-skill",
      protocol_type: "skill",
      content: "Initial",
      is_favorite: false,
      local_repo_path: sourcePath,
    });
    const workspacePath = getCanonicalSkillWorkspacePath(created.id);
    expect(fs.existsSync(workspacePath)).toBe(true);
    closeDatabase();

    fs.rmSync(workspacePath, { recursive: true, force: true });
    initDatabase();
    expect(fs.existsSync(workspacePath)).toBe(false);

    closeDatabase();
    resetCanonicalWorkspaceReconcileMemo();
    initDatabase();
    expect(fs.existsSync(workspacePath)).toBe(true);
  });
});
