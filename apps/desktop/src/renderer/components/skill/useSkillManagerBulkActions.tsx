import { useMemo } from "react";
import type { TFunction } from "i18next";
import type { Skill } from "@prompthub/shared/types";
import type { SelectOption } from "../ui/Select";
import { useSkillStore } from "../../stores/skill.store";
import { useToast } from "../ui/Toast";

/**
 * Derives author-filter options from the visible skills and provides the
 * "check all updates" / "batch update selected" handlers. Extracted from
 * SkillManager to keep that orchestrator under the file-size budget.
 */
export function useSkillManagerBulkActions({
  baseFilteredSkills,
  selectedSkills,
  setSelectedSkillIds,
  t,
}: {
  baseFilteredSkills: Skill[];
  selectedSkills: Skill[];
  setSelectedSkillIds: (ids: Set<string>) => void;
  t: TFunction;
}) {
  const checkAllSkillUpdates = useSkillStore(
    (state) => state.checkAllSkillUpdates,
  );
  const batchUpdateSelectedSkills = useSkillStore(
    (state) => state.batchUpdateSelectedSkills,
  );
  const { showToast } = useToast();

  const authorFilterOptions = useMemo<SelectOption[]>(() => {
    const counts = new Map<string, number>();
    for (const skill of baseFilteredSkills) {
      const author = skill.author?.trim();
      if (!author) continue;
      counts.set(author, (counts.get(author) ?? 0) + 1);
    }
    const entries = Array.from(counts.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );
    return [
      {
        value: "all",
        label: (
          <span className="flex w-full items-center justify-between gap-2">
            <span>{t("skill.authorFilterAll", "All Authors")}</span>
            <span className="text-xs text-muted-foreground">
              {baseFilteredSkills.length}
            </span>
          </span>
        ),
        labelText: t("skill.authorFilterAll", "All Authors"),
      },
      ...entries.map(([author, count]) => ({
        value: author,
        label: (
          <span className="flex w-full items-center justify-between gap-2">
            <span className="truncate">{author}</span>
            <span className="text-xs text-muted-foreground">{count}</span>
          </span>
        ),
        labelText: author,
      })),
    ];
  }, [baseFilteredSkills, t]);

  const handleCheckAllUpdates = async () => {
    const summary = await checkAllSkillUpdates();
    showToast(
      t(
        "skill.checkAllUpdatesSummary",
        "Checked {{checked}}: {{updated}} with updates, {{upToDate}} up-to-date, {{failed}} failed.",
        {
          checked: summary.checked,
          updated: summary.updated,
          upToDate: summary.upToDate,
          failed: summary.failed,
        },
      ),
      summary.failed > 0 ? "error" : "success",
    );
  };

  const handleBatchUpdateSelected = async () => {
    if (selectedSkills.length === 0) return;
    const result = await batchUpdateSelectedSkills(
      selectedSkills.map((s) => s.id),
    );
    showToast(
      t(
        "skill.batchUpdateSummary",
        "Updated {{succeeded}}, failed {{failed}}.",
        {
          succeeded: result.succeeded.length,
          failed: result.failed.length,
        },
      ),
      result.failed.length > 0 ? "error" : "success",
    );
    setSelectedSkillIds(new Set());
  };

  return {
    authorFilterOptions,
    handleCheckAllUpdates,
    handleBatchUpdateSelected,
  };
}
