import { describe, expect, it } from "vitest";

import {
  parseBatchUrls,
  slugifyBatchSkillName,
} from "../../../src/renderer/components/skill/batch-import-utils";

describe("slugifyBatchSkillName", () => {
  it("lowercases and hyphenates a human-readable name", () => {
    expect(slugifyBatchSkillName("My Cool Skill")).toBe("my-cool-skill");
  });

  it("strips a trailing .zip and slugifies the base", () => {
    expect(slugifyBatchSkillName("Writer.zip")).toBe("writer");
  });

  it("collapses non-alphanumerics and trims hyphens", () => {
    expect(slugifyBatchSkillName("  Awesome!! Skill  ")).toBe("awesome-skill");
  });

  it("returns an empty string when no usable segment remains", () => {
    expect(slugifyBatchSkillName("!!!")).toBe("");
  });
});

describe("parseBatchUrls", () => {
  it("splits on whitespace, commas, and newlines and keeps only URL-like entries", () => {
    const text = [
      "https://github.com/owner/one",
      "https://github.com/owner/two, https://github.com/owner/three",
      "not a url",
      "git@gitea.example.com/team/four",
    ].join("\n");
    expect(parseBatchUrls(text)).toEqual([
      "https://github.com/owner/one",
      "https://github.com/owner/two",
      "https://github.com/owner/three",
    ]);
  });

  it("deduplicates entries", () => {
    const text =
      "https://github.com/owner/one https://github.com/owner/one";
    expect(parseBatchUrls(text)).toEqual(["https://github.com/owner/one"]);
  });

  it("returns an empty array for blank or non-url input", () => {
    expect(parseBatchUrls("")).toEqual([]);
    expect(parseBatchUrls("just words here")).toEqual([]);
  });
});
