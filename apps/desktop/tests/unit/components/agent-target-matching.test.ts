import { describe, expect, it } from "vitest";
import type { ManagedAgentSummary } from "@prompthub/shared/types";
import { matchesManagedAgentTarget } from "../../../src/renderer/components/agent/agent-target-matching";

function agent(
  overrides: Partial<ManagedAgentSummary> = {},
): ManagedAgentSummary {
  return {
    id: "claude",
    name: "Claude Code",
    icon: "claude",
    displayIconId: "claude",
    isCustom: false,
    isConfigured: true,
    isDetected: true,
    isPinned: false,
    status: "installed",
    paths: {
      rootPath: "~/.claude",
      skillsRelativePath: "skills",
      mcpRelativePath: "config/mcp.json",
      pluginsRelativePath: "plugins/cache/prompthub",
      rulesRelativePath: "CLAUDE.md",
      configRelativePaths: ["settings.json"],
    },
    capabilities: {} as ManagedAgentSummary["capabilities"],
    ...overrides,
  };
}

describe("matchesManagedAgentTarget", () => {
  it("matches the adapter target id claude-code to the claude agent", () => {
    // Regression: the Agents-page plugin panel passed target.id ("claude-code")
    // directly against agent.id ("claude") and never matched, so Claude Code
    // plugins were dropped even though the Plugins page showed them.
    expect(matchesManagedAgentTarget(["claude-code"], agent())).toBe(true);
  });

  it("matches other adapter aliases to their agent platform ids", () => {
    expect(
      matchesManagedAgentTarget(["gemini-cli"], agent({ id: "gemini", displayIconId: "gemini" })),
    ).toBe(true);
    expect(
      matchesManagedAgentTarget(
        ["github-copilot"],
        agent({ id: "copilot", displayIconId: "copilot" }),
      ),
    ).toBe(true);
  });

  it("still matches when the candidate already uses the platform id", () => {
    // MCP presets pass platformId ("claude") directly; normalization must be
    // a no-op for ids that are already platform ids.
    expect(matchesManagedAgentTarget(["claude"], agent())).toBe(true);
  });

  it("matches via displayIconId when agent.id differs", () => {
    expect(
      matchesManagedAgentTarget(
        ["claude-code"],
        agent({ id: "claude-custom", displayIconId: "claude" }),
      ),
    ).toBe(true);
  });

  it("does not match an unrelated target id", () => {
    expect(matchesManagedAgentTarget(["codex"], agent())).toBe(false);
    expect(matchesManagedAgentTarget(["cursor"], agent())).toBe(false);
  });

  it("handles undefined / empty candidate ids safely", () => {
    expect(matchesManagedAgentTarget([undefined, ""], agent())).toBe(false);
  });
});
