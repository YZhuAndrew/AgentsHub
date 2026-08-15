import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FolderDB } from "../../../src/main/database/folder";
import { PromptDB } from "../../../src/main/database/prompt";
import { SCHEMA_INDEXES, SCHEMA_TABLES } from "../../../src/main/database/schema";
import DatabaseAdapter from "../../../src/main/database/sqlite";
import {
  syncPromptWorkspaceForPrompts,
  syncPromptWorkspaceFromDatabase,
} from "../../../src/main/services/prompt-workspace";
import {
  configureRuntimePaths,
  getPromptsWorkspaceDir,
  resetRuntimePaths,
} from "../../../src/main/runtime-paths";

/**
 * Targeted workspace sync behavior:
 * - only the affected prompts' files are written (write-syscall level)
 * - the resulting disk state equals what a full sync would produce
 *   (proven by running a full sync afterwards and asserting zero writes)
 * - rename/move/delete keep trashing orphans with the same semantics
 *
 * Also pins the additive DB APIs that feed the affected-id sets
 * (renameTag / deleteTag / movePrompt return values, getVersionById).
 */

function listTree(rootDir: string): Map<string, string> {
  const files = new Map<string, string>();
  if (!fs.existsSync(rootDir)) return files;
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const absolutePath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(absolutePath);
      } else {
        files.set(
          path.relative(rootDir, absolutePath),
          fs.readFileSync(absolutePath, "utf8"),
        );
      }
    }
  };
  walk(rootDir);
  return files;
}

describe("prompt workspace targeted sync", () => {
  let tempDir: string;
  let rawDb: DatabaseAdapter.Database;
  let promptDb: PromptDB;
  let folderDb: FolderDB;
  let writeSpy: ReturnType<typeof spyWriteFileSync>;
  let trashSpy: ReturnType<typeof spyMoveToTrash>;

  function spyWriteFileSync() {
    return vi.spyOn(fs, "writeFileSync");
  }

  function spyMoveToTrash() {
    // moveToTrash internally calls fs.renameSync; observing renames into the
    // trash directory is enough to assert orphan cleanup.
    return vi.spyOn(fs, "renameSync");
  }

  function writtenPaths(): string[] {
    return writeSpy.mock.calls.map(([target]) => String(target));
  }

  function trashedPaths(): string[] {
    return trashSpy.mock.calls
      .map(([, to]) => String(to))
      .filter((target) => target.includes(".trash"));
  }

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "prompthub-targeted-"));
    configureRuntimePaths({ userDataPath: tempDir });

    rawDb = new DatabaseAdapter(":memory:");
    rawDb.pragma("journal_mode = WAL");
    rawDb.pragma("foreign_keys = ON");
    rawDb.exec(SCHEMA_TABLES);
    rawDb.exec(SCHEMA_INDEXES);

    promptDb = new PromptDB(rawDb);
    folderDb = new FolderDB(rawDb);

    writeSpy = spyWriteFileSync();
    trashSpy = spyMoveToTrash();
    writeSpy.mockClear();
    trashSpy.mockClear();
  });

  afterEach(() => {
    writeSpy.mockRestore();
    trashSpy.mockRestore();
    rawDb.close();
    resetRuntimePaths();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  function seedLibrary() {
    const folder = folderDb.create({ name: "Writing" });
    const alpha = promptDb.create({
      title: "Alpha",
      userPrompt: "alpha body",
      folderId: folder.id,
      tags: ["red"],
    });
    const beta = promptDb.create({
      title: "Beta",
      userPrompt: "beta body",
      folderId: folder.id,
      tags: ["red", "blue"],
    });
    const gamma = promptDb.create({
      title: "Gamma",
      userPrompt: "gamma body",
    });
    promptDb.update(alpha.id, { userPrompt: "alpha body v2" });
    return { folder, alpha, beta, gamma };
  }

  it("writes only the affected prompt file when one prompt is updated", () => {
    const { alpha, beta } = seedLibrary();
    syncPromptWorkspaceFromDatabase(promptDb, folderDb);
    writeSpy.mockClear();

    promptDb.update(beta.id, { title: "Beta Renamed" });
    syncPromptWorkspaceForPrompts(promptDb, folderDb, [beta.id]);

    const writes = writtenPaths().map((target) =>
      path.relative(getPromptsWorkspaceDir(), target),
    );
    expect(writes).toEqual(
      expect.arrayContaining([path.join("writing", "beta-renamed.md")]),
    );
    expect(writes).not.toContain(path.join("writing", "alpha.md"));
    expect(writes).not.toContain(path.join("writing", "gamma.md"));

    // Equivalence: a subsequent full sync must not need to write anything.
    writeSpy.mockClear();
    syncPromptWorkspaceFromDatabase(promptDb, folderDb);
    expect(writtenPaths()).toEqual([]);

    expect(alpha.id).toBeTruthy();
  });

  it("skips writing files whose content is unchanged", () => {
    const { alpha } = seedLibrary();
    syncPromptWorkspaceFromDatabase(promptDb, folderDb);
    writeSpy.mockClear();

    // Re-running the targeted sync for an unchanged prompt writes nothing.
    syncPromptWorkspaceForPrompts(promptDb, folderDb, [alpha.id]);
    expect(writtenPaths()).toEqual([]);

    // Full sync is likewise idempotent under content-compare writes.
    syncPromptWorkspaceFromDatabase(promptDb, folderDb);
    expect(writtenPaths()).toEqual([]);
  });

  it("trashes the old slug file when a prompt is renamed and keeps state equal to a full sync", () => {
    const { alpha } = seedLibrary();
    syncPromptWorkspaceFromDatabase(promptDb, folderDb);
    const beforeRename = listTree(getPromptsWorkspaceDir());

    promptDb.update(alpha.id, { title: "Alpha Prime" });
    syncPromptWorkspaceForPrompts(promptDb, folderDb, [alpha.id]);

    expect(
      fs.existsSync(path.join(getPromptsWorkspaceDir(), "writing", "alpha.md")),
    ).toBe(false);
    expect(
      fs.existsSync(
        path.join(getPromptsWorkspaceDir(), "writing", "alpha-prime.md"),
      ),
    ).toBe(true);
    expect(beforeRename.has(path.join("writing", "alpha.md"))).toBe(true);

    // Equivalence with the full sync result.
    writeSpy.mockClear();
    syncPromptWorkspaceFromDatabase(promptDb, folderDb);
    expect(writtenPaths()).toEqual([]);
  });

  it("keeps collision suffix assignment identical to the full sync", () => {
    const { folder, alpha } = seedLibrary();
    const alphaTwin = promptDb.create({
      title: "Alpha",
      userPrompt: "twin body",
      folderId: folder.id,
    });
    syncPromptWorkspaceFromDatabase(promptDb, folderDb);
    const afterFull = listTree(getPromptsWorkspaceDir());
    const twinFiles = [...afterFull.keys()].filter((relativePath) =>
      path.basename(relativePath).startsWith("alpha"),
    );
    // Two prompts titled Alpha in the same folder occupy two distinct files.
    // 同一文件夹内两条同名 Alpha 必须落位到两个不同文件。
    expect(twinFiles).toHaveLength(2);

    promptDb.update(alphaTwin.id, { userPrompt: "twin body v2" });
    syncPromptWorkspaceForPrompts(promptDb, folderDb, [alphaTwin.id]);

    // Updating the twin may legitimately flip the collision order (updated_at
    // decides who gets the base name), so the invariant is equivalence with
    // what a full sync produces NOW, not file-set stability: the full sync
    // below must find nothing left to write.
    // 更新 twin 可能合法地翻转碰撞顺序（updated_at 决定基名归属），因此
    // 不变量是"与现在全量同步的结果等价"而非文件集不变：下面的全量
    // 同步必须无事可写。
    writeSpy.mockClear();
    syncPromptWorkspaceFromDatabase(promptDb, folderDb);
    expect(writtenPaths()).toEqual([]);

    // Every remaining alpha file carries exactly one prompt's id, and both
    // prompts are represented on disk after the flip.
    // 翻转后每个 alpha 文件恰好携带一个 prompt 的 id，且两条 prompt 都
    // 在磁盘上有归属。
    const files = [...listTree(getPromptsWorkspaceDir()).keys()].filter(
      (relativePath) => path.basename(relativePath).startsWith("alpha"),
    );
    expect(files).toHaveLength(2);
    const fileIds = new Set<string>();
    for (const relativePath of files) {
      const match = listTree(getPromptsWorkspaceDir())
        .get(relativePath)!
        .match(/^id: "?([^"\n]+)"?/m);
      expect(match).not.toBeNull();
      fileIds.add(match![1]);
    }
    expect(fileIds).toEqual(new Set([alpha.id, alphaTwin.id]));
  });

  it("trashes the prompt file and its version directory on delete", () => {
    const { beta } = seedLibrary();
    syncPromptWorkspaceFromDatabase(promptDb, folderDb);
    trashSpy.mockClear();

    promptDb.delete(beta.id);
    syncPromptWorkspaceForPrompts(promptDb, folderDb, [beta.id]);

    const trashed = trashedPaths();
    expect(
      trashed.some((target) => target.endsWith("beta.md")),
    ).toBe(true);
    expect(
      trashed.some((target) => target.includes(`versions${path.sep}${beta.id}`)),
    ).toBe(true);

    // Equivalence: full sync afterwards has nothing left to change.
    writeSpy.mockClear();
    syncPromptWorkspaceFromDatabase(promptDb, folderDb);
    expect(writtenPaths()).toEqual([]);
  });

  it("syncs exactly the prompts affected by renameTag", () => {
    const { alpha, beta, gamma } = seedLibrary();
    syncPromptWorkspaceFromDatabase(promptDb, folderDb);
    writeSpy.mockClear();

    const affected = promptDb.renameTag("red", "crimson");
    expect(new Set(affected)).toEqual(new Set([alpha.id, beta.id]));

    syncPromptWorkspaceForPrompts(promptDb, folderDb, affected);
    const writes = writtenPaths().map((target) =>
      path.relative(getPromptsWorkspaceDir(), target),
    );
    expect(writes).toContain(path.join("writing", "alpha.md"));
    expect(writes).toContain(path.join("writing", "beta.md"));
    expect(writes).not.toContain("gamma.md");

    writeSpy.mockClear();
    syncPromptWorkspaceFromDatabase(promptDb, folderDb);
    expect(writtenPaths()).toEqual([]);
  });

  it("syncs the prompts whose order changed after movePrompt", () => {
    const { alpha, beta, gamma } = seedLibrary();
    syncPromptWorkspaceFromDatabase(promptDb, folderDb);
    writeSpy.mockClear();

    const affected = promptDb.movePrompt(gamma.id, null, 0);
    expect(new Set(affected)).toEqual(
      new Set([alpha.id, beta.id, gamma.id]),
    );

    syncPromptWorkspaceForPrompts(promptDb, folderDb, affected);
    const writes = writtenPaths().map((target) =>
      path.relative(getPromptsWorkspaceDir(), target),
    );
    // sort_order lives in the frontmatter, so reordered prompts are rewritten.
    expect(writes).toContain("gamma.md");
    expect(writes).toContain(path.join("writing", "alpha.md"));

    writeSpy.mockClear();
    syncPromptWorkspaceFromDatabase(promptDb, folderDb);
    expect(writtenPaths()).toEqual([]);
  });

  it("writes a new version file when only versions change", () => {
    const { alpha } = seedLibrary();
    syncPromptWorkspaceFromDatabase(promptDb, folderDb);
    writeSpy.mockClear();

    promptDb.createVersion(alpha.id, "manual snapshot");
    syncPromptWorkspaceForPrompts(promptDb, folderDb, [alpha.id]);

    const versionWrites = writtenPaths().filter((target) =>
      target.includes(`versions${path.sep}${alpha.id}`),
    );
    expect(versionWrites).toHaveLength(1);

    writeSpy.mockClear();
    syncPromptWorkspaceFromDatabase(promptDb, folderDb);
    expect(writtenPaths()).toEqual([]);
  });
});

describe("PromptDB affected-id and version-lookup APIs", () => {
  let rawDb: DatabaseAdapter.Database;
  let promptDb: PromptDB;

  beforeEach(() => {
    rawDb = new DatabaseAdapter(":memory:");
    rawDb.pragma("foreign_keys = ON");
    rawDb.exec(SCHEMA_TABLES);
    rawDb.exec(SCHEMA_INDEXES);
    promptDb = new PromptDB(rawDb);
  });

  afterEach(() => {
    rawDb.close();
  });

  it("renameTag returns the affected prompt ids and empty for no match", () => {
    const first = promptDb.create({ title: "A", userPrompt: "a", tags: ["x"] });
    const second = promptDb.create({ title: "B", userPrompt: "b", tags: ["x", "y"] });
    const third = promptDb.create({ title: "C", userPrompt: "c", tags: ["z"] });

    expect(promptDb.renameTag("x", "w").sort()).toEqual(
      [first.id, second.id].sort(),
    );
    expect(promptDb.renameTag("missing", "w")).toEqual([]);

    expect(promptDb.deleteTag("w").sort()).toEqual(
      [first.id, second.id].sort(),
    );
    expect(third.id).toBeTruthy();
  });

  it("movePrompt returns the union of old siblings, new siblings, and the moved prompt", () => {
    const parent = promptDb.create({ title: "P", userPrompt: "p" });
    const childA = promptDb.create({ title: "CA", userPrompt: "ca" });
    const childB = promptDb.create({ title: "CB", userPrompt: "cb" });
    promptDb.movePrompt(childA.id, parent.id, 0);
    promptDb.movePrompt(childB.id, parent.id, 1);
    const rootSibling = promptDb.create({ title: "R", userPrompt: "r" });

    const affected = promptDb.movePrompt(childA.id, null, 0);

    // childA moves out of parent; childB closes the gap; inserting childA at
    // root index 0 also shifts parent and rootSibling by one — all four have
    // new sort_order values and must be re-synced.
    // childA 移出后 childB 补位；childA 插到根级第 0 位还会把 parent 与
    // rootSibling 各后移一位——四者的 sort_order 都变了，都需要重同步。
    expect(new Set(affected)).toEqual(
      new Set([childA.id, childB.id, parent.id, rootSibling.id]),
    );
  });

  it("getVersionById resolves a version and its prompt, null when missing", () => {
    const prompt = promptDb.create({ title: "V", userPrompt: "v" });
    const versions = promptDb.getVersions(prompt.id);
    expect(versions.length).toBeGreaterThan(0);

    const resolved = promptDb.getVersionById(versions[0].id);
    expect(resolved?.promptId).toBe(prompt.id);
    expect(resolved?.version).toBe(versions[0].version);

    expect(promptDb.getVersionById("no-such-version")).toBeNull();
  });
});
