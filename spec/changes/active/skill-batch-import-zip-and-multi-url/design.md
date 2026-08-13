# Design: Skill Batch Import (ZIP + multi-URL)

## Approach

Add a `local-zip` source kind to the existing atomic package lifecycle (the
single install codepath), plus a read-only local-zip snapshot service for batch
preview. On top, a renderer batch driver loops sources through the lifecycle,
mirroring `runBatchStoreOperation` / `SkillBatchDeployDialog` UX.

## Module impacts

### Shared contract
- `packages/shared/types/skill.ts`: add
  `| { kind: "local-zip"; filePath: string }` to `SkillPackageOperationSource`.

### Core validation
- `packages/core/src/skills/package-operation.ts`:
  - `validateOperationSource`: `case "local-zip"` → require non-empty
    `filePath`, length within `MAX_SKILL_PACKAGE_PATH_LENGTH`.
  - `getSourceIdentity`: `case "local-zip"` → return `filePath`.

### Desktop lifecycle
- `apps/desktop/src/main/services/skill-package-lifecycle-desktop.ts`:
  - `getSourceUrl`: `case "local-zip"` → `filePath`.
  - `deriveSourceId`: treat `local-zip` like `local-directory` (raw path, not
    URL-sanitized).
  - `materializeNonRemoteSource`: new branch — read `filePath` bytes →
    `extractSkillZipArchive(bytes, stagingRoot/repo)` → return repo path.
    Downstream `scanNonRemoteStage` resolves SKILL.md / fingerprint / safety,
    identical to `local-directory`.

### Local-zip snapshot service
- `apps/desktop/src/main/services/skill-installer-local-zip.ts` (new):
  - `getLocalZipSkillPackageSnapshot({ filePath })`: mkdtemp → `fs.readFile` →
    `extractSkillZipArchive` → `resolveSingleSkillDirFromRepo` →
    `validateMaterializedSkillPackage` →
    `readSkillPackageSnapshotFromValidatedDirectory`; cleanup in `finally`.
    Reuses `withRemoteZipSkillPackage`-style flow but reads local bytes.
  - Validates `filePath` is a non-empty string ending in `.zip` and readable.

### IPC
- `packages/shared/constants/ipc-channels.ts`:
  - `SKILL_GET_LOCAL_ZIP_PACKAGE_SNAPSHOT = "skill:getLocalZipPackageSnapshot"`.
  - `DIALOG_SELECT_SKILL_ARCHIVES = "dialog:selectSkillArchives"`.
- `apps/desktop/src/main/ipc/skill/local-repo-handlers.ts`: handler calling the
  snapshot service (input validation + try/catch structured error).
- `apps/desktop/src/main/index.ts`: `dialog:selectSkillArchives` handler —
  `showSenderOwnedOpenDialog`-style, `multiSelections`, `.zip` filter.
- `apps/desktop/src/preload/api/skill.ts`: `getLocalZipPackageSnapshot(filePath)`.
- `apps/desktop/src/preload/index.ts`: `selectSkillArchives()`.

### Renderer batch UI
- `apps/desktop/src/renderer/components/skill/CreateSkillBatchImportPanel.tsx`
  (new) + `useCreateSkillBatchImport.ts` (new hook):
  - inputs: dropzone (multi `.zip` via `getPathForFile`) + picker button
    (`selectSkillArchives`) + GitHub URL textarea.
  - preview: per-zip `getLocalZipPackageSnapshot`; per-url `scanRemoteGithub`;
    reviewable removable list; multi-skill url flagged.
  - driver: loop `runPackageOperation({operation:"install", source,
    registrySkill, safetyScan})`; accumulator `{succeeded, failed,
    reviewRequired, failures[]}`; progress `{current,total,name}`; safety
    review via `useSkillPackageInstall`; `showToast` summary.
- `CreateSkillEntryPanels.tsx` / `CreateSkillModal.tsx`: add `batch` mode.
- `useCreateSkillModalController.ts`: wire the new hook.

### My Skills DnD
- `skill-manager-utils.ts`: `normalizeDroppedSkillPath` keeps `.zip`; add
  `isSkillArchivePath`.
- `SkillManager.handleDropImport`: split items into dirs/`.md` (existing scan)
  vs `.zip` (open batch mode pre-filled).

## Data / contracts

- No SQLite schema change.
- `local-zip` source identity derived from `filePath` (raw), consistent with
  `local-directory`.
- New IPC channels are additive.

## Tradeoffs

- Routing local-zip through the lifecycle (vs a dedicated channel) maximizes
  consistency (atomicity, safety, de-dup, progress) at the cost of touching the
  shared source union — preferred per single-source-of-truth.
- Per-URL single-skill auto-resolve keeps batch simple; multi-skill repos are
  flagged rather than auto-expanded.

## Verification layers

- Unit: source-kind validation, snapshot service, batch hook, DnD util.
- Adversarial: traversal/zip-bomb/oversized/empty/corrupt/Unicode-name ZIPs.
- Integration: lifecycle install from a real `fflate`-built fixture.
