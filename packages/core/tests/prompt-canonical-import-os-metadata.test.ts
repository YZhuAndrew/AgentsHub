import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  DatabaseAdapter,
  FolderDB,
  PromptDB,
  closeDatabase,
  initDatabase,
} from "@prompthub/db";
import type { Folder, Prompt, PromptVersion } from "@prompthub/shared/types";
import { afterEach, describe, expect, it } from "vitest";

import {
  collectPromptCanonicalGraph,
  materializePromptCanonicalGraph,
} from "../src/prompt-canonical-export";
import { readPromptCanonicalGraph } from "../src/prompt-canonical-import";

const roots: string[] = [];

function createRoot(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "prompthub-osmeta-"));
  roots.push(root);
  return root;
}

function folder(): Folder {
  return {
    id: "folder-1",
    name: "Writing",
    parentId: null,
    sortOrder: 0,
    createdAt: "2026-08-11T00:00:00.000Z",
    updatedAt: "2026-08-11T00:00:00.000Z",
  } as unknown as Folder;
}

function prompt(id: string, folderId: string | null = null): Prompt {
  return {
    id,
    title: `Prompt ${id}`,
    promptType: "text",
    systemPrompt: null,
    userPrompt: `Body ${id}`,
    variables: [],
    tags: [],
    folderId,
    parentId: null,
    order: 0,
    images: [],
    videos: [],
    isFavorite: false,
    isPinned: false,
    version: 1,
    currentVersion: 1,
    usageCount: 0,
    source: null,
    notes: null,
    lastAiResponse: null,
    createdAt: "2026-08-11T00:00:00.000Z",
    updatedAt: "2026-08-11T00:00:00.000Z",
  } as Prompt;
}

function version(promptId: string): PromptVersion {
  return {
    id: `version-${promptId}`,
    promptId,
    version: 1,
    systemPrompt: null,
    systemPromptEn: null,
    userPrompt: `Body ${promptId}`,
    userPromptEn: null,
    variables: [],
    note: null,
    aiResponse: null,
    createdAt: "2026-08-11T00:00:00.000Z",
  } as unknown as PromptVersion;
}

/**
 * Finder writes .DS_Store into any directory a user opens; the canonical
 * inventory must tolerate OS metadata files instead of failing every
 * startup. This reproduces the 0.8.2 local-test blank-window report:
 * "canonical graph file inventory count mismatch: .DS_Store".
 */
describe("canonical inventory tolerates OS metadata files", () => {
  afterEach(() => {
    closeDatabase();
    for (const root of roots.splice(0)) {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  function publishCanonicalTree(root: string): string {
    const db = initDatabase(path.join(root, "prompthub.db"));
    const promptDb = new PromptDB(db);
    const folderDb = new FolderDB(db);
    folderDb.insertFolderDirect(folder());
    promptDb.insertPromptDirect(prompt("prompt-1", "folder-1"));
    promptDb.insertVersionDirect(version("prompt-1"));

    const snapshot = collectPromptCanonicalGraph(promptDb, folderDb, db);
    const target = path.join(root, "canonical-data");
    materializePromptCanonicalGraph(target, snapshot, {
      createdAt: "2026-08-11T02:00:00.000Z",
    });
    closeDatabase();
    return target;
  }

  it("reads the graph when Finder dropped .DS_Store files into the tree", () => {
    const target = publishCanonicalTree(createRoot());

    fs.writeFileSync(path.join(target, ".DS_Store"), "finder junk");
    fs.mkdirSync(path.join(target, "skills", "skill-1", "files"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(target, "skills", "skill-1", "files", ".DS_Store"),
      "finder junk",
    );
    fs.writeFileSync(
      path.join(target, "skills", "skill-1", "files", "Thumbs.db"),
      "explorer junk",
    );

    const restored = readPromptCanonicalGraph(target);
    expect(restored.snapshot.prompts.map((item) => item.id)).toEqual([
      "prompt-1",
    ]);
    expect(restored.snapshot.folders.map((item) => item.id)).toEqual([
      "folder-1",
    ]);
  });

  it("still rejects undeclared ordinary files", () => {
    const target = publishCanonicalTree(createRoot());
    fs.writeFileSync(path.join(target, "notes.txt"), "not os metadata");

    expect(() => readPromptCanonicalGraph(target)).toThrow(
      /inventory count mismatch/u,
    );
  });
});
