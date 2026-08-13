import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { parseSkillMd } from "@prompthub/core/skills/skill-frontmatter";
import type {
  RegistrySkill,
  RegistrySkillInstallResult,
} from "@prompthub/shared/types";
import { slugifyBatchSkillName } from "./batch-import-utils";
import type { SkillImportBatchProgress } from "./useSkillImportProgress";

export type BatchImportSource =
  | { kind: "zip"; filePath: string; fileName: string }
  | { kind: "git"; repoUrl: string };

export type BatchItemStatus =
  | "idle"
  | "previewing"
  | "ready"
  | "installed"
  | "failed";

export interface BatchImportItem {
  id: string;
  source: BatchImportSource;
  label: string;
  status: BatchItemStatus;
  name?: string;
  reason?: string;
  registrySkill?: RegistrySkill;
}

export type BatchImportProgress = SkillImportBatchProgress;

export interface BatchImportSummary {
  succeeded: number;
  failed: number;
  reviewRequired: number;
  total: number;
}

export interface UseCreateSkillBatchImportOptions {
  installSkill: (
    skill: RegistrySkill,
  ) => Promise<RegistrySkillInstallResult | null>;
  setIsLoading: (loading: boolean) => void;
  setInstallBatchActive: (active: boolean) => void;
  setBatchProgress: (progress: BatchImportProgress | null) => void;
  clearProgress: () => void;
}

function deriveLabel(source: BatchImportSource): string {
  return source.kind === "zip" ? source.fileName : source.repoUrl;
}

function buildZipRegistrySkill(
  filePath: string,
  fileName: string,
  snapshotContent: string,
): RegistrySkill {
  const parsed = parseSkillMd(snapshotContent);
  const frontmatter = parsed?.frontmatter;
  const rawName = (frontmatter?.name && String(frontmatter.name).trim()) || "";
  const name = rawName || fileName.replace(/\.zip$/i, "");
  const description = frontmatter?.description
    ? String(frontmatter.description)
    : "";
  const slug = slugifyBatchSkillName(name) || slugifyBatchSkillName(fileName);
  return {
    slug,
    name,
    description,
    category: "general",
    author: frontmatter?.author ? String(frontmatter.author) : "",
    source_url: filePath,
    source_label: fileName,
    version: frontmatter?.version ? String(frontmatter.version) : "0.0.0",
    content: snapshotContent,
    tags: [],
    local_zip_path: filePath,
  };
}

let batchItemCounter = 0;
function nextItemId(): string {
  batchItemCounter += 1;
  return `batch-${Date.now()}-${batchItemCounter}`;
}

export function useCreateSkillBatchImport({
  installSkill,
  setIsLoading,
  setInstallBatchActive,
  setBatchProgress,
  clearProgress,
}: UseCreateSkillBatchImportOptions) {
  const { t } = useTranslation();
  const [items, setItems] = useState<BatchImportItem[]>([]);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<BatchImportProgress | null>(null);
  const [failures, setFailures] = useState<
    Array<{ label: string; reason: string }>
  >([]);
  const [summary, setSummary] = useState<BatchImportSummary | null>(null);
  const runInFlightRef = useRef(false);

  const patchItem = useCallback(
    (id: string, patch: Partial<BatchImportItem>) => {
      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, ...patch } : item,
        ),
      );
    },
    [],
  );

  const addZipPaths = useCallback((paths: string[]) => {
    const newItems: BatchImportItem[] = [];
    for (const filePath of paths) {
      const fileName = filePath.split(/[/\\]/).pop() || filePath;
      if (!/\.zip$/i.test(fileName)) continue;
      newItems.push({
        id: nextItemId(),
        source: { kind: "zip", filePath, fileName },
        label: fileName,
        status: "idle",
      });
    }
    if (newItems.length === 0) return;
    setItems((current) => {
      const existingPaths = new Set(
        current
          .filter((item) => item.source.kind === "zip")
          .map((item) =>
            item.source.kind === "zip" ? item.source.filePath : "",
          ),
      );
      const deduped = newItems.filter(
        (item) =>
          item.source.kind === "zip" &&
          !existingPaths.has(item.source.filePath),
      );
      return [...current, ...deduped];
    });
  }, []);

  const addUrlsFromText = useCallback((text: string) => {
    const urls = Array.from(
      new Set(
        text
          .split(/[\s,]+/)
          .map((entry) => entry.trim())
          .filter((entry) => /^(https?|git):\/\//i.test(entry)),
      ),
    );
    if (urls.length === 0) return;
    setItems((current) => {
      const existing = new Set(
        current
          .filter((item) => item.source.kind === "git")
          .map((item) => (item.source.kind === "git" ? item.source.repoUrl : "")),
      );
      const newItems: BatchImportItem[] = urls
        .filter((url) => !existing.has(url))
        .map((repoUrl) => ({
          id: nextItemId(),
          source: { kind: "git", repoUrl } as BatchImportSource,
          label: repoUrl,
          status: "idle" as BatchItemStatus,
        }));
      return [...current, ...newItems];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    if (runInFlightRef.current) return;
    setItems([]);
    setFailures([]);
    setSummary(null);
    setProgress(null);
    clearProgress();
  }, [clearProgress]);

  const previewItem = useCallback(
    async (item: BatchImportItem): Promise<BatchImportItem> => {
      patchItem(item.id, { status: "previewing" });
      try {
        if (item.source.kind === "zip") {
          const snapshot =
            await window.api.skill.getLocalZipPackageSnapshot({
              filePath: item.source.filePath,
            });
          const registrySkill = buildZipRegistrySkill(
            item.source.filePath,
            item.source.fileName,
            snapshot.content,
          );
          return {
            ...item,
            status: "ready",
            name: registrySkill.name,
            registrySkill,
          };
        }
        const scanned = await window.api.skill.scanRemoteGithub(
          item.source.repoUrl,
          [],
        );
        if (!scanned || scanned.length === 0) {
          return {
            ...item,
            status: "failed",
            reason: t(
              "skill.batchNoSkillFound",
              "No skill found in this repository",
            ),
          };
        }
        if (scanned.length > 1) {
          return {
            ...item,
            status: "failed",
            reason: t(
              "skill.batchMultipleSkills",
              "Repository contains multiple skills; import it individually",
            ),
          };
        }
        const registrySkill = scanned[0];
        return {
          ...item,
          status: "ready",
          name: registrySkill.name,
          registrySkill,
        };
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        return { ...item, status: "failed", reason };
      }
    },
    [patchItem, t],
  );

  const previewAll = useCallback(async () => {
    const pending = items.filter(
      (item) => item.status === "idle" || item.status === "failed",
    );
    if (pending.length === 0 || isPreviewing) return;
    setIsPreviewing(true);
    setIsLoading(true);
    try {
      const resolved = await Promise.all(pending.map(previewItem));
      setItems((current) =>
        current.map((item) => {
          const next = resolved.find((r) => r.id === item.id);
          return next ?? item;
        }),
      );
    } finally {
      setIsPreviewing(false);
      setIsLoading(false);
    }
  }, [items, isPreviewing, previewItem, setIsLoading]);

  const runBatch = useCallback(async (): Promise<boolean> => {
    if (runInFlightRef.current) return false;
    const targets = items.filter((item) => item.status === "ready");
    if (targets.length === 0) return false;
    runInFlightRef.current = true;
    setIsRunning(true);
    setIsLoading(true);
    setInstallBatchActive(true);
    setFailures([]);
    setSummary(null);
    let succeeded = 0;
    let failed = 0;
    let reviewRequired = 0;
    const newFailures: Array<{ label: string; reason: string }> = [];

    try {
      for (let index = 0; index < targets.length; index++) {
        const item = targets[index];
        const liveName = item.name ?? item.label;
        const progressEntry: SkillImportBatchProgress = {
          index: index + 1,
          total: targets.length,
          skillName: liveName,
        };
        setProgress(progressEntry);
        setBatchProgress(progressEntry);
        try {
          if (!item.registrySkill) {
            throw new Error("Skill metadata unavailable");
          }
          const result = await installSkill(item.registrySkill);
          if (!result) {
            failed += 1;
            patchItem(item.id, { status: "failed" });
            newFailures.push({ label: liveName, reason: "no result" });
          } else if (result.status === "installed") {
            succeeded += 1;
            patchItem(item.id, { status: "installed" });
          } else {
            // safety-review-required: stays ready for the review queue
            reviewRequired += 1;
          }
        } catch (error) {
          failed += 1;
          const reason = error instanceof Error ? error.message : String(error);
          patchItem(item.id, { status: "failed", reason });
          newFailures.push({ label: liveName, reason });
        }
      }
      setFailures(newFailures);
      setSummary({ succeeded, failed, reviewRequired, total: targets.length });
      return failed === 0 && succeeded > 0;
    } finally {
      setIsRunning(false);
      setIsLoading(false);
      setInstallBatchActive(false);
      setProgress(null);
      setBatchProgress(null);
      clearProgress();
      runInFlightRef.current = false;
    }
  }, [
    items,
    installSkill,
    patchItem,
    setBatchProgress,
    setInstallBatchActive,
    setIsLoading,
    t,
    clearProgress,
  ]);

  const reset = useCallback(() => {
    if (runInFlightRef.current) return;
    setItems([]);
    setFailures([]);
    setSummary(null);
    setProgress(null);
    setIsPreviewing(false);
    setIsRunning(false);
    clearProgress();
  }, [clearProgress]);

  return {
    items,
    isPreviewing,
    isRunning,
    progress,
    failures,
    summary,
    addZipPaths,
    addUrlsFromText,
    removeItem,
    clearAll,
    previewAll,
    runBatch,
    reset,
  };
}
