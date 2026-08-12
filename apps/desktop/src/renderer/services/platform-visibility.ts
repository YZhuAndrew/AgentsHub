import type { SkillPlatform } from "@prompthub/shared/constants/platforms";
import { SHARED_AGENT_SKILLS_TARGET_ID } from "@prompthub/shared/constants/skill-distribution-targets";

/**
 * Low-level disabled-only filter. Keeps every platform whose id is not in the
 * disabled list. Use this directly only when you intentionally want to ignore
 * custom/shared semantics; prefer {@link filterEnabledPlatforms} for surfaces
 * that must match the Settings toggle contract.
 */
export function filterVisiblePlatforms<T extends { id: string }>(
  platforms: T[],
  disabledPlatformIds: string[],
): T[] {
  if (disabledPlatformIds.length === 0) {
    return platforms;
  }

  const disabledSet = new Set(disabledPlatformIds);
  return platforms.filter((platform) => !disabledSet.has(platform.id));
}

export function isPlatformVisible(
  platformId: string,
  disabledPlatformIds: string[],
): boolean {
  return !disabledPlatformIds.includes(platformId);
}

export function isExplicitlyConfiguredPlatform(
  platform: SkillPlatform,
): boolean {
  return platform.isCustom === true || platform.isConfigured === true;
}

export interface PlatformEnabledContext {
  disabledPlatformIds: string[];
  /**
   * Returns whether a custom Agent platform is enabled. When omitted, custom
   * platforms are treated as enabled (matching `customAgent.enabled !== false`).
   */
  customAgentEnabled?: (platformId: string) => boolean;
}

/**
 * Authoritative "is this platform enabled" predicate shared by Settings and
 * every Skills distribution / Agent list surface.
 *
 * Detection is intentionally NOT consulted here: an enabled platform remains
 * visible even when its root directory is absent on disk. The skill installer
 * creates missing roots, so on-disk detection is a hint (shown in the row),
 * not a gate. This keeps the Skills list consistent with the Settings toggle.
 */
export function isPlatformEnabled(
  platform: { id: string; isCustom?: boolean },
  ctx: PlatformEnabledContext,
): boolean {
  if (platform.id === SHARED_AGENT_SKILLS_TARGET_ID) {
    return true;
  }

  if (platform.isCustom) {
    return ctx.customAgentEnabled?.(platform.id) !== false;
  }

  return !ctx.disabledPlatformIds.includes(platform.id);
}

/**
 * Distribution / Agent list membership: platforms that pass
 * {@link isPlatformEnabled}. Use this everywhere a platform list must agree
 * with the Settings "Platform Display Order" toggle.
 */
export function filterEnabledPlatforms(
  platforms: SkillPlatform[],
  ctx: PlatformEnabledContext,
): SkillPlatform[] {
  return platforms.filter((platform) => isPlatformEnabled(platform, ctx));
}

/**
 * Detection-only visibility: platforms whose roots already exist on disk,
 * minus disabled. Use this for surfaces that browse real installations; do not
 * use it for distribution pickers (use {@link filterEnabledPlatforms}).
 */
export function filterDetectedPlatforms(
  platforms: SkillPlatform[],
  detectedPlatformIds: string[],
  disabledPlatformIds: string[],
): SkillPlatform[] {
  return filterVisiblePlatforms(
    platforms.filter((platform) => detectedPlatformIds.includes(platform.id)),
    disabledPlatformIds,
  );
}
