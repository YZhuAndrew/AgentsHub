import { useCallback, useEffect, useRef, useState } from "react";
import type { SkillImportProgressDetail } from "@prompthub/shared/types";

/** Renderer-side batch counter (which skill out of how many). */
export interface SkillImportBatchProgress {
  index: number;
  total: number;
  skillName?: string;
}

/**
 * Subscribes to Skill Git-import progress events from the main process and
 * exposes the latest detail for the currently active install or scan request.
 *
 * Install progress: the renderer marks an install batch active before it
 * starts. Because the modal blocks concurrent installs, at most one batch is
 * active at a time, so any install-kind event received while active is shown.
 * The per-skill `requestId` generated in preload is not known to the renderer
 * ahead of time, so batch scoping (not id pre-registration) is the filter.
 *
 * Scan progress: a single active scan `requestId` set when a scan begins; only
 * events matching that id are shown.
 *
 * Stale events (received when no batch/scan is active) are ignored so a late
 * event from a previous operation never overwrites the current display.
 */
export function useSkillImportProgress() {
  const [progress, setProgress] = useState<SkillImportProgressDetail | null>(
    null,
  );
  const [batchProgress, setBatchProgress] =
    useState<SkillImportBatchProgress | null>(null);
  const installBatchActive = useRef(false);
  const activeScanRequestId = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribeInstall = window.api.skill.onPackageOperationProgress(
      (next) => {
        if (!installBatchActive.current) return;
        setProgress(next);
      },
    );
    const unsubscribeScan = window.api.skill.onScanRemoteProgress((next) => {
      if (
        !activeScanRequestId.current ||
        next.requestId !== activeScanRequestId.current
      )
        return;
      setProgress(next);
    });
    return () => {
      unsubscribeInstall();
      unsubscribeScan();
    };
  }, []);

  const setInstallBatchActive = useCallback((active: boolean) => {
    installBatchActive.current = active;
  }, []);

  const setScanRequestId = useCallback((requestId: string | null) => {
    activeScanRequestId.current = requestId;
  }, []);

  const clearProgress = useCallback(() => {
    setProgress(null);
    setBatchProgress(null);
    installBatchActive.current = false;
    activeScanRequestId.current = null;
  }, []);

  return {
    progress,
    batchProgress,
    setInstallBatchActive,
    setScanRequestId,
    setBatchProgress,
    clearProgress,
  };
}

export type UseSkillImportProgress = ReturnType<
  typeof useSkillImportProgress
>;
