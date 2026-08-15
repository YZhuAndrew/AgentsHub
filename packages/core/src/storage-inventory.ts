import crypto from "crypto";
import fs from "fs";
import path from "path";

import {
  readRuntimeLayoutState,
  resolveRuntimeStorageContext,
  type RuntimeLayoutEpoch,
} from "./runtime-storage-context";

const COPY_BUFFER_BYTES = 1024 * 1024;
const IGNORED_EMPTY_ENTRIES = new Set([".DS_Store", "Thumbs.db"]);
const CANONICAL_TOP_LEVEL = ["data", "config", "secrets"] as const;
const LEGACY_TOP_LEVEL = [
  "prompthub.db",
  "workspace",
  "skills",
  "images",
  "videos",
  "shortcuts.json",
  "shortcut-mode.json",
  "config",
  "secrets",
] as const;
const EXCLUDED_DATA_RELATIVE_PREFIXES = [
  ".layout-state.json",
  "operations/journals",
  "operations/storage-maintenance.json",
  "prompthub.db-wal",
  "prompthub.db-shm",
  "prompthub.db-journal",
] as const;

export interface StorageInventoryLimits {
  maxEntries?: number;
  maxTotalBytes?: number;
  maxFileBytes?: number;
  maxDepth?: number;
}

export interface StorageInventoryOptions extends StorageInventoryLimits {
  includeSecrets?: boolean;
  /** Used only for a manifest-validated detached snapshot, never root discovery. */
  detachedLayoutEpoch?: RuntimeLayoutEpoch;
  excludeRelativePaths?: readonly string[];
  /**
   * "refuse" (default) throws on the first symbolic link so strict inventory
   * consumers never silently skip linked content. "record" classifies each
   * link instead (internal / escaping / dangling relative to the inventory
   * root) and collects it under `StorageInventory.symlinks` without walking
   * through it; regular-file hashing and totals are unaffected. Only a
   * realpath `ENOENT` classifies as dangling; other resolution failures
   * (cycles, permission errors) throw.
   */
  symlinkPolicy?: "refuse" | "record";
}

export interface StorageInventoryEntry {
  relativePath: string;
  sizeBytes: number;
  modifiedMs: number;
  sha256: string;
}

export type StorageSymlinkKind = "internal" | "escaping" | "dangling";

export interface StorageSymlinkEntry {
  relativePath: string;
  kind: StorageSymlinkKind;
  /** Raw link target exactly as stored on disk. */
  target: string;
}

export interface StorageInventory {
  rootPath: string;
  layoutEpoch: RuntimeLayoutEpoch;
  files: StorageInventoryEntry[];
  totalBytes: number;
  digest: string;
  /** Classified symbolic links; empty unless `symlinkPolicy: "record"`. */
  symlinks: StorageSymlinkEntry[];
}

export type StorageRootClassificationKind =
  | "missing"
  | "empty"
  | "canonical"
  | "legacy"
  | "mixed"
  | "unknown"
  | "invalid";

export interface StorageRootClassification {
  rootPath: string;
  kind: StorageRootClassificationKind;
  layoutEpoch?: RuntimeLayoutEpoch;
  databasePath?: string;
  unknownEntries: string[];
  reason?: string;
}

function readStats(targetPath: string): fs.Stats | null {
  try {
    return fs.lstatSync(targetPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

function meaningfulEntries(rootPath: string): fs.Dirent[] {
  return fs
    .readdirSync(rootPath, { withFileTypes: true })
    .filter((entry) => !IGNORED_EMPTY_ENTRIES.has(entry.name));
}

function directoryContainsMeaningfulEntry(directoryPath: string): boolean {
  const stats = readStats(directoryPath);
  if (!stats) return false;
  if (stats.isSymbolicLink() || !stats.isDirectory()) return true;
  return meaningfulEntries(directoryPath).length > 0;
}

export function classifyStorageRoot(
  rootPath: string,
): StorageRootClassification {
  const root = path.resolve(rootPath);
  const stats = readStats(root);
  if (!stats) return { rootPath: root, kind: "missing", unknownEntries: [] };
  if (stats.isSymbolicLink() || !stats.isDirectory()) {
    return {
      rootPath: root,
      kind: "invalid",
      unknownEntries: [],
      reason: stats.isSymbolicLink()
        ? "root is a symbolic link"
        : "root is not a directory",
    };
  }

  const entries = meaningfulEntries(root);
  if (entries.length === 0) {
    return { rootPath: root, kind: "empty", unknownEntries: [] };
  }
  const onlyEmptyMarkers = entries.every(
    (entry) =>
      (entry.name === "data" || entry.name === "config") &&
      entry.isDirectory() &&
      !directoryContainsMeaningfulEntry(path.join(root, entry.name)),
  );
  if (onlyEmptyMarkers) {
    return { rootPath: root, kind: "empty", unknownEntries: [] };
  }

  try {
    const context = resolveRuntimeStorageContext(root);
    const state = readRuntimeLayoutState(root);
    if (state || context.resolutionReason !== "empty-root") {
      return {
        rootPath: root,
        kind: context.layoutEpoch === 1 ? "canonical" : "legacy",
        layoutEpoch: context.layoutEpoch,
        databasePath: context.databasePath,
        unknownEntries: [],
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      rootPath: root,
      kind: /mixed (?:PromptHub|AgentsHub) storage layout/i.test(message)
        ? "mixed"
        : "invalid",
      unknownEntries: entries.map((entry) => entry.name).sort(),
      reason: message,
    };
  }

  return {
    rootPath: root,
    kind: "unknown",
    unknownEntries: entries.map((entry) => entry.name).sort(),
    reason: "directory has no complete PromptHub storage identity",
  };
}

function normalizeRelativePath(root: string, targetPath: string): string {
  const relative = path.relative(root, targetPath);
  if (
    !relative ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative) ||
    relative.includes("\0")
  ) {
    throw new Error(`Unsafe storage inventory path: ${targetPath}`);
  }
  return relative.split(path.sep).join("/");
}

function hashRegularFile(filePath: string): string {
  const digest = crypto.createHash("sha256");
  const descriptor = fs.openSync(filePath, "r");
  const buffer = Buffer.allocUnsafe(COPY_BUFFER_BYTES);
  try {
    let bytesRead = 0;
    do {
      bytesRead = fs.readSync(descriptor, buffer, 0, buffer.length, null);
      if (bytesRead > 0) digest.update(buffer.subarray(0, bytesRead));
    } while (bytesRead > 0);
  } finally {
    fs.closeSync(descriptor);
  }
  return digest.digest("hex");
}

function isExcludedCanonicalPath(relativePath: string): boolean {
  if (!relativePath.startsWith("data/")) return false;
  const withinData = relativePath.slice("data/".length);
  return EXCLUDED_DATA_RELATIVE_PREFIXES.some(
    (prefix) => withinData === prefix || withinData.startsWith(`${prefix}/`),
  );
}

function assertLimit(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive safe integer`);
  }
  return value;
}

function resolvedPathIsWithin(root: string, target: string): boolean {
  const relative = path.relative(root, target);
  return (
    relative === "" ||
    (relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative))
  );
}

function resolveInventoryRootReal(root: string): string {
  // Normalize the root with realpath so internal/escaping classification is
  // consistent even when system directories are themselves symlinks (e.g.
  // macOS /var -> /private/var); otherwise an internal link's realpath would
  // compare against a non-normalized root and be misclassified as escaping.
  try {
    return fs.realpathSync(root);
  } catch {
    return root;
  }
}

function classifyStorageSymlink(
  targetPath: string,
  resolvedRoot: string,
): { kind: StorageSymlinkKind; resolvedPath: string | null } {
  try {
    const resolved = fs.realpathSync(targetPath);
    return {
      kind: resolvedPathIsWithin(resolvedRoot, resolved)
        ? "internal"
        : "escaping",
      resolvedPath: resolved,
    };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return { kind: "dangling", resolvedPath: null };
    throw new Error(
      `Cannot resolve symbolic link in storage inventory: ${targetPath} (${code ?? "unknown error"})`,
    );
  }
}

export function createStorageInventory(
  rootPath: string,
  options: StorageInventoryOptions = {},
): StorageInventory {
  const root = path.resolve(rootPath);
  const classification =
    options.detachedLayoutEpoch === undefined
      ? classifyStorageRoot(root)
      : null;
  if (
    classification &&
    classification.kind !== "canonical" &&
    classification.kind !== "legacy"
  ) {
    throw new Error(
      `Cannot inventory ${classification.kind} PromptHub root: ${classification.rootPath}`,
    );
  }
  if (!classification) {
    const stats = fs.lstatSync(root);
    if (stats.isSymbolicLink() || !stats.isDirectory()) {
      throw new Error(`Cannot inventory unsafe detached root: ${root}`);
    }
  }
  const layoutEpoch =
    options.detachedLayoutEpoch ?? classification!.layoutEpoch!;
  const maxEntries = assertLimit(options.maxEntries ?? 100_000, "maxEntries");
  const maxTotalBytes = assertLimit(
    options.maxTotalBytes ?? 100 * 1024 * 1024 * 1024,
    "maxTotalBytes",
  );
  const maxFileBytes = assertLimit(
    options.maxFileBytes ?? 10 * 1024 * 1024 * 1024,
    "maxFileBytes",
  );
  const maxDepth = assertLimit(options.maxDepth ?? 32, "maxDepth");
  const topLevel =
    layoutEpoch === 1
      ? CANONICAL_TOP_LEVEL.filter(
          (entry) => entry !== "secrets" || options.includeSecrets,
        )
      : LEGACY_TOP_LEVEL.filter(
          (entry) => entry !== "secrets" || options.includeSecrets,
        );
  const files: StorageInventoryEntry[] = [];
  const symlinks: StorageSymlinkEntry[] = [];
  const symlinkPolicy = options.symlinkPolicy ?? "refuse";
  const resolvedRoot = resolveInventoryRootReal(root);
  const excludedPaths = new Set(
    (options.excludeRelativePaths ?? []).map((entry) =>
      entry.split(path.sep).join("/"),
    ),
  );
  let totalBytes = 0;
  let visitedEntries = 0;

  const visit = (targetPath: string, depth: number): void => {
    if (depth > maxDepth)
      throw new Error(`Storage inventory exceeds maxDepth at ${targetPath}`);
    visitedEntries += 1;
    if (visitedEntries > maxEntries)
      throw new Error("Storage inventory exceeds maxEntries");
    const stats = fs.lstatSync(targetPath);
    if (stats.isSymbolicLink()) {
      if (symlinkPolicy !== "record") {
        throw new Error(
          `Refusing symbolic link in storage inventory: ${targetPath}`,
        );
      }
      const linkTarget = fs.readlinkSync(targetPath);
      symlinks.push({
        relativePath: normalizeRelativePath(root, targetPath),
        kind: classifyStorageSymlink(targetPath, resolvedRoot).kind,
        target: linkTarget,
      });
      return;
    }
    if (stats.isDirectory()) {
      for (const entry of fs.readdirSync(targetPath, { withFileTypes: true })) {
        if (IGNORED_EMPTY_ENTRIES.has(entry.name)) continue;
        visit(path.join(targetPath, entry.name), depth + 1);
      }
      return;
    }
    if (!stats.isFile()) {
      throw new Error(
        `Refusing special file in storage inventory: ${targetPath}`,
      );
    }
    const relativePath = normalizeRelativePath(root, targetPath);
    if (
      isExcludedCanonicalPath(relativePath) ||
      excludedPaths.has(relativePath)
    )
      return;
    if (stats.size > maxFileBytes) {
      throw new Error(
        `Storage inventory file exceeds maxFileBytes: ${targetPath}`,
      );
    }
    totalBytes += stats.size;
    if (totalBytes > maxTotalBytes)
      throw new Error("Storage inventory exceeds maxTotalBytes");
    files.push({
      relativePath,
      sizeBytes: stats.size,
      modifiedMs: stats.mtimeMs,
      sha256: hashRegularFile(targetPath),
    });
  };

  for (const entry of topLevel) {
    const targetPath = path.join(root, entry);
    if (readStats(targetPath)) visit(targetPath, 1);
  }
  files.sort((left, right) =>
    left.relativePath.localeCompare(right.relativePath),
  );
  const digest = crypto
    .createHash("sha256")
    .update(
      files
        .map(
          (file) => `${file.relativePath}\0${file.sizeBytes}\0${file.sha256}\n`,
        )
        .join(""),
    )
    .digest("hex");
  return {
    rootPath: root,
    layoutEpoch,
    files,
    totalBytes,
    digest,
    symlinks: symlinkPolicy === "record" ? symlinks : [],
  };
}

export interface CopyStorageInventorySymlinkOptions {
  /**
   * - "preserve": recreate contained links (internal links rewritten with a
   *   relative destination target, dangling links with relative raw targets)
   *   and skip escaping links plus dangling links with absolute targets.
   *   Intended for copying the user's own live root (0.7.1 snapshot
   *   contract).
   * - "preserve-strict": same recreation rules, but escaping links and
   *   absolute dangling targets throw. Intended for untrusted backup or
   *   candidate roots where links resolving outside the root must fail
   *   closed.
   */
  symlinks?: "preserve" | "preserve-strict";
}

function recreateRecordedSymlinks(
  inventory: StorageInventory,
  destination: string,
  policy: "preserve" | "preserve-strict",
): void {
  const resolvedRoot = resolveInventoryRootReal(inventory.rootPath);
  for (const link of inventory.symlinks) {
    const sourceLinkPath = path.join(
      inventory.rootPath,
      ...link.relativePath.split("/"),
    );
    let before: fs.Stats;
    try {
      before = fs.lstatSync(sourceLinkPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new Error(
          `Storage inventory source changed type: ${sourceLinkPath}`,
        );
      }
      throw error;
    }
    if (!before.isSymbolicLink()) {
      throw new Error(
        `Storage inventory source changed type: ${sourceLinkPath}`,
      );
    }
    const { kind, resolvedPath } = classifyStorageSymlink(
      sourceLinkPath,
      resolvedRoot,
    );
    const rawTarget = fs.readlinkSync(sourceLinkPath);
    if (kind === "escaping") {
      if (policy === "preserve-strict") {
        throw new Error(
          `Refusing escaping symbolic link in storage copy: ${sourceLinkPath}`,
        );
      }
      continue;
    }
    if (kind === "dangling" && path.isAbsolute(rawTarget)) {
      if (policy === "preserve-strict") {
        throw new Error(
          `Refusing absolute dangling symbolic link in storage copy: ${sourceLinkPath}`,
        );
      }
      continue;
    }
    const destinationLink = path.join(
      destination,
      ...link.relativePath.split("/"),
    );
    // Escaping and absolute-dangling links returned above, so a resolved
    // path here means internal and a null one means relative dangling.
    let destinationTarget: string;
    if (resolvedPath !== null) {
      const targetSuffix = path.relative(resolvedRoot, resolvedPath);
      destinationTarget = path.relative(
        path.dirname(destinationLink),
        path.join(destination, ...targetSuffix.split(path.sep)),
      );
    } else {
      destinationTarget = rawTarget;
    }
    fs.mkdirSync(path.dirname(destinationLink), {
      recursive: true,
      mode: 0o700,
    });
    fs.symlinkSync(destinationTarget, destinationLink);
  }
}

export function copyStorageInventory(
  inventory: StorageInventory,
  destinationRoot: string,
  options: CopyStorageInventorySymlinkOptions = {},
): void {
  const destination = path.resolve(destinationRoot);
  fs.mkdirSync(destination, { recursive: true, mode: 0o700 });
  const buffer = Buffer.allocUnsafe(COPY_BUFFER_BYTES);
  for (const entry of inventory.files) {
    const sourcePath = path.join(
      inventory.rootPath,
      ...entry.relativePath.split("/"),
    );
    const destinationPath = path.join(
      destination,
      ...entry.relativePath.split("/"),
    );
    const before = fs.lstatSync(sourcePath);
    if (before.isSymbolicLink() || !before.isFile()) {
      throw new Error(`Storage inventory source changed type: ${sourcePath}`);
    }
    fs.mkdirSync(path.dirname(destinationPath), {
      recursive: true,
      mode: 0o700,
    });
    const source = fs.openSync(sourcePath, "r");
    const target = fs.openSync(destinationPath, "wx", 0o600);
    const digest = crypto.createHash("sha256");
    let copied = 0;
    try {
      let bytesRead = 0;
      do {
        bytesRead = fs.readSync(source, buffer, 0, buffer.length, null);
        if (bytesRead > 0) {
          const chunk = buffer.subarray(0, bytesRead);
          fs.writeSync(target, chunk);
          digest.update(chunk);
          copied += bytesRead;
        }
      } while (bytesRead > 0);
      fs.fsyncSync(target);
    } finally {
      fs.closeSync(source);
      fs.closeSync(target);
    }
    const after = fs.lstatSync(sourcePath);
    if (
      copied !== entry.sizeBytes ||
      before.size !== after.size ||
      before.mtimeMs !== after.mtimeMs ||
      digest.digest("hex") !== entry.sha256
    ) {
      throw new Error(
        `Storage inventory source changed during copy: ${sourcePath}`,
      );
    }
  }
  if (options.symlinks) {
    recreateRecordedSymlinks(inventory, destination, options.symlinks);
  }
}

export function verifyStorageInventory(
  inventory: StorageInventory,
  destinationRoot: string,
): void {
  const destination = path.resolve(destinationRoot);
  for (const entry of inventory.files) {
    const targetPath = path.join(destination, ...entry.relativePath.split("/"));
    const stats = fs.lstatSync(targetPath);
    if (
      stats.isSymbolicLink() ||
      !stats.isFile() ||
      stats.size !== entry.sizeBytes ||
      hashRegularFile(targetPath) !== entry.sha256
    ) {
      throw new Error(`Storage inventory verification failed: ${targetPath}`);
    }
  }
}
