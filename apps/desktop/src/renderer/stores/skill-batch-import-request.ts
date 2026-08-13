import { create } from "zustand";

/**
 * Transient request used to route a global "drop ZIPs onto My Skills" gesture
 * into the CreateSkillModal batch-import mode with the dropped paths pre-seeded.
 * The modal consumes the seed once on open, then clears it.
 */
export interface BatchImportRequest {
  zipPaths: string[];
}

interface SkillBatchImportRequestState {
  request: BatchImportRequest | null;
  requestBatchImport: (zipPaths: string[]) => void;
  clear: () => void;
}

export const useSkillBatchImportRequest =
  create<SkillBatchImportRequestState>((set) => ({
    request: null,
    requestBatchImport: (zipPaths) => {
      const unique = Array.from(
        new Set((zipPaths ?? []).filter((path) => path && path.length > 0)),
      );
      if (unique.length === 0) return;
      set({ request: { zipPaths: unique } });
    },
    clear: () => set({ request: null }),
  }));
