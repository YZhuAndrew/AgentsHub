/**
 * @vitest-environment node
 */
import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  getCanonicalSkillWorkspacePath,
  writeCanonicalStorageAuthority,
  writeRuntimeLayoutState,
} from "@prompthub/core";

import {
  closeDatabase,
  initDatabase,
  resetCanonicalWorkspaceReconcileMemo,
  SkillDB,
} from "../../../src/main/database";
import {
  configureRuntimePaths,
  resetRuntimePaths,
} from "../../../src/main/runtime-paths";

describe("desktop initDatabase canonical reconcile memo", () => {
  let root: string;
  let sourcePath: string;

  beforeEach(() => {
    resetCanonicalWorkspaceReconcileMemo();
    root = fs.mkdtempSync(path.join(os.tmpdir(), "prompthub-desktop-memo-"));
    configureRuntimePaths({ userDataPath: root });
    writeRuntimeLayoutState(root);
    writeCanonicalStorageAuthority(root, {
      consistencyId: "d".repeat(64),
      operationId: "desktop-reconcile-memo-test",
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
    const skillDb = new SkillDB(database);
    const created = skillDb.create({
      name: "desktop-memo-skill",
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
