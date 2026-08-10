import { describe, expect, it } from "vitest";

import { resolveStartupAppModule } from "../../../src/renderer/stores/ui.store";

/**
 * `resolveStartupAppModule` is the pure decision the App startup sequence uses
 * to honor the `startupModule` setting. It is extracted from `App.tsx` so the
 * contract is testable without booting the full app startup (which has many
 * side effects: window visibility, auto-sync, updater, etc.).
 *
 * The two behaviors that matter for users:
 *  1. A concrete preference (e.g. "agents") always wins, even if the persisted
 *     module was something else.
 *  2. "last" restores the previously active module (the existing default).
 */
describe("resolveStartupAppModule", () => {
  it("returns the concrete preference when it is a valid module", () => {
    expect(resolveStartupAppModule("agents", "prompt")).toBe("agents");
    expect(resolveStartupAppModule("skill", "agents")).toBe("skill");
    expect(resolveStartupAppModule("mcp", "rules")).toBe("mcp");
    expect(resolveStartupAppModule("plugin", "prompt")).toBe("plugin");
    expect(resolveStartupAppModule("rules", "agents")).toBe("rules");
    expect(resolveStartupAppModule("prompt", "agents")).toBe("prompt");
  });

  it("restores the persisted module when the preference is \"last\"", () => {
    expect(resolveStartupAppModule("last", "agents")).toBe("agents");
    expect(resolveStartupAppModule("last", "skill")).toBe("skill");
    expect(resolveStartupAppModule("last", "prompt")).toBe("prompt");
  });

  it("falls back to \"prompt\" for an invalid persisted module under \"last\"", () => {
    // Defensive: a corrupted persisted value must not surface as an invalid
    // module. normalizeAppModule clamps unknown values to "prompt".
    expect(
      resolveStartupAppModule("last", "garbage" as never),
    ).toBe("prompt");
  });
});
