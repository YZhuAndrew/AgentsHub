import type { ScannedSkill, Skill } from "@prompthub/shared/types";
import type {
  SkillFilterType,
  SkillStoreView,
} from "../stores/skill.store";

interface FilterVisibleSkillsOptions {
  deployedSkillNames: Set<string>;
  filterTags?: string[];
  filterType: SkillFilterType;
  /** When set, only skills whose author matches (case-insensitive) remain. */
  filterAuthor?: string | null;
  searchQuery?: string;
  skills: Skill[];
  storeView: SkillStoreView;
}

function isSkillDeployed(skill: Skill, deployedSkillNames: Set<string>): boolean {
  return deployedSkillNames.has(skill.id) || deployedSkillNames.has(skill.name);
}

export function filterVisibleSkills({
  deployedSkillNames,
  filterTags = [],
  filterType,
  filterAuthor = null,
  searchQuery = "",
  skills,
  storeView,
}: FilterVisibleSkillsOptions): Skill[] {
  let result = skills;

  if (storeView === "distribution") {
    result = result.filter((skill) => isSkillDeployed(skill, deployedSkillNames));
  } else if (filterType === "favorites") {
    result = result.filter((skill) => skill.is_favorite);
  } else if (filterType === "installed") {
    result = result.filter((skill) => Boolean(skill.registry_slug));
  } else if (filterType === "deployed") {
    result = result.filter((skill) => isSkillDeployed(skill, deployedSkillNames));
  } else if (filterType === "pending") {
    result = result.filter((skill) => !isSkillDeployed(skill, deployedSkillNames));
  }

  if (filterTags.length > 0) {
    result = result.filter(
      (skill) =>
        skill.tags && filterTags.some((tag) => skill.tags?.includes(tag)),
    );
  }

  const authorFilter = filterAuthor?.trim().toLowerCase();
  if (authorFilter) {
    result = result.filter(
      (skill) => (skill.author ?? "").trim().toLowerCase() === authorFilter,
    );
  }

  const query = searchQuery.trim().toLowerCase();
  if (!query) {
    return result;
  }

  return result.filter((skill) => {
    const fields = [
      skill.name,
      skill.description || "",
      skill.author || "",
      skill.instructions || "",
      skill.content || "",
      skill.source_url || "",
      skill.local_repo_path || "",
      ...(skill.tags || []),
    ];

    return fields.some((value) => value.toLowerCase().includes(query));
  });
}

export function filterVisibleScannedSkills(
  scannedSkills: ScannedSkill[],
  searchQuery = "",
): ScannedSkill[] {
  const query = searchQuery.trim().toLowerCase();
  if (!query) {
    return scannedSkills;
  }

  return scannedSkills.filter((skill) => {
    const fields = [
      skill.name,
      skill.description || "",
      skill.author || "",
      skill.instructions || "",
      skill.filePath || "",
      skill.localPath || "",
      ...(skill.tags || []),
      ...(skill.platforms || []),
    ];

    return fields.some(
      (value) =>
        typeof value === "string" && value.toLowerCase().includes(query),
    );
  });
}
