/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mkdtemp: vi.fn(),
  readFile: vi.fn(),
  rm: vi.fn(),
  mkdir: vi.fn(),
  initSkillsDir: vi.fn(),
  extractSkillZipArchive: vi.fn(),
  resolveSingleSkillDirFromRepo: vi.fn(),
  validateMaterializedSkillPackage: vi.fn(),
  readSnapshot: vi.fn(),
}));

vi.mock("fs/promises", () => ({
  default: {
    mkdtemp: mocks.mkdtemp,
    readFile: mocks.readFile,
    rm: mocks.rm,
    mkdir: mocks.mkdir,
  },
  mkdtemp: mocks.mkdtemp,
  readFile: mocks.readFile,
  rm: mocks.rm,
  mkdir: mocks.mkdir,
}));

vi.mock("../../../src/main/services/skill-installer-internal", () => ({
  initSkillsDir: mocks.initSkillsDir,
  getSkillsDirAccessor: () => "/skills",
}));

vi.mock("../../../src/main/services/skill-installer-discovery", () => ({
  resolveSingleSkillDirFromRepo: mocks.resolveSingleSkillDirFromRepo,
}));

vi.mock("../../../src/main/services/skill-package-validation", () => ({
  validateMaterializedSkillPackage: mocks.validateMaterializedSkillPackage,
}));

vi.mock("../../../src/main/services/skill-archive-extractor", () => ({
  extractSkillZipArchive: mocks.extractSkillZipArchive,
}));

vi.mock("../../../src/main/services/skill-package-snapshot", () => ({
  readSkillPackageSnapshotFromValidatedDirectory: mocks.readSnapshot,
}));

import { getLocalZipSkillPackageSnapshot } from "../../../src/main/services/skill-installer-local-zip";

const validBytes = new Uint8Array([1, 2, 3]);
const snapshot = {
  content: "---\nname: writer\n---\n# Writer",
  directoryFingerprint: "abc123",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.mkdtemp.mockResolvedValue("/skills/.local-zip-xyz");
  mocks.mkdir.mockResolvedValue(undefined);
  mocks.readFile.mockResolvedValue(validBytes);
  mocks.extractSkillZipArchive.mockResolvedValue(undefined);
  mocks.resolveSingleSkillDirFromRepo.mockResolvedValue("/extract/writer");
  mocks.validateMaterializedSkillPackage.mockResolvedValue(undefined);
  mocks.readSnapshot.mockResolvedValue(snapshot);
  mocks.rm.mockResolvedValue(undefined);
});

describe("getLocalZipSkillPackageSnapshot", () => {
  it("reads the archive bytes, extracts, and returns the snapshot", async () => {
    const result = await getLocalZipSkillPackageSnapshot({
      filePath: "/tmp/writer.zip",
    });

    expect(result).toEqual(snapshot);
    expect(mocks.readFile).toHaveBeenCalledWith("/tmp/writer.zip");
    expect(mocks.extractSkillZipArchive).toHaveBeenCalledWith(
      validBytes,
      expect.stringContaining("package"),
    );
    expect(mocks.resolveSingleSkillDirFromRepo).toHaveBeenCalled();
    expect(mocks.readSnapshot).toHaveBeenCalledWith("/extract/writer");
  });

  it("rejects an empty file path", async () => {
    await expect(
      getLocalZipSkillPackageSnapshot({ filePath: "   " }),
    ).rejects.toThrow(/file path is required/i);
    expect(mocks.readFile).not.toHaveBeenCalled();
  });

  it("rejects a non-zip file path", async () => {
    await expect(
      getLocalZipSkillPackageSnapshot({ filePath: "/tmp/writer.tar" }),
    ).rejects.toThrow(/\.zip/i);
    expect(mocks.readFile).not.toHaveBeenCalled();
  });

  it("rejects a path containing a null byte", async () => {
    await expect(
      getLocalZipSkillPackageSnapshot({ filePath: "/tmp/ev\0il.zip" }),
    ).rejects.toThrow(/null bytes/i);
    expect(mocks.readFile).not.toHaveBeenCalled();
  });

  it("always cleans up the temp directory", async () => {
    mocks.readSnapshot.mockRejectedValueOnce(new Error("parse failed"));
    await expect(
      getLocalZipSkillPackageSnapshot({ filePath: "/tmp/writer.zip" }),
    ).rejects.toThrow("parse failed");
    expect(mocks.rm).toHaveBeenCalledWith(
      "/skills/.local-zip-xyz",
      expect.objectContaining({ recursive: true, force: true }),
    );
  });
});
