import crypto from "crypto";
import fs from "fs";
import path from "path";

import {
  CoreMcpLibraryService,
  CorePluginLibraryService,
  collectPromptCanonicalGraph,
  getGeneratedImagesDir,
  getGenerationsDir,
  getImagesDir,
  getVideosDir,
  materializeCanonicalStorageShadow,
  resolveDisplayedRuleFileName,
  ruleGroupForKnownId,
  stageCanonicalStorageDatabase,
  type CanonicalGenerationShadowInput,
  type CanonicalPluginShadowInput,
  type CanonicalSkillShadowInput,
  type MaterializeCanonicalStorageShadowResult,
  type StageCanonicalStorageDatabaseResult,
} from "@prompthub/core";
import {
  AgentProviderProfileDB,
  FolderDB,
  PromptDB,
  RuleDB,
  SkillDB,
} from "@prompthub/db";
import type {
  GenerationBatchManifest,
  McpLibraryFile,
  PluginLibraryEntry,
  PluginVersion,
  RuleFileContent,
} from "@prompthub/shared/types";

import type DatabaseAdapter from "../database/sqlite";

const MAX_PACKAGE_FILES = 20_000;
const MAX_PACKAGE_BYTES = 10 * 1024 * 1024 * 1024;
const MAX_GENERATION_BATCHES = 10_000;
const MAX_DOMAIN_RESOURCES = 100_000;
const MAX_GENERATION_MANIFEST_BYTES = 16 * 1024 * 1024;
const MAX_RULE_FILE_BYTES = 16 * 1024 * 1024;
const GENERATION_BATCH_ID_PATTERN = /^[0-9a-f-]{36}$/u;
const IGNORED_PACKAGE_DIRECTORIES = new Set([
  ".git",
  ".package-lifecycle",
  "node_modules",
  ".venv",
  "__pycache__",
  ".cache",
]);

export interface CanonicalStorageProjectorOptions {
  database: DatabaseAdapter.Database;
  targetPath: string;
  readRules?: () => Promise<RuleFileContent[]>;
  mcpLibrary?: McpLibraryFile;
  plugins?: readonly PluginLibraryEntry[];
  pluginVersions?: ReadonlyMap<string, readonly PluginVersion[]>;
  generations?: readonly CanonicalGenerationShadowInput[];
  deviceId?: string;
  operationalSourceDatabasePath?: string;
  publishedCanonicalRootPath?: string;
}

export interface CanonicalStorageProjectionResult {
  targetPath: string;
  verificationDatabasePath: string;
  materialized: MaterializeCanonicalStorageShadowResult;
  stagedDatabase: StageCanonicalStorageDatabaseResult;
}

function compareText(left: string, right: string): number {
  return left === right ? 0 : left < right ? -1 : 1;
}

function assertSafeDirectory(rootPath: string): string {
  const stats = fs.lstatSync(rootPath);
  if (!stats.isDirectory() || stats.isSymbolicLink()) {
    throw new Error(
      `Canonical package source is not a regular directory: ${rootPath}`,
    );
  }
  return path.resolve(rootPath);
}

interface PackageFileEntry {
  path: string;
  sourcePath: string;
}

/**
 * Resolve a contained package symlink to the regular file or directory it
 * points at. Links escaping the package boundary and dangling links fail
 * closed: the canonical shadow must not depend on content outside the
 * managed package or on links that resolve nowhere.
 */
function resolvePackageSymlink(
  packageRoot: string,
  sourcePath: string,
): { stats: fs.Stats; resolvedPath: string } {
  let resolvedPath: string;
  try {
    resolvedPath = fs.realpathSync(sourcePath);
  } catch {
    throw new Error(
      `Canonical package source contains a symbolic link that cannot be resolved within the package: ${sourcePath}`,
    );
  }
  const relative = path.relative(packageRoot, resolvedPath);
  if (
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error(
      `Canonical package source contains a symbolic link escaping the package: ${sourcePath}`,
    );
  }
  return { stats: fs.statSync(resolvedPath), resolvedPath };
}

function collectPackageFiles(rootPath: string): PackageFileEntry[] {
  // Resolve the root through realpath so containment compares against the
  // same normalized form realpathSync returns for children, even when system
  // directories are themselves symlinks (e.g. macOS /var -> /private/var).
  let root: string;
  try {
    root = fs.realpathSync(assertSafeDirectory(rootPath));
  } catch {
    root = assertSafeDirectory(rootPath);
  }
  const files: PackageFileEntry[] = [];
  const queue: Array<{ directory: string; prefix: string }> = [{ directory: root, prefix: "" }];
  const expandedRealpaths = new Set<string>();
  let totalBytes = 0;
  const recordPackageFile = (entryPath: string, sourcePath: string): void => {
    totalBytes += fs.statSync(sourcePath).size;
    if (files.length >= MAX_PACKAGE_FILES || totalBytes > MAX_PACKAGE_BYTES) {
      throw new Error("Canonical package source exceeds bounded scan limits");
    }
    files.push({ path: entryPath, sourcePath });
  };
  // Index-based BFS over the growing queue: symlinks may enqueue the same
  // resolved directory under several prefixes, so the queue never drains.
  for (let index = 0; index < queue.length; index += 1) {
    const { directory, prefix } = queue[index];
    const entries = fs
      .readdirSync(directory, { withFileTypes: true })
      .sort((left, right) => compareText(left.name, right.name));
    for (const entry of entries) {
      if (IGNORED_PACKAGE_DIRECTORIES.has(entry.name)) continue;
      const sourcePath = path.join(directory, entry.name);
      const entryPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink()) {
        // Contained links materialize: the shadow carries the target content
        // under the link path, so the projection never follows links outside
        // the package and never loses alias files.
        const { stats, resolvedPath } = resolvePackageSymlink(root, sourcePath);
        if (stats.isFile()) {
          recordPackageFile(entryPath, resolvedPath);
          continue;
        }
        if (stats.isDirectory()) {
          if (expandedRealpaths.has(resolvedPath)) {
            throw new Error(
              `Canonical package source contains a cyclic symbolic link: ${sourcePath}`,
            );
          }
          expandedRealpaths.add(resolvedPath);
          queue.push({ directory: resolvedPath, prefix: entryPath });
          continue;
        }
        throw new Error(
          `Canonical package source contains a symbolic link to a special file: ${sourcePath}`,
        );
      }
      if (entry.isDirectory()) {
        queue.push({ directory: sourcePath, prefix: entryPath });
        continue;
      }
      if (!entry.isFile()) {
        throw new Error(
          `Canonical package source contains a special file: ${sourcePath}`,
        );
      }
      recordPackageFile(entryPath, sourcePath);
    }
  }
  return files.sort((left, right) => compareText(left.path, right.path));
}

function collectSkills(
  database: DatabaseAdapter.Database,
): CanonicalSkillShadowInput[] {
  const skillDb = new SkillDB(database);
  const skills = skillDb.getAll();
  if (skills.length > MAX_DOMAIN_RESOURCES) {
    throw new Error("Canonical Skill inventory exceeds bounded scan limits");
  }
  return skills.map((skill) => ({
    skill,
    versions: skillDb.getVersions(skill.id),
    packageFiles:
      skill.local_repo_path && fs.existsSync(skill.local_repo_path)
        ? collectPackageFiles(skill.local_repo_path)
        : [],
  }));
}

function readOptionalRuleFile(filePath: string): string | undefined {
  try {
    const stats = fs.lstatSync(filePath);
    if (
      !stats.isFile() ||
      stats.isSymbolicLink() ||
      stats.size > MAX_RULE_FILE_BYTES
    ) {
      throw new Error(`Canonical Rule source is invalid: ${filePath}`);
    }
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

function readRequiredRuleFile(filePath: string): string {
  const content = readOptionalRuleFile(filePath);
  if (content === undefined) {
    throw new Error(`Canonical Rule version source is missing: ${filePath}`);
  }
  return content;
}

function hasRuleContent(content: string | undefined): boolean {
  return content !== undefined && content.trim().length > 0;
}

function collectRules(database: DatabaseAdapter.Database): RuleFileContent[] {
  const ruleDb = new RuleDB(database);
  const records = ruleDb.getAll();
  if (records.length > MAX_DOMAIN_RESOURCES) {
    throw new Error("Canonical Rule inventory exceeds bounded scan limits");
  }
  let versionCount = 0;
  const rules: RuleFileContent[] = [];
  for (const record of records) {
    const managedContent = readOptionalRuleFile(record.managedPath);
    const targetContent = readOptionalRuleFile(record.targetPath);
    const versions = ruleDb
      .getVersions(record.id)
      .sort((left, right) => left.version - right.version);
    const isUnmaterializedPlaceholder =
      record.syncStatus === "target-missing" &&
      record.currentVersion === 0 &&
      !hasRuleContent(managedContent) &&
      !hasRuleContent(targetContent) &&
      versions.length === 0;
    if (isUnmaterializedPlaceholder) continue;
    versionCount += versions.length;
    if (versionCount > MAX_DOMAIN_RESOURCES) {
      throw new Error(
        "Canonical Rule version inventory exceeds bounded scan limits",
      );
    }
    rules.push({
      id: record.id,
      platformId: record.platformId,
      platformName: record.platformName,
      platformIcon: record.platformIcon,
      platformDescription: record.platformDescription,
      name: resolveDisplayedRuleFileName(
        record.canonicalFileName,
        record.targetPath,
      ),
      description: record.description,
      path: record.targetPath,
      targetPath: record.targetPath,
      managedPath: record.managedPath,
      projectRootPath: record.projectRootPath ?? null,
      exists: record.syncStatus !== "target-missing",
      group:
        record.scope === "project"
          ? "workspace"
          : ruleGroupForKnownId(record.id),
      syncStatus: record.syncStatus,
      content:
        managedContent ??
        (record.syncStatus !== "target-missing" ? targetContent : undefined) ??
        "",
      targetContent:
        record.syncStatus === "out-of-sync" ? targetContent : undefined,
      versions: versions.map((version) => ({
        id: version.id,
        savedAt: version.createdAt,
        content: readRequiredRuleFile(version.filePath),
        source: version.source,
      })),
    });
  }
  return rules;
}

function collectPlugins(
  plugins: readonly PluginLibraryEntry[],
  versions: ReadonlyMap<string, readonly PluginVersion[]>,
): CanonicalPluginShadowInput[] {
  if (plugins.length > MAX_DOMAIN_RESOURCES) {
    throw new Error("Canonical Plugin inventory exceeds bounded scan limits");
  }
  return plugins.map((plugin) => {
    const sourcePath =
      plugin.localPackagePath ||
      plugin.source.localPackagePath ||
      plugin.managedPath ||
      plugin.localRepositoryPath ||
      plugin.source.localRepositoryPath;
    return {
      plugin,
      versions: versions.get(plugin.id) ?? [],
      packageFiles:
        sourcePath && fs.existsSync(sourcePath)
          ? collectPackageFiles(sourcePath)
          : [],
    };
  });
}

function readGenerationManifest(manifestPath: string): GenerationBatchManifest {
  const stats = fs.lstatSync(manifestPath);
  if (
    !stats.isFile() ||
    stats.isSymbolicLink() ||
    stats.size > MAX_GENERATION_MANIFEST_BYTES
  ) {
    throw new Error(
      `Canonical generation manifest is invalid: ${manifestPath}`,
    );
  }
  return JSON.parse(
    fs.readFileSync(manifestPath, "utf8"),
  ) as GenerationBatchManifest;
}

function collectGenerations(): CanonicalGenerationShadowInput[] {
  const rootPath = getGenerationsDir();
  if (!fs.existsSync(rootPath)) return [];
  const rootStats = fs.lstatSync(rootPath);
  if (!rootStats.isDirectory() || rootStats.isSymbolicLink()) {
    throw new Error(`Canonical generation root is invalid: ${rootPath}`);
  }
  const batchDirectories = fs
    .readdirSync(rootPath, { withFileTypes: true })
    .filter((entry) => {
      if (entry.name === "assets" && entry.isDirectory()) return false;
      if (
        !entry.isDirectory() ||
        entry.isSymbolicLink() ||
        !GENERATION_BATCH_ID_PATTERN.test(entry.name)
      ) {
        throw new Error(
          `Canonical generation root contains an invalid entry: ${entry.name}`,
        );
      }
      return true;
    })
    .sort((left, right) => compareText(left.name, right.name));
  if (batchDirectories.length > MAX_GENERATION_BATCHES) {
    throw new Error(
      "Canonical generation inventory exceeds bounded scan limits",
    );
  }
  return batchDirectories.map((entry) => {
    const manifest = readGenerationManifest(
      path.join(rootPath, entry.name, "batch.json"),
    );
    const outputSources = Object.fromEntries(
      manifest.slots.flatMap((slot) => {
        const fileName = slot.output?.fileName;
        if (!fileName) return [];
        if (path.basename(fileName) !== fileName || /[\\/\0]/u.test(fileName)) {
          throw new Error(
            `Canonical generation output path is unsafe: ${fileName}`,
          );
        }
        return [
          [fileName, path.join(getGeneratedImagesDir(), manifest.id, fileName)],
        ];
      }),
    );
    return { manifest, outputSources };
  });
}

function resolvePromptMediaSource(
  _prompt: unknown,
  kind: "image" | "video",
  reference: string,
): string {
  return path.join(
    kind === "image" ? getImagesDir() : getVideosDir(),
    ...reference.split("/"),
  );
}

function assertProjectionCounts(
  materialized: MaterializeCanonicalStorageShadowResult,
  staged: StageCanonicalStorageDatabaseResult,
): void {
  for (const [domain, count] of Object.entries(materialized.domainCounts)) {
    if (staged.domainCounts[domain] !== count) {
      throw new Error(`Canonical storage projection count mismatch: ${domain}`);
    }
  }
}

async function collectCanonicalStorageInput(
  options: CanonicalStorageProjectorOptions,
) {
  const pluginService = new CorePluginLibraryService();
  const plugins = options.plugins ?? pluginService.read().plugins;
  const pluginVersions =
    options.pluginVersions ??
    new Map(
      plugins.map((plugin) => [
        plugin.id,
        pluginService.getPluginVersions(plugin.id),
      ]),
    );
  const agentDb = new AgentProviderProfileDB(options.database);
  const profiles = agentDb.listProfiles({ includeArchived: true });
  if (profiles.length > MAX_DOMAIN_RESOURCES) {
    throw new Error("Canonical Agent inventory exceeds bounded scan limits");
  }
  return {
    prompts: collectPromptCanonicalGraph(
      new PromptDB(options.database),
      new FolderDB(options.database),
      options.database,
    ),
    skills: collectSkills(options.database),
    rules: options.readRules
      ? await options.readRules()
      : collectRules(options.database),
    mcpLibrary: options.mcpLibrary ?? new CoreMcpLibraryService().read(),
    plugins: collectPlugins(plugins, pluginVersions),
    agentProviders: profiles.map((profile) => ({
      profile,
      modelMappings: agentDb.listModelMappings(profile.id),
    })),
    generations: options.generations ?? collectGenerations(),
  };
}

export async function projectCanonicalStorageShadow(
  options: CanonicalStorageProjectorOptions,
): Promise<CanonicalStorageProjectionResult> {
  const targetPath = path.resolve(options.targetPath);
  if (fs.existsSync(targetPath)) {
    throw new Error(
      `Canonical storage projection target already exists: ${targetPath}`,
    );
  }
  const verificationDatabasePath = `${targetPath}.catalog-${crypto.randomUUID()}.db`;
  try {
    const storage = await collectCanonicalStorageInput(options);
    const materialized = materializeCanonicalStorageShadow({
      targetPath,
      ...storage,
      deviceId: options.deviceId,
      resolvePromptMediaSource,
    });
    const stagedDatabase = stageCanonicalStorageDatabase(
      targetPath,
      verificationDatabasePath,
      {
        operationalSourceDatabasePath: options.operationalSourceDatabasePath,
        publishedCanonicalRootPath: options.publishedCanonicalRootPath,
      },
    );
    assertProjectionCounts(materialized, stagedDatabase);
    return {
      targetPath,
      verificationDatabasePath,
      materialized,
      stagedDatabase,
    };
  } catch (error) {
    fs.rmSync(targetPath, { recursive: true, force: true });
    fs.rmSync(verificationDatabasePath, { force: true });
    throw error;
  }
}
