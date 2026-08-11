import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  mergePersistedSkillState,
  partializeSkillState,
} from "../../../src/renderer/stores/skill/skill-store-persistence";
import type { SkillState } from "../../../src/renderer/stores/skill/skill-store-types";

const SCHEMA_KEY = "skill-store-schema-version";

function baseState(): SkillState {
  return {
    skills: [],
    selectedSkillId: null,
    isLoading: false,
    error: null,
    viewMode: "list",
    galleryColumns: "auto",
    searchQuery: "",
    filterType: "all",
    filterTags: [],
    filterAuthor: null,
    deployedSkillNames: new Set<string>(),
    pendingPluginChildDeploySkillIds: [],
    storeView: "my-skills",
    selectedProjectId: null,
    projectScanState: {},
    agentScanState: {},
    registrySkills: [],
    isLoadingRegistry: false,
    skillUpdateStatuses: {},
    isCheckingAllUpdates: false,
    lastBulkCheckAt: null,
    storeCategory: "all",
    storeSearchQuery: "",
    selectedRegistrySlug: null,
    customStoreSources: [],
    selectedStoreSourceId: "official",
    remoteStoreEntries: {},
    translationCache: {},
  } as unknown as SkillState;
}

describe("skill store persistence migration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("resets viewMode to list when persisted schema is old (v1)", () => {
    // An existing user persisted gallery on the old schema and has not been migrated.
    const persisted = { viewMode: "gallery" };
    const merged = mergePersistedSkillState(persisted, baseState());
    expect(merged.viewMode).toBe("list");
    // The schema key is written so a later explicit choice is preserved.
    expect(localStorage.getItem(SCHEMA_KEY)).toBe("2");
  });

  it("preserves an explicit gallery choice once schema is current", () => {
    // Simulate a user who already migrated and then chose gallery.
    localStorage.setItem(SCHEMA_KEY, "2");
    const persisted = { viewMode: "gallery" };
    const merged = mergePersistedSkillState(persisted, baseState());
    expect(merged.viewMode).toBe("gallery");
  });

  it("falls back to current state viewMode when persisted value is invalid", () => {
    localStorage.setItem(SCHEMA_KEY, "2");
    const current = { ...baseState(), viewMode: "list" };
    const merged = mergePersistedSkillState({ viewMode: "bogus" }, current);
    expect(merged.viewMode).toBe("list");
  });

  it("partialize does not leak session-only update statuses or author filter", () => {
    const state = {
      ...baseState(),
      viewMode: "list",
      filterAuthor: "JimLiu",
      skillUpdateStatuses: { s1: { status: "update-available" } as never },
      isCheckingAllUpdates: true,
      lastBulkCheckAt: 123,
    };
    const partial = partializeSkillState(state as SkillState);
    expect(partial.viewMode).toBe("list");
    expect("filterAuthor" in partial).toBe(false);
    expect("skillUpdateStatuses" in partial).toBe(false);
    expect("isCheckingAllUpdates" in partial).toBe(false);
    expect("lastBulkCheckAt" in partial).toBe(false);
  });
});
