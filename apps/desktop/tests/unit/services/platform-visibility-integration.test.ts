import { describe, expect, it } from "vitest";

import { filterEnabledPlatforms } from "../../../src/renderer/services/platform-visibility";

describe("platform visibility integration", () => {
  it("hides the same disabled platform across shared platform consumers", () => {
    const supportedPlatforms = [
      { id: "claude", name: "Claude Code" },
      { id: "codex", name: "Codex CLI" },
      { id: "opencode", name: "OpenCode" },
      { id: "custom-agent-1", name: "Team Agent", isCustom: true },
    ] as any;

    const disabledPlatformIds = ["claude"];

    // Detection is deliberately omitted: enabled membership is authoritative.
    const visible = filterEnabledPlatforms(supportedPlatforms, {
      disabledPlatformIds,
    }).map((platform) => platform.id);

    expect(visible).toEqual(["codex", "opencode", "custom-agent-1"]);
  });
});
