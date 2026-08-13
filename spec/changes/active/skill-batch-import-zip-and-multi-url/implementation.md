# Implementation: Skill Batch Import (ZIP + multi-URL)

Status: implemented; pending review/commit.

## What shipped

### Backend — `local-zip` source kind in the atomic lifecycle
- `packages/shared/types/skill.ts`: added `| { kind: "local-zip"; filePath: string }`
  to `SkillPackageOperationSource` and optional `local_zip_path` to `RegistrySkill`.
- `packages/core/src/skills/package-operation.ts`: `validateOperationSource` and
  `getSourceIdentity` cover `local-zip` (non-empty, no null bytes, path-length
  limit).
- `apps/desktop/src/main/services/skill-package-lifecycle-desktop.ts`:
  `getSourceUrl`, `deriveSourceId`, and `materializeNonRemoteSource` handle
  `local-zip` (read bytes → `extractSkillZipArchive` → resolve single skill dir
  → stage as `repo`). `NonRemotePackageSource` includes it via `Exclude`.
- `apps/desktop/src/renderer/services/skill-package-operation.ts`:
  `buildSkillPackageOperationSource` emits a `local-zip` source when
  `registrySkill.local_zip_path` is set, so local-zip flows through the same
  store install path + `useSkillPackageInstall` review queue.

### Backend — local-zip snapshot service
- `apps/desktop/src/main/services/skill-installer-local-zip.ts` (new):
  `getLocalZipSkillPackageSnapshot({ filePath })` — mkdtemp → read bytes →
  `extractSkillZipArchive` → resolve → validate → read snapshot; cleanup in
  `finally`. Input validation (non-empty, `.zip`, no null bytes).
- IPC `SKILL_GET_LOCAL_ZIP_PACKAGE_SNAPSHOT` + handler in `local-repo-handlers.ts`
  + preload `getLocalZipPackageSnapshot({ filePath })`.

### Backend — multi-ZIP picker
- IPC `DIALOG_SELECT_SKILL_ARCHIVES` (`dialog:selectSkillArchives`) in `index.ts`
  (multi-select, `.zip` filter) + preload `selectSkillArchives()` + type decl.

### Renderer — batch import mode
- `useCreateSkillBatchImport.ts` (new hook): zip/url source list, dedupe, preview
  (per-zip snapshot, per-url `scanRemoteGithub`), sequential install via
  `installSkill`, per-item failure isolation, progress, summary. (Toast moved
  to the panel so the hook stays provider-free, matching other create hooks.)
- `CreateSkillBatchImportPanel.tsx` (new): dropzone + picker + URL textarea +
  reviewable item list + progress bar + failure list + summary + Preview/Install
  actions; summary toast.
- `batch-import-utils.ts` (new): slugify, URL parser, archive-path helpers.
- Wired into `CreateSkillModal` (5th mode `batch`), `CreateSkillEntryPanels`
  (entry button), `useCreateSkillModalController` (instantiates hook, seeds
  dropped zips, completion-close), `create-skill-modal-utils` (`CreateMode`).

### Renderer — global DnD recognition
- `skill-manager-utils.ts`: `normalizeDroppedSkillPath` returns `""` for `.zip`
  (zips no longer fall through to local scan); added `isSkillArchivePath`.
- `SkillManager.handleDropImport`: partitions dropped files; `.zip` items route
  to batch import via a transient `skill-batch-import-request` store.
- `stores/skill-batch-import-request.ts` (new): request/clear store.
- `TopBar.tsx`: subscribes, opens the modal, forwards the seed paths.

### i18n
- Added ~21 batch-import keys to all 7 locales.

## Tests

- `packages/core/tests/skill-package-operation.test.ts`: `local-zip` validation
  (valid / empty / null byte / over-length).
- `apps/desktop/tests/unit/main/skill-installer-local-zip.test.ts`: snapshot
  service orchestration — read+extract+resolve+snapshot, input rejections,
  temp cleanup on failure.
- `apps/desktop/tests/unit/components/skill-batch-import-utils.test.ts`:
  slugify + URL parsing/dedup.
- `apps/desktop/tests/unit/components/skill-manager-utils.test.ts`:
  `normalizeDroppedSkillPath` (SKILL.md/dir/.md/.zip) + `isSkillArchivePath`.

## Verification

- New + affected tests green: package-operation 24/24; snapshot 5/5;
  batch-import-utils 7/7; skill-manager-utils 6/6; create-skill-modal 20/20
  (restored after moving toast out of the hook); i18n-regression 7/7;
  skill-platform-ipc 4/4; shared suite 2/2.
- `eslint --max-warnings 0` on all changed/new files: clean.
- `tsc --noEmit`: changed files clean; only the pre-existing unrelated
  `startupModule` error remains (fails on clean HEAD too).
- Desktop full unit suite: only pre-existing red tests remain
  (agent-workspace-tabs, skill-i18n-manager/runtime-export,
  skill-installer-export-remote, updater-real-scenario) — none reference the
  new code. Zero new regressions.

## Follow-ups

- Add a component test for `CreateSkillBatchImportPanel` (wrapped in
  ToastProvider) covering drop/picker/textarea → list → run, once the panel
  stabilizes.
- End-to-end lifecycle test for `local-zip` materialization with a real
  `fflate`-built zip fixture (the snapshot service is covered; a full
  lifecycle run is a heavier integration test left for follow-up).
- Pre-existing `startupModule` TS error is unrelated (separate change).
