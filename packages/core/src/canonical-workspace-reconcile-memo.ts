import path from "node:path";

/**
 * Per-process record of data roots whose canonical workspaces were already
 * reconciled by an initDatabase wrapper. Reconciling re-reads every bundle
 * manifest, so repeated initDatabase calls (IPC hot paths) must not repeat it;
 * per-mutation publication inside CanonicalSkillDB keeps runtime edits
 * consistent without this pass.
 */
const reconciledDataRoots = new Set<string>();

export function hasCanonicalWorkspaceReconcileCompleted(
  dataRoot: string,
): boolean {
  return reconciledDataRoots.has(path.resolve(dataRoot));
}

export function markCanonicalWorkspaceReconcileCompleted(
  dataRoot: string,
): void {
  reconciledDataRoots.add(path.resolve(dataRoot));
}

/**
 * Reset the per-process memo. Tests use this to simulate a fresh process;
 * production restarts (including backup-restore relaunch) reset it naturally.
 */
export function resetCanonicalWorkspaceReconcileMemo(): void {
  reconciledDataRoots.clear();
}
