import type { RegistrySkill, SkillStoreSource } from "@prompthub/shared/types";
import { buildSkillSourceId } from "@prompthub/shared/utils/skill-identity";
import { normalizeGitStoreSourceInput } from "../../services/skill-store-source";
import { isLocalRegistrySkill } from "../../services/skill-source-resolver";
import { normalizeSkillStoreSourceIdForRuntime } from "../../services/cloud-store";
import {
  sanitizePersistedAgentScanState,
  sanitizePersistedProjectScanState,
  type AgentSkillScanState,
  type ProjectSkillScanState,
} from "../../services/skill-scan-persistence";
import {
  pruneSkillTranslationCache,
  type SkillTranslationCacheEntry,
} from "../../services/skill-translation-cache";
import { ensureRegistrySkillSourceId } from "./skill-source-update-workflow";
import type { SkillState, SkillViewMode } from "./skill-store-types";

type RemoteStoreEntry = SkillState["remoteStoreEntries"][string];

/**
 * Bumped when the persisted skill-store shape changes and existing users should
 * be migrated. v2: the library default switched from gallery to list; users on
 * the old default are reset to the new default once.
 */
const SKILL_STORE_SCHEMA_VERSION = 2;
const DEFAULT_SKILL_VIEW_MODE: SkillViewMode = "list";

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isRegistrySkillLike(value: unknown): value is RegistrySkill {
  if (!isObjectRecord(value)) {
    return false;
  }

  return (
    typeof value.slug === "string" &&
    typeof value.name === "string" &&
    typeof value.description === "string" &&
    typeof value.category === "string" &&
    typeof value.author === "string" &&
    typeof value.source_url === "string" &&
    typeof value.version === "string" &&
    typeof value.content === "string" &&
    Array.isArray(value.tags)
  );
}

function getRegistrySkillPath(skill: RegistrySkill): string {
  return skill.canonical_skill_path || skill.content_url || skill.slug;
}

function normalizeGitRemoteRegistrySkill(
  skill: RegistrySkill,
  source: SkillStoreSource,
  skillPath: string,
): RegistrySkill {
  const normalizedSource = normalizeGitStoreSourceInput(
    source.url,
    source.branch,
    source.directory,
  );
  return {
    ...skill,
    source_id: buildSkillSourceId({
      sourceType: "git-repo",
      sourceUrl: normalizedSource.url,
      branch: normalizedSource.branch,
      directory: normalizedSource.directory,
      skillPath,
    }),
    source_branch: normalizedSource.branch,
    source_directory: normalizedSource.directory,
    canonical_skill_path: skillPath,
  };
}

function normalizeLocalRemoteRegistrySkill(
  skill: RegistrySkill,
  source: SkillStoreSource | undefined,
  skillPath: string,
): RegistrySkill {
  return {
    ...skill,
    source_id: buildSkillSourceId({
      sourceType: "local-dir",
      sourceUrl: skill.source_url || source?.url,
      skillPath,
    }),
    source_branch: undefined,
    source_directory: undefined,
    canonical_skill_path: skillPath,
  };
}

function normalizeMarketplaceRemoteRegistrySkill(
  skill: RegistrySkill,
  source: SkillStoreSource,
  skillPath: string,
): RegistrySkill {
  return {
    ...skill,
    source_id: buildSkillSourceId({
      sourceType: "marketplace-json",
      sourceUrl: skill.source_url || source.url,
      skillPath,
    }),
    canonical_skill_path: skillPath,
  };
}

function normalizeRemoteRegistrySkill(
  sourceId: string,
  skill: RegistrySkill,
  customStoreSources: SkillStoreSource[],
): RegistrySkill {
  const source = customStoreSources.find((item) => item.id === sourceId);
  const skillPath = getRegistrySkillPath(skill);
  if (source?.type === "git-repo") {
    try {
      return normalizeGitRemoteRegistrySkill(skill, source, skillPath);
    } catch {
      return skill;
    }
  }
  if (source?.type === "local-dir" || isLocalRegistrySkill(skill)) {
    return normalizeLocalRemoteRegistrySkill(skill, source, skillPath);
  }
  if (source?.type === "marketplace-json") {
    return normalizeMarketplaceRemoteRegistrySkill(skill, source, skillPath);
  }
  return ensureRegistrySkillSourceId(skill);
}

export function normalizeRemoteStoreEntries(
  entries: unknown,
  customStoreSources: SkillStoreSource[],
): SkillState["remoteStoreEntries"] {
  if (!isObjectRecord(entries)) {
    return {};
  }

  const normalizedEntries: SkillState["remoteStoreEntries"] = {};
  for (const [sourceId, entry] of Object.entries(entries)) {
    if (!isObjectRecord(entry) || !Array.isArray(entry.skills)) {
      continue;
    }

    const skills = entry.skills
      .filter(isRegistrySkillLike)
      .map((skill) =>
        normalizeRemoteRegistrySkill(sourceId, skill, customStoreSources),
      );
    if (skills.length === 0) {
      continue;
    }

    normalizedEntries[sourceId] = {
      ...(entry as Partial<RemoteStoreEntry>),
      loadedAt: typeof entry.loadedAt === "number" ? entry.loadedAt : 0,
      error: null,
      skills,
    };
  }

  return normalizedEntries;
}

export function partializeSkillState(state: SkillState) {
  const filteredEntries = normalizeRemoteStoreEntries(
    state.remoteStoreEntries,
    state.customStoreSources,
  );
  return {
    viewMode: state.viewMode,
    galleryColumns: state.galleryColumns,
    filterType: state.filterType,
    storeView: state.storeView,
    selectedProjectId: state.selectedProjectId,
    projectScanState: sanitizePersistedProjectScanState(state.projectScanState),
    agentScanState: sanitizePersistedAgentScanState(state.agentScanState),
    customStoreSources: state.customStoreSources,
    selectedStoreSourceId: state.selectedStoreSourceId,
    remoteStoreEntries: filteredEntries,
    translationCache: pruneSkillTranslationCache(state.translationCache),
  };
}

export function mergePersistedSkillState(
  persistedState: unknown,
  currentState: SkillState,
): SkillState {
  if (!isObjectRecord(persistedState)) {
    return currentState;
  }

  const persistedCustomStoreSources = Array.isArray(
    persistedState.customStoreSources,
  )
    ? (persistedState.customStoreSources as SkillStoreSource[])
    : currentState.customStoreSources;
  const persistedProjectScanState = isObjectRecord(
    persistedState.projectScanState,
  )
    ? (persistedState.projectScanState as Record<string, ProjectSkillScanState>)
    : currentState.projectScanState;
  const persistedAgentScanState = isObjectRecord(persistedState.agentScanState)
    ? (persistedState.agentScanState as Record<string, AgentSkillScanState>)
    : currentState.agentScanState;
  const persistedTranslationCache = isObjectRecord(
    persistedState.translationCache,
  )
    ? (persistedState.translationCache as Record<
        string,
        SkillTranslationCacheEntry
      >)
    : currentState.translationCache;

  // Migrate the library default from gallery to list once for users on the old
  // schema. The schema version is tracked in a dedicated localStorage key so
  // the runtime SkillState type stays clean. After migration the key is
  // current, so a later explicit view-mode choice is preserved.
  const persistedSchemaVersion = readSkillStoreSchemaVersion();
  const migratedViewMode: SkillViewMode =
    persistedSchemaVersion < SKILL_STORE_SCHEMA_VERSION
      ? DEFAULT_SKILL_VIEW_MODE
      : normalizePersistedViewMode(persistedState.viewMode, currentState.viewMode);
  writeSkillStoreSchemaVersion(SKILL_STORE_SCHEMA_VERSION);

  return {
    ...currentState,
    ...persistedState,
    viewMode: migratedViewMode,
    customStoreSources: persistedCustomStoreSources,
    selectedStoreSourceId: normalizeSkillStoreSourceIdForRuntime(
      typeof persistedState.selectedStoreSourceId === "string"
        ? persistedState.selectedStoreSourceId
        : currentState.selectedStoreSourceId,
    ),
    projectScanState: sanitizePersistedProjectScanState(
      persistedProjectScanState,
    ),
    agentScanState: sanitizePersistedAgentScanState(persistedAgentScanState),
    remoteStoreEntries: normalizeRemoteStoreEntries(
      persistedState.remoteStoreEntries,
      persistedCustomStoreSources,
    ),
    translationCache: pruneSkillTranslationCache(persistedTranslationCache),
  };
}

const SKILL_STORE_SCHEMA_KEY = "skill-store-schema-version";

function readSkillStoreSchemaVersion(): number {
  if (typeof localStorage === "undefined") return SKILL_STORE_SCHEMA_VERSION;
  try {
    const raw = localStorage.getItem(SKILL_STORE_SCHEMA_KEY);
    const parsed = raw ? Number.parseInt(raw, 10) : 1;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  } catch {
    return SKILL_STORE_SCHEMA_VERSION;
  }
}

function writeSkillStoreSchemaVersion(version: number): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(SKILL_STORE_SCHEMA_KEY, String(version));
  } catch {
    // Storage may be unavailable (private mode); migration is best-effort.
  }
}

function normalizePersistedViewMode(
  value: unknown,
  fallback: SkillViewMode,
): SkillViewMode {
  return value === "gallery" || value === "list" ? value : fallback;
}
