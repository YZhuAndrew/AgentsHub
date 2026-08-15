import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../src/renderer/services/webdav-save-sync", () => ({
  scheduleAllSaveSync: vi.fn(),
}));

import { useSkillStore } from "../../../src/renderer/stores/skill.store";
import type { SkillSafetyReport } from "@prompthub/shared/types";
import { createSkillFixture } from "../../fixtures/skills";
import { installWindowMocks } from "../../helpers/window";

const safetyReport: SkillSafetyReport = {
  level: "safe",
  summary: "No obvious malicious patterns were detected.",
  findings: [],
  recommendedAction: "allow",
  scannedAt: 1,
  checkedFileCount: 1,
  scanMethod: "rules",
};

describe("skill store safety report persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installWindowMocks({
      api: {
        skill: {
          saveSafetyReport: vi.fn().mockResolvedValue(undefined),
        },
      },
    });
    useSkillStore.setState({ skills: [], selectedSkillId: null } as never);
  });

  it("replaces the stored skill object when a new safety report differs", async () => {
    const skill = createSkillFixture({ id: "skill-safety-save" });
    useSkillStore.setState({ skills: [skill] } as never);

    await useSkillStore
      .getState()
      .saveSafetyReport(skill.id, { ...safetyReport, level: "warn" });

    const stored = useSkillStore.getState().skills[0];
    expect(stored.safetyReport?.level).toBe("warn");
  });

  it("keeps the stored skill object identity when saving an unchanged safety report", async () => {
    const skill = createSkillFixture({
      id: "skill-safety-save",
      safetyReport: { ...safetyReport, score: 100 },
    });
    useSkillStore.setState({ skills: [skill] } as never);
    const before = useSkillStore.getState().skills[0];

    await useSkillStore
      .getState()
      .saveSafetyReport(skill.id, { ...safetyReport });

    const after = useSkillStore.getState().skills[0];
    expect(after.safetyReport?.level).toBe("safe");
    expect(after).toBe(before);
  });
});
