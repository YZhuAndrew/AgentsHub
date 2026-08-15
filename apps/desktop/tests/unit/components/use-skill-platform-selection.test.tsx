import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSkillPlatform } from "../../../src/renderer/components/skill/use-skill-platform";
import { installWindowMocks } from "../../helpers/window";
import type { Skill } from "@prompthub/shared/types";

function makeSkill(overrides: Partial<Skill> = {}): Skill {
  return {
    id: "skill-selection",
    name: "selection-skill",
    description: "Selection regression skill",
    instructions: "# Selection\n\nKeep my platform selection.",
    content: "# Selection\n\nKeep my platform selection.",
    protocol_type: "skill",
    author: "AgentsHub",
    tags: [],
    is_favorite: false,
    currentVersion: 0,
    created_at: 1,
    updated_at: 1,
    ...overrides,
  } as Skill;
}

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
};

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

async function renderPlatformHook(initialSkill: Skill) {
  return renderHook(
    ({ skill }: { skill: Skill }) => useSkillPlatform(skill, "copy"),
    { initialProps: { skill: initialSkill } },
  );
}

describe("useSkillPlatform selection stability", () => {
  let statusDetailsDeferred: Deferred<Record<string, { installed: boolean }>>;

  beforeEach(() => {
    vi.clearAllMocks();
    statusDetailsDeferred = createDeferred();
    installWindowMocks({
      api: {
        skill: {
          getSupportedPlatforms: vi
            .fn()
            .mockResolvedValue([{ id: "claude", name: "Claude Code" }]),
          detectPlatforms: vi.fn().mockResolvedValue(["claude"]),
          getMdInstallStatusDetails: vi
            .fn()
            .mockReturnValue(statusDetailsDeferred.promise),
        },
      },
    });
  });

  it("keeps the platform selection when the mount-time install status refresh resolves afterwards", async () => {
    const { result } = await renderPlatformHook(makeSkill());

    await act(async () => {
      result.current.togglePlatformSelection("claude");
    });
    expect(result.current.selectedPlatforms.has("claude")).toBe(true);

    await act(async () => {
      statusDetailsDeferred.resolve({ claude: { installed: false } });
    });

    expect(result.current.selectedPlatforms.has("claude")).toBe(true);
    expect(result.current.installStatus.claude).toBe(false);
  });

  it("does not refetch install status or clear the selection when the skill object identity changes for the same id", async () => {
    const skill = makeSkill();
    const { result, rerender } = await renderPlatformHook(skill);

    await act(async () => {
      statusDetailsDeferred.resolve({ claude: { installed: false } });
    });
    await act(async () => {
      result.current.togglePlatformSelection("claude");
    });

    const fetchCallsAfterFirstRefresh =
      window.api.skill.getMdInstallStatusDetails.mock.calls.length;

    rerender({ skill: { ...skill } });

    await act(async () => {
      await Promise.resolve();
    });

    expect(window.api.skill.getMdInstallStatusDetails.mock.calls.length).toBe(
      fetchCallsAfterFirstRefresh,
    );
    expect(result.current.selectedPlatforms.has("claude")).toBe(true);
  });

  it("clears the selection when switching to a different skill", async () => {
    const { result, rerender } = await renderPlatformHook(makeSkill());

    await act(async () => {
      statusDetailsDeferred.resolve({ claude: { installed: false } });
    });
    await act(async () => {
      result.current.togglePlatformSelection("claude");
    });

    const nextDeferred =
      createDeferred<Record<string, { installed: boolean }>>();
    vi.mocked(window.api.skill.getMdInstallStatusDetails).mockReturnValue(
      nextDeferred.promise,
    );
    rerender({
      skill: makeSkill({ id: "skill-selection-next", name: "next-skill" }),
    });

    await act(async () => {
      nextDeferred.resolve({});
    });

    expect(result.current.selectedPlatforms.size).toBe(0);
  });

  it("prunes platforms that a refresh reports as installed instead of clearing the whole selection", async () => {
    const { result } = await renderPlatformHook(makeSkill());

    await act(async () => {
      result.current.togglePlatformSelection("claude");
      result.current.togglePlatformSelection("cursor");
    });

    await act(async () => {
      statusDetailsDeferred.resolve({
        claude: { installed: true },
        cursor: { installed: false },
      });
    });

    expect(result.current.selectedPlatforms.has("claude")).toBe(false);
    expect(result.current.selectedPlatforms.has("cursor")).toBe(true);
  });

  it("clears the selection after a completed batch install", async () => {
    vi.mocked(window.api.skill.getMdInstallStatusDetails).mockResolvedValue({
      claude: { installed: false },
      cursor: { installed: false },
    });
    vi.mocked(window.api.skill.export).mockResolvedValue("# skill md");
    const { result } = await renderPlatformHook(makeSkill());

    await waitFor(() =>
      expect(result.current.installStatus.claude).toBe(false),
    );
    await act(async () => {
      result.current.togglePlatformSelection("claude");
    });

    await act(async () => {
      await result.current.batchInstall();
    });

    expect(result.current.selectedPlatforms.size).toBe(0);
    expect(window.api.skill.installMd).toHaveBeenCalledWith(
      "skill-selection",
      "# skill md",
      "claude",
    );
  });
});
