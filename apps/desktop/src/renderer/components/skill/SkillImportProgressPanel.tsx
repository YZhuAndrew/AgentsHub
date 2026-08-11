import { useTranslation } from "react-i18next";
import { LoaderIcon } from "lucide-react";
import type { SkillImportProgressDetail } from "@prompthub/shared/types";

interface SkillImportProgressPanelProps {
  progress: SkillImportProgressDetail | null;
  /** Batch counter when importing multiple skills (renderer-side tracking). */
  batchIndex?: number;
  batchTotal?: number;
  batchSkillName?: string;
}

/**
 * Renders detailed Git-import progress: a phase label, an optional live clone
 * percentage bar, and an optional batch counter. Falls back to a generic
 * spinner + label when no detail is available yet.
 */
export function SkillImportProgressPanel({
  progress,
  batchIndex,
  batchTotal,
  batchSkillName,
}: SkillImportProgressPanelProps) {
  const { t } = useTranslation();
  const phaseLabel = progress ? resolvePhaseLabel(progress, t) : null;
  const showBatch =
    typeof batchIndex === "number" &&
    typeof batchTotal === "number" &&
    batchTotal > 1;
  const clonePercent = progress?.clonePercent;

  return (
    <div
      data-testid="skill-import-progress-panel"
      className="rounded-xl border border-border bg-muted/30 px-4 py-3"
    >
      <div className="flex items-center gap-3">
        <LoaderIcon
          aria-hidden="true"
          className="w-4 h-4 shrink-0 animate-spin text-primary"
        />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground truncate">
            {phaseLabel ??
              t(
                "skill.importProgress.processing",
                "Processing…",
              )}
          </div>
          {showBatch ? (
            <div className="mt-0.5 text-xs text-muted-foreground truncate">
              {t(
                "skill.importProgress.item",
                "{{index}} / {{total}}: {{name}}",
                {
                  index: batchIndex,
                  total: batchTotal,
                  name: batchSkillName ?? "",
                },
              )}
            </div>
          ) : null}
        </div>
        {typeof clonePercent === "number" ? (
          <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
            {`${clonePercent}%`}
          </span>
        ) : null}
      </div>
      {typeof clonePercent === "number" ? (
        <div
          className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={clonePercent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-200"
            style={{ width: `${Math.min(Math.max(clonePercent, 0), 100)}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}

function resolvePhaseLabel(
  progress: SkillImportProgressDetail,
  t: ReturnType<typeof useTranslation>["t"],
): string | null {
  // The main process sends a structured `message` token that the renderer maps
  // to a localized label. Unknown tokens fall back to a generic label.
  const messageKey = progress.message;
  const keyMap: Record<string, string> = {
    "cloning-repository": "skill.importProgress.cloning",
    "reading-files-fingerprint": "skill.importProgress.readingFiles",
    "safety-scanning": "skill.importProgress.safetyScanning",
    "writing-install": "skill.importProgress.applying",
    "applying-install": "skill.importProgress.applying",
    "applying-update": "skill.importProgress.applying",
    "finalizing-install": "skill.importProgress.finalizing",
    "finalizing-update": "skill.importProgress.finalizing",
    "listing-entries": "skill.importProgress.listingEntries",
  };
  const i18nKey = keyMap[messageKey];
  if (!i18nKey) return null;
  return t(i18nKey, resolvePhaseDefault(messageKey));
}

function resolvePhaseDefault(messageKey: string): string {
  switch (messageKey) {
    case "cloning-repository":
      return "Cloning repository…";
    case "reading-files-fingerprint":
      return "Reading files and computing fingerprint…";
    case "safety-scanning":
      return "Running safety scan…";
    case "writing-install":
    case "applying-install":
    case "applying-update":
      return "Writing install…";
    case "finalizing-install":
    case "finalizing-update":
      return "Finalizing…";
    case "listing-entries":
      return "Listing SKILL.md entries…";
    default:
      return "Processing…";
  }
}
