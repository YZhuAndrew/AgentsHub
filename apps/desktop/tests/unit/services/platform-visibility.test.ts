import { describe, expect, it } from "vitest";

import { SHARED_AGENT_SKILLS_TARGET_ID } from "@prompthub/shared/constants/skill-distribution-targets";
import {
  filterDetectedPlatforms,
  filterEnabledPlatforms,
  filterVisiblePlatforms,
  isPlatformEnabled,
} from "../../../src/renderer/services/platform-visibility";

describe("platform visibility", () => {
  it("filters disabled platforms from generic platform lists", () => {
    expect(
      filterVisiblePlatforms(
        [
          { id: "claude", name: "Claude Code" },
          { id: "codex", name: "Codex CLI" },
          { id: "opencode", name: "OpenCode" },
        ],
        ["codex"],
      ),
    ).toEqual([
      { id: "claude", name: "Claude Code" },
      { id: "opencode", name: "OpenCode" },
    ]);
  });

  it("filters disabled platforms after detection", () => {
    expect(
      filterDetectedPlatforms(
        [
          { id: "claude", name: "Claude Code" } as any,
          { id: "codex", name: "Codex CLI" } as any,
          { id: "opencode", name: "OpenCode" } as any,
        ],
        ["claude", "codex", "opencode"],
        ["claude", "opencode"],
      ).map((platform) => platform.id),
    ).toEqual(["codex"]);
  });
});

describe("toggle-authoritative visibility", () => {
  // Detection is intentionally NOT supplied to these cases: the authoritative
  // predicate must keep enabled platforms even when their root is absent.
  const platforms = [
    { id: "claude", name: "Claude Code" },
    { id: "codex", name: "Codex" },
    { id: "cursor", name: "Cursor" },
    { id: "custom-1", name: "Team", isCustom: true },
    { id: "custom-2", name: "Old", isCustom: true },
    {
      id: SHARED_AGENT_SKILLS_TARGET_ID,
      name: "Shared",
      isConfigured: true,
    },
  ] as Array<{ id: string; name: string; isCustom?: boolean; isConfigured?: boolean }>;

  const ctx = {
    disabledPlatformIds: ["codex"],
    customAgentEnabled: (id: string) => (id === "custom-2" ? false : true),
  };

  it("keeps enabled built-in platforms even when not detected (regression for #toggle-authoritative)", () => {
    expect(filterEnabledPlatforms(platforms, ctx).map((p) => p.id)).toEqual([
      "claude",
      "cursor",
      "custom-1",
      SHARED_AGENT_SKILLS_TARGET_ID,
    ]);
  });

  it("drops disabled built-in platforms and disabled custom agents", () => {
    const result = filterEnabledPlatforms(platforms, ctx).map((p) => p.id);
    expect(result).not.toContain("codex");
    expect(result).not.toContain("custom-2");
  });

  it("drops a configured built-in platform when it is disabled (configured no longer gates visibility)", () => {
    expect(
      filterEnabledPlatforms(
        [
          { id: "claude", name: "Claude Code", isConfigured: true },
          { id: "cursor", name: "Cursor" },
        ] as any,
        { disabledPlatformIds: ["claude"] },
      ).map((p) => p.id),
    ).toEqual(["cursor"]);
  });
});

describe("isPlatformEnabled", () => {
  it("treats the shared distribution target as always enabled", () => {
    expect(
      isPlatformEnabled(
        { id: SHARED_AGENT_SKILLS_TARGET_ID } as any,
        { disabledPlatformIds: [SHARED_AGENT_SKILLS_TARGET_ID] },
      ),
    ).toBe(true);
  });

  it("enables a built-in platform when not in the disabled list", () => {
    expect(
      isPlatformEnabled({ id: "claude" } as any, { disabledPlatformIds: [] }),
    ).toBe(true);
  });

  it("disables a built-in platform when it is in the disabled list", () => {
    expect(
      isPlatformEnabled(
        { id: "claude" } as any,
        { disabledPlatformIds: ["claude"] },
      ),
    ).toBe(false);
  });

  it("honors the custom-agent resolver and defaults to enabled when absent", () => {
    expect(
      isPlatformEnabled(
        { id: "custom-1", isCustom: true } as any,
        {
          disabledPlatformIds: [],
          customAgentEnabled: () => false,
        },
      ),
    ).toBe(false);
    expect(
      isPlatformEnabled(
        { id: "custom-1", isCustom: true } as any,
        { disabledPlatformIds: [] },
      ),
    ).toBe(true);
  });
});
