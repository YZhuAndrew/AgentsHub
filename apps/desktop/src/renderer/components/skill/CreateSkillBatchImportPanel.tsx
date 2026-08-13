import { useEffect, useState, type DragEvent } from "react";
import {
  AlertTriangleIcon,
  CheckIcon,
  GithubIcon,
  Loader2Icon,
  PackageIcon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import type { CreateSkillModalController } from "./useCreateSkillModalController";
import { useToast } from "../ui/Toast";
import {
  isSkillArchivePath,
  parseBatchUrls,
  resolveDroppedFilePath,
} from "./batch-import-utils";

export function CreateSkillBatchImportPanel({
  controller,
}: {
  controller: CreateSkillModalController;
}) {
  const { t } = controller;
  const { showToast } = useToast();
  const [isDropTargetActive, setIsDropTargetActive] = useState(false);
  const [urlText, setUrlText] = useState("");

  // Surface a one-shot summary toast when a batch completes.
  useEffect(() => {
    if (!controller.summary) return;
    const { succeeded, failed } = controller.summary;
    showToast(
      t("skill.batchImportSummary", {
        succeeded,
        failed,
        defaultValue: `Imported ${succeeded}, failed ${failed}`,
      }),
      failed > 0 && succeeded === 0
        ? "error"
        : succeeded > 0
          ? "success"
          : "warning",
    );
  }, [controller.summary, controller.t, showToast]);

  const readyCount = controller.items.filter(
    (item) => item.status === "ready",
  ).length;
  const busy = controller.isPreviewing || controller.isRunning;

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDropTargetActive(false);
    const files = Array.from(event.dataTransfer.files ?? []);
    const zipPaths = files
      .filter(isSkillArchivePath)
      .map(resolveDroppedFilePath)
      .filter((path) => path.length > 0);
    if (zipPaths.length > 0) controller.addZipPaths(zipPaths);
  };

  const handleSelectArchives = async () => {
    const paths = (await window.electron?.selectSkillArchives?.()) ?? [];
    if (paths.length > 0) controller.addZipPaths(paths);
  };

  const handleAddUrls = () => {
    const urls = parseBatchUrls(urlText);
    if (urls.length === 0) return;
    controller.addUrlsFromText(urlText);
    setUrlText("");
  };

  return (
    <div className="flex flex-1 min-h-0 flex-col gap-4 overflow-y-auto p-1">
      {/* Drop + select ZIPs */}
      <div
        role="button"
        tabIndex={0}
        aria-label={t("skill.batchDropzoneLabel", "Drop ZIP archives here")}
        onDragOver={(event) => {
          event.preventDefault();
          if (!busy) setIsDropTargetActive(true);
        }}
        onDragLeave={() => setIsDropTargetActive(false)}
        onDrop={handleDrop}
        onClick={handleSelectArchives}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          void handleSelectArchives();
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          isDropTargetActive
            ? "border-primary bg-primary/10"
            : "border-border hover:border-primary/40 hover:bg-accent/40"
        }`}
      >
        <UploadIcon className="h-6 w-6 text-muted-foreground" aria-hidden />
        <div className="text-sm font-medium">
          {t("skill.batchDropzoneTitle", "Drop ZIP archives or click to select")}
        </div>
        <div className="text-xs text-muted-foreground">
          {t(
            "skill.batchDropzoneHint",
            "One skill per archive (.zip). Multiple files supported.",
          )}
        </div>
      </div>

      {/* GitHub URLs */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("skill.batchUrlsLabel", "Git repository URLs")}
        </label>
        <textarea
          value={urlText}
          onChange={(event) => setUrlText(event.target.value)}
          placeholder={t(
            "skill.batchUrlsPlaceholder",
            "One URL per line (https://github.com/owner/repo)",
          )}
          rows={3}
          className="w-full resize-y rounded-lg border border-border bg-background p-2 text-sm focus:border-primary focus:outline-none"
        />
        <button
          type="button"
          onClick={handleAddUrls}
          disabled={busy || !urlText.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          <GithubIcon className="h-3.5 w-3.5" aria-hidden />
          {t("skill.batchAddUrls", "Add URLs")}
        </button>
      </div>

      {/* Items */}
      {controller.items.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("skill.batchItems", "Sources")} ({controller.items.length})
            </span>
            <button
              type="button"
              onClick={controller.clearAll}
              disabled={busy}
              className="text-[11px] text-muted-foreground hover:underline disabled:opacity-40"
            >
              {t("skill.batchClear", "Clear")}
            </button>
          </div>
          {controller.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-accent/30 px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                {item.source.kind === "git" ? (
                  <GithubIcon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                ) : (
                  <PackageIcon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                )}
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {item.name ?? item.label}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {item.label}
                  </div>
                  {item.reason ? (
                    <div className="truncate text-[11px] text-destructive">
                      {item.reason}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <BatchStatusBadge status={item.status} t={t} />
                <button
                  type="button"
                  onClick={() => controller.removeItem(item.id)}
                  disabled={busy}
                  aria-label={t("common.remove", "Remove")}
                  className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-40"
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Progress */}
      {controller.progress ? (
        <div className="space-y-1 rounded-lg border border-border bg-accent/20 p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2Icon className="h-3.5 w-3.5 animate-spin" aria-hidden />
            {controller.progress.index} / {controller.progress.total}
            {controller.progress.skillName
              ? `: ${controller.progress.skillName}`
              : ""}
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{
                width: `${Math.max(
                  6,
                  Math.round(
                    (controller.progress.index / controller.progress.total) *
                      100,
                  ),
                )}%`,
              }}
            />
          </div>
        </div>
      ) : null}

      {/* Failures */}
      {controller.failures.length > 0 ? (
        <div className="space-y-1 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-destructive">
            <AlertTriangleIcon className="h-3.5 w-3.5" aria-hidden />
            {t("skill.batchFailures", "Failed items")} ({controller.failures.length})
          </div>
          {controller.failures.slice(0, 6).map((failure, index) => (
            <div key={index} className="text-[11px] text-destructive">
              {failure.label}: {failure.reason}
            </div>
          ))}
        </div>
      ) : null}

      {/* Summary */}
      {controller.summary ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-accent/20 p-3 text-xs">
          <CheckIcon className="h-3.5 w-3.5 text-primary" aria-hidden />
          {t("skill.batchSummaryDetail", {
            succeeded: controller.summary.succeeded,
            failed: controller.summary.failed,
            reviewRequired: controller.summary.reviewRequired,
            defaultValue:
              "Installed {{succeeded}}, failed {{failed}}, needs review {{reviewRequired}}",
          })}
        </div>
      ) : null}

      {/* Actions */}
      <div className="mt-auto flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={controller.previewAll}
          disabled={busy || controller.items.length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          {controller.isPreviewing ? (
            <Loader2Icon className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : null}
          {t("skill.batchPreview", "Preview")}
        </button>
        <button
          type="button"
          onClick={controller.handleRunBatchImport}
          disabled={busy || readyCount === 0}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {controller.isRunning ? (
            <Loader2Icon className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <UploadIcon className="h-3.5 w-3.5" aria-hidden />
          )}
          {t("skill.batchInstall", "Install {{count}}", { count: readyCount })}
        </button>
      </div>
    </div>
  );
}

function BatchStatusBadge({
  status,
  t,
}: {
  status: string;
  t: CreateSkillModalController["t"];
}) {
  if (status === "ready")
    return (
      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
        {t("skill.batchReady", "Ready")}
      </span>
    );
  if (status === "installed")
    return (
      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
        {t("skill.installed", "Installed")}
      </span>
    );
  if (status === "failed")
    return (
      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] text-destructive">
        {t("skill.batchFailed", "Failed")}
      </span>
    );
  if (status === "previewing")
    return (
      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
        {t("skill.batchPreviewing", "Previewing")}
      </span>
    );
  return null;
}
