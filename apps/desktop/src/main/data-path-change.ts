/**
 * Data-directory change workflow (preview / switch / migrate / overwrite).
 *
 * Owns the data-path summary helpers, the sensitive-target guards, and the
 * `data:*` IPC handlers that apply a data-directory change. Extracted from
 * `index.ts` so the main entrypoint does not accumulate migration wiring.
 *
 * The database lifecycle is injected because the main-process `appDb` is a
 * mutable module-level binding: a change must close the database before the
 * storage root moves and reopen it if the change fails.
 */

import { app, ipcMain } from "electron";
import path from "path";
import fs from "fs";

import { applyStorageRootChange, classifyStorageRoot } from "@prompthub/core";

import Database from "./database/sqlite";
import {
  getStorageOperationControlDirectory,
  inspectDataPath,
  writeConfiguredDataPath,
} from "./data-path";
import { verifyDataRootDatabase } from "./services/storage-database-inspection";

type DataPathChangeAction = "migrate" | "switch" | "overwrite";

interface DataPathSummary {
  promptCount: number;
  folderCount: number;
  skillCount: number;
  available: boolean;
  error?: string;
}

export interface DataPathChangeContext {
  getDb: () => Database.Database | null;
  setDb: (db: Database.Database | null) => void;
  closeDatabase: () => void;
  openDatabase: () => Database.Database;
}

function getObjectNumberValue(source: unknown, key: string): number {
  if (!source || typeof source !== "object") {
    return 0;
  }

  const value = Reflect.get(source, key);
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function databaseTableExists(
  db: Database.Database,
  tableName: string,
): boolean {
  const row = db
    .prepare(
      "SELECT 1 AS exists_flag FROM sqlite_master WHERE type = 'table' AND name = ?",
    )
    .get(tableName);
  return getObjectNumberValue(row, "exists_flag") === 1;
}

function countDatabaseTable(db: Database.Database, tableName: string): number {
  if (!databaseTableExists(db, tableName)) {
    return 0;
  }

  const row = db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get();
  return getObjectNumberValue(row, "count");
}

function summarizeDatabase(db: Database.Database): DataPathSummary {
  return {
    promptCount: countDatabaseTable(db, "prompts"),
    folderCount: countDatabaseTable(db, "folders"),
    skillCount: countDatabaseTable(db, "skills"),
    available: true,
  };
}

function summarizeDataPath(
  targetPath: string,
  getDb: () => Database.Database | null,
): DataPathSummary {
  const resolvedTargetPath = path.resolve(targetPath);
  const currentPath = path.resolve(app.getPath("userData"));

  try {
    const db = getDb();
    if (db && resolvedTargetPath === currentPath) {
      return summarizeDatabase(db);
    }

    const classification = classifyStorageRoot(resolvedTargetPath);
    const dbPath = classification.databasePath;
    if (!dbPath || !fs.existsSync(dbPath)) {
      return {
        promptCount: 0,
        folderCount: 0,
        skillCount: 0,
        available: false,
      };
    }

    const targetDb = new Database(dbPath, { readOnly: true });
    try {
      return summarizeDatabase(targetDb);
    } finally {
      targetDb.close();
    }
  } catch (error) {
    return {
      promptCount: 0,
      folderCount: 0,
      skillCount: 0,
      available: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function isSensitiveDataPathTarget(resolvedNewPath: string): string | null {
  const sensitiveRoots = [
    "/etc",
    "/usr",
    "/bin",
    "/sbin",
    "/var",
    "/tmp",
    "/System",
    "/Library",
    "C:\\Windows",
    "C:\\Program Files",
  ];

  const candidate = path.resolve(resolvedNewPath);
  return (
    sensitiveRoots.find((root) => {
      const sensitiveRoot = path.resolve(root);
      const relative = path.relative(sensitiveRoot, candidate);
      return (
        relative === "" ||
        (relative !== ".." &&
          !relative.startsWith(`..${path.sep}`) &&
          !path.isAbsolute(relative))
      );
    }) ?? null
  );
}

function isPathInside(parentPath: string, childPath: string): boolean {
  const resolvedParent = path.resolve(parentPath);
  const resolvedChild = path.resolve(childPath);
  return (
    resolvedChild !== resolvedParent &&
    resolvedChild.startsWith(`${resolvedParent}${path.sep}`)
  );
}

/**
 * Relaunch the app, optionally after a short delay (used after a successful
 * data-directory change and by the portable-snapshot IPC wiring).
 */
export function scheduleAppRelaunch(delayMs = 0): void {
  const relaunch = () => {
    app.relaunch();
    app.quit();
  };

  if (delayMs > 0) {
    setTimeout(relaunch, delayMs);
    return;
  }

  relaunch();
}

async function applyDataPathChange(
  newPath: string,
  action: DataPathChangeAction,
  context: DataPathChangeContext,
): Promise<{
  success: boolean;
  message?: string;
  newPath?: string;
  needsRestart?: boolean;
  backupPath?: string;
  error?: string;
}> {
  if (typeof newPath !== "string" || newPath.trim().length === 0) {
    return {
      success: false,
      error: "data path change requires a non-empty newPath string",
    };
  }
  if (action !== "migrate" && action !== "switch" && action !== "overwrite") {
    return {
      success: false,
      error: `Unsupported data path change action: ${action}`,
    };
  }

  const currentPath = app.getPath("userData");
  const resolvedTargetPath = path.resolve(newPath);
  if (path.resolve(currentPath) === resolvedTargetPath) {
    return {
      success: true,
      message: "Data directory is already current",
      newPath: resolvedTargetPath,
      needsRestart: false,
    };
  }

  const sensitiveRoot = isSensitiveDataPathTarget(resolvedTargetPath);
  if (sensitiveRoot) {
    return {
      success: false,
      error: `Cannot use system directory as data directory: ${resolvedTargetPath}`,
    };
  }

  if (action !== "switch" && isPathInside(currentPath, resolvedTargetPath)) {
    return {
      success: false,
      error:
        "Cannot migrate data into a child directory of the current data directory",
    };
  }

  const targetInspection = inspectDataPath(resolvedTargetPath);
  if (action === "switch") {
    if (!targetInspection.exists) {
      return {
        success: false,
        error: `Cannot switch to a directory that does not exist: ${resolvedTargetPath}`,
      };
    }

    writeConfiguredDataPath(app.getPath("appData"), resolvedTargetPath);
    return {
      success: true,
      message: "Data directory switched",
      newPath: resolvedTargetPath,
      needsRestart: true,
    };
  }

  if (action === "migrate" && targetInspection.hasPromptHubData) {
    return {
      success: false,
      error:
        "Target directory already contains AgentsHub data. Switch to it or choose overwrite instead.",
    };
  }

  let databaseClosed = false;
  try {
    // `action` is narrowed to "migrate" | "overwrite" here (the "switch" case
    // returns above), so the database is always closed before the root change.
    context.closeDatabase();
    context.setDb(null);
    databaseClosed = true;
    const result = await applyStorageRootChange({
      action,
      sourceRoot: currentPath,
      targetRoot: resolvedTargetPath,
      controlDirectory: getStorageOperationControlDirectory(
        app.getPath("appData"),
      ),
      publishBootPointer: (rootPath) =>
        writeConfiguredDataPath(app.getPath("appData"), rootPath),
      verifyDatabase: verifyDataRootDatabase,
      includeSecrets: true,
    });
    scheduleAppRelaunch(500);
    return {
      success: true,
      message: `Successfully migrated ${result.copiedFiles} files`,
      newPath: resolvedTargetPath,
      needsRestart: true,
      backupPath: result.recoveryArtifactPath,
    };
  } catch (error) {
    if (databaseClosed) {
      try {
        context.setDb(context.openDatabase());
      } catch (reopenError) {
        console.error(
          "[DataPath] Failed to reopen source database:",
          reopenError,
        );
      }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export function registerDataPathChangeIpc(context: DataPathChangeContext): void {
  ipcMain.handle(
    "data:previewDataPathChange",
    async (_event, newPath: string) => {
      if (typeof newPath !== "string" || newPath.trim().length === 0) {
        return {
          success: false,
          error:
            "data:previewDataPathChange requires a non-empty newPath string",
        };
      }

      const currentPath = app.getPath("userData");
      const resolvedTargetPath = path.resolve(newPath);
      const classification = classifyStorageRoot(resolvedTargetPath);
      if (classification.kind === "invalid" || classification.kind === "mixed") {
        return {
          success: false,
          error:
            classification.reason ??
            `Cannot use ${classification.kind} data directory: ${resolvedTargetPath}`,
        };
      }
      if (classification.kind === "unknown") {
        return {
          success: false,
          error: `Target is a non-empty directory not owned by PromptHub: ${classification.unknownEntries.join(", ")}`,
        };
      }
      const isCurrentPath = path.resolve(currentPath) === resolvedTargetPath;
      const hasPromptHubData =
        classification.kind === "canonical" || classification.kind === "legacy";

      return {
        success: true,
        targetPath: resolvedTargetPath,
        currentPath,
        exists: classification.kind !== "missing",
        hasPromptHubData,
        isCurrentPath,
        markers: classification.databasePath
          ? [
              {
                name: path.relative(
                  resolvedTargetPath,
                  classification.databasePath,
                ),
              },
            ]
          : [],
        currentSummary: summarizeDataPath(currentPath, context.getDb),
        targetSummary: summarizeDataPath(resolvedTargetPath, context.getDb),
        recommendedAction: isCurrentPath
          ? "switch"
          : hasPromptHubData
            ? "switch"
            : "migrate",
      };
    },
  );

  ipcMain.handle(
    "data:applyDataPathChange",
    async (_event, params: { newPath?: unknown; action?: unknown }) => {
      const newPath = typeof params?.newPath === "string" ? params.newPath : "";
      const action =
        params?.action === "switch" ||
        params?.action === "overwrite" ||
        params?.action === "migrate"
          ? params.action
          : "migrate";
      return applyDataPathChange(newPath, action, context);
    },
  );

  // Migrate data to a new directory
  // 迁移数据到新目录
  ipcMain.handle("data:migrate", async (_event, newPath: string) => {
    return applyDataPathChange(newPath, "migrate", context);
  });
}
