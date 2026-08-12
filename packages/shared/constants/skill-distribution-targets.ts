import { SKILL_PLATFORMS } from "@prompthub/shared/constants/platforms";

/**
 * Canonical id of the shared user-level Skill distribution target
 * (`~/.agents/skills`). Shared as the single contract constant so renderer
 * services and visibility logic do not hardcode the literal.
 */
export const SHARED_AGENT_SKILLS_TARGET_ID = "agent-skills-global";

export interface SharedSkillDistributionTarget {
  id: typeof SHARED_AGENT_SKILLS_TARGET_ID;
  kind: "shared";
  name: string;
  maturity: "experimental";
  relativePath: ".agents/skills";
}

export interface PlatformSkillDistributionTarget {
  id: string;
  kind: "platform";
  name: string;
  platformId: string;
}

export type SkillDistributionTarget =
  | SharedSkillDistributionTarget
  | PlatformSkillDistributionTarget;

export const SHARED_SKILL_DISTRIBUTION_TARGETS: readonly SharedSkillDistributionTarget[] =
  [
    {
      id: SHARED_AGENT_SKILLS_TARGET_ID,
      kind: "shared",
      name: "Shared Agent Skills",
      maturity: "experimental",
      relativePath: ".agents/skills",
    },
  ];

export function getSkillDistributionTargets(): SkillDistributionTarget[] {
  return [
    ...SKILL_PLATFORMS.map((platform) => ({
      id: platform.id,
      kind: "platform" as const,
      name: platform.name,
      platformId: platform.id,
    })),
    ...SHARED_SKILL_DISTRIBUTION_TARGETS,
  ];
}
