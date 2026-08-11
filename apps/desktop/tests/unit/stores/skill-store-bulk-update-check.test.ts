import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../src/renderer/services/ai", () => ({
  chatCompletion: vi.fn(),
}));
vi.mock("../../../src/renderer/services/webdav-save-sync", () => ({
  scheduleAllSaveSync: vi.fn(),
}));

import { useSkillStore } from "../../../src/renderer/stores/skill.store";
import type { Skill } from "@prompthub/shared/types";
import { installWindowMocks } from "../../helpers/window";

function makeSkill(overrides: Partial<Skill> = {}): Skill {
  return {
    id: overrides.id ?? "skill-1",
    name: overrides.name ?? "writer",
    protocol_type: "skill",
    is_favorite: false,
    created_at: 1,
    updated_at: 1,
    ...overrides,
  } as Skill;
}

function resetStore(skills: Skill[] = []) {
  useSkillStore.setState({
    skills,
    selectedSkillId: null,
    isLoading: false,
    error: null,
    viewMode: "list",
    searchQuery: "",
    filterType: "all",
    filterTags: [],
    filterAuthor: null,
    deployedSkillNames: new Set<string>(),
    storeView: "my-skills",
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
    pendingPluginChildDeploySkillIds: [],
    translationCache: {},
  });
}

describe("skill store bulk update check", () => {
  beforeEach(() => {
    installWindowMocks();
    localStorage.clear();
    resetStore();
  });

  it("checks all checkable skills, aggregates statuses, and clears the busy flag", async () => {
    const skills = [
      makeSkill({ id: "s1", name: "a", source_url: "https://github.com/o/a" }),
      makeSkill({ id: "s2", name: "b", source_url: "https://github.com/o/b" }),
      makeSkill({ id: "s3", name: "c" /* no source */ }),
    ];
    resetStore(skills);

    // Stub the per-skill check to return controlled statuses.
    const statuses = {
      s1: "update-available",
      s2: "up-to-date",
    } as const;
    const getInstalledSkillSourceUpdateStatus = vi.fn(async (skillId: string) => ({
      status: statuses[skillId as keyof typeof statuses] ?? "up-to-date",
      skillId,
      registrySkill: { slug: skillId, name: skillId } as never,
      remoteHash: "h",
      remoteContent: "",
      localModified: false,
      remoteChanged: statuses[skillId as keyof typeof statuses] === "update-available",
      shouldInitializeBaseline: false,
      hasStaleTargets: false,
    }));
    useSkillStore.setState({ getInstalledSkillSourceUpdateStatus });

    const summary = await useSkillStore.getState().checkAllSkillUpdates();

    // s3 has no source candidate, so only s1/s2 are checked.
    expect(summary.checked).toBe(2);
    expect(summary.updated).toBe(1);
    expect(summary.upToDate).toBe(1);
    expect(summary.failed).toBe(0);
    expect(useSkillStore.getState().isCheckingAllUpdates).toBe(false);
    const stored = useSkillStore.getState().skillUpdateStatuses;
    expect(stored.s1.status).toBe("update-available");
    expect(stored.s2.status).toBe("up-to-date");
    expect(useSkillStore.getState().lastBulkCheckAt).toBeGreaterThan(0);
  });

  it("records failures without aborting the batch", async () => {
    const skills = [
      makeSkill({ id: "s1", name: "a", source_url: "https://github.com/o/a" }),
      makeSkill({ id: "s2", name: "b", source_url: "https://github.com/o/b" }),
    ];
    resetStore(skills);

    const getInstalledSkillSourceUpdateStatus = vi.fn(async (skillId: string) => {
      if (skillId === "s2") throw new Error("network down");
      return {
        status: "update-available",
        skillId,
        registrySkill: { slug: skillId, name: skillId } as never,
        remoteHash: "h",
        remoteContent: "",
        localModified: false,
        remoteChanged: true,
        shouldInitializeBaseline: false,
        hasStaleTargets: false,
      };
    });
    useSkillStore.setState({ getInstalledSkillSourceUpdateStatus });

    const summary = await useSkillStore.getState().checkAllSkillUpdates();

    expect(summary.checked).toBe(2);
    expect(summary.updated).toBe(1);
    expect(summary.failed).toBe(1);
    expect(useSkillStore.getState().skillUpdateStatuses.s1.status).toBe(
      "update-available",
    );
    // s2 failed, so it has no stored status but is counted as failed.
    expect(useSkillStore.getState().skillUpdateStatuses.s2).toBeUndefined();
  });

  it("does not start a second run while one is in progress", async () => {
    const skills = [
      makeSkill({ id: "s1", name: "a", source_url: "https://github.com/o/a" }),
    ];
    resetStore(skills);
    const getInstalledSkillSourceUpdateStatus = vi.fn(async () => ({
      status: "up-to-date",
      skillId: "s1",
      registrySkill: { slug: "s1", name: "s1" } as never,
      remoteHash: "h",
      remoteContent: "",
      localModified: false,
      remoteChanged: false,
      shouldInitializeBaseline: false,
      hasStaleTargets: false,
    }));
    useSkillStore.setState({ getInstalledSkillSourceUpdateStatus, isCheckingAllUpdates: true });

    const summary = await useSkillStore.getState().checkAllSkillUpdates();
    expect(summary.checked).toBe(0);
    expect(getInstalledSkillSourceUpdateStatus).not.toHaveBeenCalled();
  });
});

describe("skill store default view mode", () => {
  beforeEach(() => {
    installWindowMocks();
    localStorage.clear();
  });

  it("defaults to list view on a fresh store", () => {
    resetStore();
    expect(useSkillStore.getState().viewMode).toBe("list");
  });

  it("setFilterAuthor trims and nulls blank input", () => {
    resetStore();
    useSkillStore.getState().setFilterAuthor("  JimLiu  ");
    expect(useSkillStore.getState().filterAuthor).toBe("JimLiu");
    useSkillStore.getState().setFilterAuthor("   ");
    expect(useSkillStore.getState().filterAuthor).toBeNull();
  });

  it("clearSkillUpdateStatuses resets statuses and lastBulkCheckAt", async () => {
    const skills = [
      makeSkill({ id: "s1", name: "a", source_url: "https://github.com/o/a" }),
    ];
    resetStore(skills);
    useSkillStore.setState({
      skillUpdateStatuses: { s1: { status: "update-available" } as never },
      lastBulkCheckAt: 123,
    });
    useSkillStore.getState().clearSkillUpdateStatuses();
    expect(useSkillStore.getState().skillUpdateStatuses).toEqual({});
    expect(useSkillStore.getState().lastBulkCheckAt).toBeNull();
  });
});
