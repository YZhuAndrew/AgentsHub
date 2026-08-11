import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSkillImportProgress } from "../../../src/renderer/components/skill/useSkillImportProgress";
import type { SkillImportProgressDetail } from "@prompthub/shared/types";
import { installWindowMocks } from "../../helpers/window";

function installProgressMocks() {
  let installListener:
    | ((progress: SkillImportProgressDetail) => void)
    | undefined;
  let scanListener:
    | ((progress: SkillImportProgressDetail) => void)
    | undefined;
  installWindowMocks({
    api: {
      skill: {
        onPackageOperationProgress: vi.fn((listener) => {
          installListener = listener;
          return () => {
            installListener = undefined;
          };
        }),
        onScanRemoteProgress: vi.fn((listener) => {
          scanListener = listener;
          return () => {
            scanListener = undefined;
          };
        }),
      },
    },
  });
  return {
    emitInstall: (progress: SkillImportProgressDetail) =>
      act(() => installListener?.(progress)),
    emitScan: (progress: SkillImportProgressDetail) =>
      act(() => scanListener?.(progress)),
  };
}

describe("useSkillImportProgress", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows install progress only while an install batch is active", async () => {
    const { emitInstall } = installProgressMocks();
    const { result } = renderHook(() => useSkillImportProgress());

    // Before a batch is active, install events are ignored.
    emitInstall({
      kind: "install",
      phase: "staging",
      message: "cloning-repository",
      requestId: "req-stale",
    });
    await waitFor(() => expect(result.current.progress).toBeNull());

    // Activate the batch; now events update state.
    act(() => result.current.setInstallBatchActive(true));
    emitInstall({
      kind: "install",
      phase: "staging",
      message: "cloning-repository",
      clonePercent: 47,
      requestId: "req-1",
    });
    await waitFor(() =>
      expect(result.current.progress?.clonePercent).toBe(47),
    );
    expect(result.current.progress?.message).toBe("cloning-repository");
  });

  it("shows scan progress only for the active scan requestId", async () => {
    const { emitScan } = installProgressMocks();
    const { result } = renderHook(() => useSkillImportProgress());

    // A scan event for a different requestId is ignored.
    emitScan({
      kind: "scan",
      phase: "resolving",
      message: "cloning-repository",
      requestId: "scan-other",
    });
    await waitFor(() => expect(result.current.progress).toBeNull());

    act(() => result.current.setScanRequestId("scan-current"));
    emitScan({
      kind: "scan",
      phase: "resolving",
      message: "listing-entries",
      requestId: "scan-current",
    });
    await waitFor(() =>
      expect(result.current.progress?.message).toBe("listing-entries"),
    );
  });

  it("clearProgress resets both detail and batch state", async () => {
    const { emitInstall } = installProgressMocks();
    const { result } = renderHook(() => useSkillImportProgress());

    act(() => {
      result.current.setInstallBatchActive(true);
      result.current.setBatchProgress({ index: 1, total: 3, skillName: "x" });
    });
    emitInstall({
      kind: "install",
      phase: "staging",
      message: "cloning-repository",
      requestId: "req-1",
    });
    await waitFor(() => expect(result.current.progress).not.toBeNull());
    expect(result.current.batchProgress).toEqual({
      index: 1,
      total: 3,
      skillName: "x",
    });

    act(() => result.current.clearProgress());
    expect(result.current.progress).toBeNull();
    expect(result.current.batchProgress).toBeNull();

    // After clear, the batch is inactive again, so a new event is ignored.
    emitInstall({
      kind: "install",
      phase: "staging",
      message: "cloning-repository",
      requestId: "req-2",
    });
    await waitFor(() => expect(result.current.progress).toBeNull());
  });
});
