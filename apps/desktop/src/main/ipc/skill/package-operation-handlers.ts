import { ipcMain } from "electron";
import { IPC_CHANNELS } from "@prompthub/shared/constants/ipc-channels";
import { SkillPackageLifecycleService } from "../../services/skill-package-lifecycle";
import {
  cleanupAbandonedSkillPackageOperations,
  createDesktopSkillPackageLifecycleDependencies,
} from "../../services/skill-package-lifecycle-desktop";
import {
  createSkillProgressSender,
  type SkillIPCContext,
} from "./shared";

/** Register the single main-process owner for Skill package installation and updates. */
export function registerSkillPackageOperationHandlers({
  db,
}: SkillIPCContext): void {
  const lifecycle = new SkillPackageLifecycleService(
    createDesktopSkillPackageLifecycleDependencies(db),
  );

  void cleanupAbandonedSkillPackageOperations(db, { recoverAll: true }).catch(
    (error) => {
      console.warn(
        "Failed to recover abandoned Skill package operations:",
        error,
      );
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.SKILL_RUN_PACKAGE_OPERATION,
    async (event, request: unknown) => {
      const requestId =
        request && typeof request === "object" && !Array.isArray(request)
          ? (request as { requestId?: unknown }).requestId
          : undefined;
      const emit = createSkillProgressSender(
        event,
        IPC_CHANNELS.SKILL_PACKAGE_OPERATION_PROGRESS,
        "install",
        typeof requestId === "string" ? requestId : undefined,
      );
      return lifecycle.run(request, emit ? { emit } : undefined);
    },
  );
}
