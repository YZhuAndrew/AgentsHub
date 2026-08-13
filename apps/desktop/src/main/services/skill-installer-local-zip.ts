import * as fs from "fs/promises";
import * as path from "path";
import type { SkillPackageSnapshot } from "@prompthub/shared/types";
import { extractSkillZipArchive } from "./skill-archive-extractor";
import {
  resolveSingleSkillDirFromRepo,
} from "./skill-installer-discovery";
import {
  getSkillsDirAccessor,
  initSkillsDir,
} from "./skill-installer-internal";
import { validateMaterializedSkillPackage } from "./skill-package-validation";
import { readSkillPackageSnapshotFromValidatedDirectory } from "./skill-package-snapshot";

export interface LocalZipSnapshotOptions {
  filePath: string;
}

/**
 * Read a local `.zip` skill archive and return a read-only package snapshot
 * (parsed SKILL.md identity + fingerprint) WITHOUT persisting to the managed
 * skills directory or DB. Mirrors the remote-zip snapshot flow but reads bytes
 * from disk. The hardened extractor enforces traversal/size/depth/zip-bomb
 * budgets; temp files are always cleaned up.
 */
export async function getLocalZipSkillPackageSnapshot(
  options: LocalZipSnapshotOptions,
): Promise<SkillPackageSnapshot> {
  const filePath = options.filePath?.trim();
  if (!filePath) {
    throw new Error("Local skill archive file path is required");
  }
  if (!/\.zip$/i.test(filePath)) {
    throw new Error("Local skill archive must be a .zip file");
  }
  if (filePath.includes("\0")) {
    throw new Error("Local skill archive file path must not contain null bytes");
  }

  await initSkillsDir();
  const tempRoot = await fs.mkdtemp(
    path.join(getSkillsDirAccessor(), ".local-zip-"),
  );
  const extractDir = path.join(tempRoot, "package");

  try {
    const archiveBytes = await fs.readFile(filePath);
    await extractSkillZipArchive(archiveBytes, extractDir);
    const skillDir = await resolveSingleSkillDirFromRepo(extractDir);
    await validateMaterializedSkillPackage(skillDir);
    return await readSkillPackageSnapshotFromValidatedDirectory(skillDir);
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true }).catch(() => {});
  }
}
