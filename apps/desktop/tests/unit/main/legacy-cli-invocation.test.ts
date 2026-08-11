import { describe, expect, it, vi } from "vitest";

import { handleLegacyDesktopCliInvocation } from "../../../src/main/legacy-cli-invocation";

describe("legacy desktop CLI invocation", () => {
  it("exits before desktop bootstrap with an actionable migration message", () => {
    const writeError = vi.fn();
    const exit = vi.fn();

    const handled = handleLegacyDesktopCliInvocation({
      argv: ["AgentsHub", "--cli", "skill", "list"],
      exit,
      writeError,
    });

    expect(handled).toBe(true);
    expect(exit).toHaveBeenCalledWith(2);
    expect(writeError).toHaveBeenCalledWith(
      expect.stringContaining("standalone AgentsHub CLI"),
    );
  });

  it("leaves normal desktop launches untouched", () => {
    const writeError = vi.fn();
    const exit = vi.fn();

    expect(
      handleLegacyDesktopCliInvocation({
        argv: ["AgentsHub", "--hidden"],
        exit,
        writeError,
      }),
    ).toBe(false);
    expect(exit).not.toHaveBeenCalled();
    expect(writeError).not.toHaveBeenCalled();
  });
});
