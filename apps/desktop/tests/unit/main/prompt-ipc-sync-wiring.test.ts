import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { IPC_CHANNELS } from "@prompthub/shared/constants/ipc-channels";
import DatabaseAdapter from "../../../src/main/database/sqlite";
import { FolderDB } from "../../../src/main/database/folder";
import { PromptDB } from "../../../src/main/database/prompt";
import { PromptOutputFormatDB } from "../../../src/main/database";
import {
  SCHEMA_INDEXES,
  SCHEMA_TABLES,
} from "../../../src/main/database/schema";
import { registerPromptIPC } from "../../../src/main/ipc/prompt.ipc";
import {
  configureRuntimePaths,
  getPromptsWorkspaceDir,
  resetRuntimePaths,
} from "../../../src/main/runtime-paths";
import { syncPromptWorkspaceFromDatabase } from "../../../src/main/services/prompt-workspace";

const { handleMock } = vi.hoisted(() => ({
  handleMock: vi.fn(),
}));

vi.mock("electron", () => ({
  ipcMain: {
    handle: handleMock,
  },
}));

/**
 * Relation and output-format mutations never change workspace file content;
 * their IPC handlers must not trigger workspace file writes at all. Prompt
 * scoped mutations must write only the affected files.
 */
describe("prompt IPC workspace sync wiring", () => {
  let tempDir: string;
  let rawDb: DatabaseAdapter.Database;
  let promptDb: PromptDB;
  let folderDb: FolderDB;
  let writeSpy: ReturnType<typeof vi.spyOn>;
  let handlers: Map<string, (...args: unknown[]) => unknown>;

  beforeEach(() => {
    handleMock.mockReset();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "prompthub-ipc-sync-"));
    configureRuntimePaths({ userDataPath: tempDir });

    rawDb = new DatabaseAdapter(":memory:");
    rawDb.pragma("journal_mode = WAL");
    rawDb.pragma("foreign_keys = ON");
    rawDb.exec(SCHEMA_TABLES);
    rawDb.exec(SCHEMA_INDEXES);

    promptDb = new PromptDB(rawDb);
    folderDb = new FolderDB(rawDb);
    registerPromptIPC(promptDb, folderDb, rawDb);
    handlers = new Map(
      handleMock.mock.calls.map(([channel, handler]) => [channel, handler]),
    );

    writeSpy = vi.spyOn(fs, "writeFileSync");
  });

  afterEach(() => {
    writeSpy.mockRestore();
    rawDb.close();
    resetRuntimePaths();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  function seedAndSyncWorkspace() {
    const folder = folderDb.create({ name: "Writing" });
    const source = promptDb.create({
      title: "Source",
      userPrompt: "source body",
      folderId: folder.id,
    });
    const target = promptDb.create({
      title: "Target",
      userPrompt: "target body",
      folderId: folder.id,
    });
    syncPromptWorkspaceFromDatabase(promptDb, folderDb);
    writeSpy.mockClear();
    return { source, target };
  }

  it("relation create produces zero workspace file writes", async () => {
    const { source, target } = seedAndSyncWorkspace();

    const result = await handlers.get(IPC_CHANNELS.PROMPT_RELATION_CREATE)!(
      {},
      {
        sourcePromptId: source.id,
        targetPromptId: target.id,
        kind: "depends_on",
      },
    );

    expect(result).toBeTruthy();
    expect(writeSpy.mock.calls.map(([p]) => String(p))).toEqual([]);
  });

  it("output-format create produces zero workspace file writes", async () => {
    const { source } = seedAndSyncWorkspace();

    const result = await handlers.get(IPC_CHANNELS.PROMPT_OUTPUT_FORMAT_CREATE)!(
      {},
      { sourcePromptId: source.id, format: "json" },
    );

    expect(result).toBeTruthy();
    expect(writeSpy.mock.calls.map(([p]) => String(p))).toEqual([]);
  });

  it("prompt update writes only the updated prompt file", async () => {
    const { source, target } = seedAndSyncWorkspace();

    await handlers.get(IPC_CHANNELS.PROMPT_UPDATE)!(
      {},
      source.id,
      { title: "Source Renamed" },
    );

    const writes = writeSpy.mock.calls
      .map(([p]) => String(p))
      .map((p) => path.relative(getPromptsWorkspaceDir(), p));
    expect(writes).toEqual(["writing/source-renamed.md"]);
    expect(
      fs.existsSync(path.join(getPromptsWorkspaceDir(), "writing", "target.md")),
    ).toBe(true);
    expect(target.id).toBeTruthy();
  });

  it("prompt create writes only the new prompt file and its initial version", async () => {
    seedAndSyncWorkspace();

    const created = await handlers.get(IPC_CHANNELS.PROMPT_CREATE)!(
      {},
      { title: "Fresh", userPrompt: "fresh body" },
    );

    const writes = writeSpy.mock.calls.map(([p]) => String(p));
    const promptWrites = writes
      .map((p) => path.relative(getPromptsWorkspaceDir(), p))
      .filter((rel) => !rel.startsWith(".."));
    const versionWrites = writes.filter((p) =>
      p.includes(`.versions${path.sep}${(created as { id: string }).id}`),
    );
    expect(promptWrites).toEqual(["fresh.md"]);
    expect(versionWrites).toHaveLength(1);
  });

  it("prompt delete trashes the removed file without rewriting others", async () => {
    const { target } = seedAndSyncWorkspace();

    const deleted = await handlers.get(IPC_CHANNELS.PROMPT_DELETE)!(
      {},
      target.id,
    );

    expect(deleted).toBe(true);
    expect(writeSpy.mock.calls.map(([p]) => String(p))).toEqual([]);
    expect(
      fs.existsSync(path.join(getPromptsWorkspaceDir(), "writing", "target.md")),
    ).toBe(false);
  });
});
