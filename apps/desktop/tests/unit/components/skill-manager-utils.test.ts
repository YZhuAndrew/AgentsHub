import { describe, expect, it } from "vitest";

import {
  isSkillArchivePath,
  normalizeDroppedSkillPath,
} from "../../../src/renderer/components/skill/skill-manager-utils";

describe("normalizeDroppedSkillPath", () => {
  it("strips a trailing /SKILL.md to its directory", () => {
    expect(normalizeDroppedSkillPath("/Users/me/writer/SKILL.md")).toBe(
      "/Users/me/writer",
    );
  });

  it("returns '' for a generic .md file (not SKILL.md)", () => {
    expect(normalizeDroppedSkillPath("/Users/me/notes/readme.md")).toBe("");
  });

  it("returns '' for a .zip archive (handled by batch import, not local scan)", () => {
    expect(normalizeDroppedSkillPath("/Users/me/writer.zip")).toBe("");
  });

  it("keeps a plain directory path unchanged", () => {
    expect(normalizeDroppedSkillPath("/Users/me/skills/writer")).toBe(
      "/Users/me/skills/writer",
    );
  });
});

describe("isSkillArchivePath", () => {
  it("recognizes .zip paths on posix and windows", () => {
    expect(isSkillArchivePath("/Users/me/writer.zip")).toBe(true);
    expect(isSkillArchivePath("C:\\Users\\me\\writer.zip")).toBe(true);
  });

  it("returns false for non-archive paths", () => {
    expect(isSkillArchivePath("/Users/me/writer")).toBe(false);
    expect(isSkillArchivePath("/Users/me/writer/SKILL.md")).toBe(false);
  });
});
