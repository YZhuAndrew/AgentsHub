import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// See issue #115 — when the user toggles "minimize on launch" in the UI,
// the setting was only persisted to localStorage (zustand persist). The main
// process — which reads from the SQLite settings table — never saw it.
// This suite guards that the store now also pushes the value to main via
// window.api.settings.set.

const changeLanguageMock = vi.fn();

vi.mock("../../../src/renderer/i18n", () => ({
  __esModule: true,
  default: { language: "en" },
  changeLanguage: changeLanguageMock,
}));

async function importStoreWithSpy() {
  vi.resetModules();
  localStorage.clear();
  const setSpy = vi.fn().mockResolvedValue(undefined);
  window.api = {
    ...(window.api ?? {}),
    settings: {
      ...(window.api?.settings ?? {}),
      set: setSpy,
    },
  };
  const mod = await import("../../../src/renderer/stores/settings.store");
  // Wait one microtask so any async rehydration callback can settle.
  await Promise.resolve();
  return { useSettingsStore: mod.useSettingsStore, setSpy };
}

function lastPayloadWithKey(
  spy: ReturnType<typeof vi.fn>,
  key: string,
): Record<string, unknown> | undefined {
  // Scan from the most recent call backwards so we pick up the latest write.
  for (let i = spy.mock.calls.length - 1; i >= 0; i -= 1) {
    const payload = spy.mock.calls[i]?.[0] as
      | Record<string, unknown>
      | undefined;
    if (payload && key in payload) {
      return payload;
    }
  }
  return undefined;
}

describe("settings startup behavior sync (issue #115)", () => {
  beforeEach(() => {
    changeLanguageMock.mockReset();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it.each([
    { value: true, label: "true" },
    { value: false, label: "false" },
  ])(
    "syncs minimizeOnLaunch=$label to the main process when toggled",
    async ({ value }) => {
      const { useSettingsStore, setSpy } = await importStoreWithSpy();

      useSettingsStore.getState().setMinimizeOnLaunch(value);

      expect(useSettingsStore.getState().minimizeOnLaunch).toBe(value);
      expect(
        lastPayloadWithKey(setSpy, "minimizeOnLaunch")?.minimizeOnLaunch,
      ).toBe(value);
    },
  );

  it.each([
    { value: true, label: "true" },
    { value: false, label: "false" },
  ])(
    "syncs launchAtStartup=$label to the main process when toggled",
    async ({ value }) => {
      const { useSettingsStore, setSpy } = await importStoreWithSpy();

      useSettingsStore.getState().setLaunchAtStartup(value);

      expect(useSettingsStore.getState().launchAtStartup).toBe(value);
      expect(
        lastPayloadWithKey(setSpy, "launchAtStartup")?.launchAtStartup,
      ).toBe(value);
    },
  );
});

describe("startup module setting", () => {
  beforeEach(() => {
    changeLanguageMock.mockReset();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("defaults to \"last\" so the previously active module is restored", async () => {
    const { useSettingsStore } = await importStoreWithSpy();

    expect(useSettingsStore.getState().startupModule).toBe("last");
  });

  it.each([
    { value: "last", label: "last" },
    { value: "agents", label: "agents" },
    { value: "prompt", label: "prompt" },
    { value: "skill", label: "skill" },
    { value: "mcp", label: "mcp" },
    { value: "plugin", label: "plugin" },
    { value: "rules", label: "rules" },
  ] as const)(
    "syncs startupModule=$label to the main process when changed",
    async ({ value }) => {
      const { useSettingsStore, setSpy } = await importStoreWithSpy();

      useSettingsStore.getState().setStartupModule(value);

      expect(useSettingsStore.getState().startupModule).toBe(value);
      expect(
        lastPayloadWithKey(setSpy, "startupModule")?.startupModule,
      ).toBe(value);
    },
  );

  it("normalizes an unknown value back to \"last\"", async () => {
    const { useSettingsStore } = await importStoreWithSpy();

    // Invalid values must not be stored as-is (defends against DB corruption).
    useSettingsStore.getState().setStartupModule("not-a-module" as never);

    expect(useSettingsStore.getState().startupModule).toBe("last");
  });
});
