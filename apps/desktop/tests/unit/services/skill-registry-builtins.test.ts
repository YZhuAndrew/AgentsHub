import { describe, expect, it } from "vitest";

import { BUILTIN_SKILL_REGISTRY } from "@prompthub/shared/constants/skill-registry";

describe("built-in skill registry", () => {
  it("ships a package-aware skill creator", () => {
    const creator = BUILTIN_SKILL_REGISTRY.find(
      (skill) => skill.slug === "skill-creator",
    );

    expect(creator).toBeTruthy();
    expect(creator?.content).toContain("Skill is a directory package");
    expect(creator?.content).toContain("references/");
    expect(creator?.content).toContain("scripts/");
    expect(creator?.content).toContain("assets/");
    expect(creator?.content_url).toBeUndefined();
  });

  it("ships a AgentsHub CLI operator skill", () => {
    const cliOperator = BUILTIN_SKILL_REGISTRY.find(
      (skill) => skill.slug === "prompthub-cli-operator",
    );

    expect(cliOperator).toBeTruthy();
    expect(cliOperator?.content).toContain("prompthub --help");
    expect(cliOperator?.content).toContain("prompthub skill repo-files");
    expect(cliOperator?.content).toContain("prompthub workspace export");
    expect(cliOperator?.content).toContain("Ask before destructive commands");
  });
});
