import type { ManagedAgentSummary } from "@prompthub/shared/types";

/**
 * Normalize adapter/plugin target ids to their agent platform id.
 *
 * The plugin target matrix uses adapter ids (`claude-code`, `gemini-cli`,
 * `github-copilot`) while agent platforms use shorter ids (`claude`, `gemini`,
 * `copilot`). The rest of the app applies this alias when rendering icons and
 * distributing; agent-target matching must apply it too, otherwise a target
 * like `claude-code` never matches the `claude` agent and its installed plugins
 * are dropped from the Agents page even though the Plugins page shows them.
 */
const TARGET_TO_PLATFORM_ID: Record<string, string> = {
  "claude-code": "claude",
  "gemini-cli": "gemini",
  "github-copilot": "copilot",
};

function normalizeTargetId(id: string | undefined): string | undefined {
  if (!id) return id;
  return TARGET_TO_PLATFORM_ID[id] ?? id;
}

/**
 * Match an adapter target to the selected agent without falling back to
 * display names or path fragments. Target ids are the durable ownership key;
 * displayIconId is the only compatibility alias exposed by the agent model.
 * Adapter target ids (e.g. `claude-code`) are normalized to their platform id
 * (e.g. `claude`) before comparison.
 */
export function matchesManagedAgentTarget(
  candidateIds: Array<string | undefined>,
  agent: ManagedAgentSummary,
): boolean {
  const acceptedIds = new Set(
    [agent.id, agent.displayIconId].filter((value): value is string =>
      Boolean(value),
    ),
  );
  return candidateIds.some((candidate) => {
    const normalized = normalizeTargetId(candidate);
    return normalized !== undefined && acceptedIds.has(normalized);
  });
}
