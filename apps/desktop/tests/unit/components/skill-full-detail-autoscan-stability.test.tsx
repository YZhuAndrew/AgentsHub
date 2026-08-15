import { act, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Skill, SkillSafetyReport } from "@prompthub/shared/types";
import { SkillFullDetailPage } from "../../../src/renderer/components/skill/SkillFullDetailPage";
import { ToastProvider } from "../../../src/renderer/components/ui/Toast";
import { useSettingsStore } from "../../../src/renderer/stores/settings.store";
import { useSkillStore } from "../../../src/renderer/stores/skill.store";
import { renderWithI18n } from "../../helpers/i18n";
import { installWindowMocks } from "../../helpers/window";

const platformHarness = vi.hoisted(() => ({
  availablePlatforms: [] as Array<{ id: string; name: string }>,
  batchInstall: vi.fn().mockResolvedValue({
    successCount: 0,
    totalCount: 0,
    failures: [],
    fallbacks: [],
  }),
  deselectAllPlatforms: vi.fn(),
  installProgress: null as { current: number; total: number } | null,
  installStatus: {} as Record<string, boolean>,
  isBatchInstalling: false,
  selectedPlatforms: new Set<string>(),
  selectAllPlatforms: vi.fn(),
  togglePlatformSelection: vi.fn(),
  uninstallFromPlatform: vi.fn().mockResolvedValue(undefined),
  uninstalledPlatforms: [] as Array<{ id: string; name: string }>,
}));

vi.mock("../../../src/renderer/components/skill/use-skill-platform", () => ({
  useSkillPlatform: () => platformHarness,
}));

vi.mock("../../../src/renderer/services/webdav-save-sync", () => ({
  scheduleAllSaveSync: vi.fn(),
}));

const safetyReport: SkillSafetyReport = {
  level: "safe",
  summary: "No obvious malicious patterns were detected.",
  findings: [],
  recommendedAction: "allow",
  scannedAt: 1,
  checkedFileCount: 1,
  scanMethod: "rules",
};

function makeSkill(): Skill {
  return {
    id: "skill-autoscan-stability",
    name: "autoscan-stability",
    description: "Auto-scan loop regression skill",
    instructions: "# Auto Scan\n\nStable inputs.",
    content: "# Auto Scan\n\nStable inputs.",
    protocol_type: "skill",
    author: "AgentsHub",
    tags: [],
    is_favorite: false,
    currentVersion: 0,
    created_at: 1,
    updated_at: 1,
  } as Skill;
}

describe("SkillFullDetailPage auto-scan stability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installWindowMocks({
      api: {
        skill: {
          saveSafetyReport: vi.fn().mockResolvedValue(undefined),
        },
      },
    });
    vi.mocked(window.api.skill.scanSafety).mockResolvedValue(safetyReport);

    useSkillStore.setState({
      skills: [makeSkill()],
      selectedSkillId: "skill-autoscan-stability",
    } as never);
    useSettingsStore.setState({
      autoScanInstalledSkills: true,
      aiModels: [],
    } as Partial<ReturnType<typeof useSettingsStore.getState>>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("runs the auto safety scan once for stable inputs instead of rescanning after every report save", async () => {
    await act(async () => {
      await renderWithI18n(
        <ToastProvider>
          <SkillFullDetailPage />
        </ToastProvider>,
        { language: "en" },
      );
    });

    // Let any would-be rescan loop run: each pre-fix iteration resolves its
    // mocked IPC within microtasks, so a settle window exposes it clearly.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    expect(window.api.skill.scanSafety).toHaveBeenCalledTimes(1);
    expect(window.api.skill.saveSafetyReport).toHaveBeenCalledTimes(1);
    const storedSkill = useSkillStore
      .getState()
      .skills.find((skill) => skill.id === "skill-autoscan-stability");
    expect(storedSkill?.safetyReport?.level).toBe("safe");
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
  });
});
