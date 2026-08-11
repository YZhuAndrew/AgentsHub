# Design

## Current Behavior

- Scan: `scanRemoteGithub` → for SSH / non-GitHub hosts → `scanRemoteGitRepoViaClone` → `gitClone` into a temp dir, then walk for `SKILL.md`. For GitHub HTTPS it uses the REST tree API (no clone). UI shows one spinner.
- Import: renderer `installGitHubSkills` loops skills sequentially, each calling `runPackageOperation` → `SkillPackageLifecycleService.run` → `stage` → `materializeRemoteSource` → `saveRemoteGitSkillPackage` → `gitClone` + `computePackageFingerprint` (reads all file bytes) + safety scan + `persistStagedPackage`. UI shows one spinner.
- Existing progress pattern: `agent-session-index.ipc.ts` uses client `requestId`, `event.sender.send(PROGRESS_CHANNEL, {...})`, a preload `onProgress(listener)` returning unsubscribe, and a renderer `useEffect` subscription that filters by `requestId`.
- Existing enum: `SkillPackageOperationPhase = validation | resolving | staging | scanning | applying | finalizing | rollback`.

## Changes

### Contract (shared + core)

- New type `SkillImportProgressDetail` in `packages/shared/types/skill.ts`:
  - `kind: "scan" | "install"`
  - `phase: SkillPackageOperationPhase`
  - `message: string` (short English label / structured hint; renderer maps to i18n)
  - `index?: number`, `total?: number`, `skillName?: string`
  - `clonePercent?: number` (0–100)
  - `requestId: string`
- `SkillPackageOperationRequest` gains optional `requestId?: string`.
- `validateSkillPackageOperationRequest` validates `requestId` with `validateOptionalString`.
- Two new IPC channels: `SKILL_PACKAGE_OPERATION_PROGRESS`, `SKILL_SCAN_REMOTE_PROGRESS`.

### Main process

- `gitClone(url, destDir, branch?, onProgress?)`: spawn with `--progress`; parse `Receiving objects: NN% (...)` from the buffered stderr stream and call `onProgress({ percent })`. Parsing is best-effort (regex + try/catch); unparseable lines never affect the clone outcome. All existing behavior (60s timeout, SIGKILL, URL validation, failure stderr return) unchanged.
- `saveRemoteGitSkillPackage(skill, options)` gains optional `onProgress`; emits phase transitions: `staging` (cloning, with `clonePercent`), `scanning` (reading files + fingerprint), `scanning` (safety scan), `applying` (writing).
- `scanRemoteGitRepoViaClone` / `scanRemoteGithub` gain optional `onProgress`; emits `resolving` (cloning, with `clonePercent`) and `resolving` (listing entries).
- `SkillPackageLifecycleService.run(request, options?)` accepts an optional `emit` callback; `execute`/`stage`/`applyInstall` call `emit` with phase boundaries. `stagePackage` context carries `onProgress` through to `materializeRemoteSource` → `saveRemoteGitSkillPackage`.
- IPC handler `package-operation-handlers.ts`: capture `event.sender`, build `emit = (detail) => sender.send(PROGRESS_CHANNEL, { requestId, ...detail })` when `request.requestId` is present, pass to `lifecycle.run`. No-op degrade when `requestId` absent.
- IPC handler `platform-handlers.ts` (scan): capture `event.sender`; the scan `requestId` arrives from preload; emit `SCAN_REMOTE_PROGRESS`.

### Preload

- `runPackageOperation(request)`: inject a generated `requestId` if absent before invoking.
- New `onPackageOperationProgress(listener)` and `onScanRemoteProgress(listener)` returning unsubscribe.
- `scanRemoteGithub(...)`: generate a scan `requestId` per call (stored module-level) so progress events correlate.

### Renderer

- New `useSkillImportProgress` hook: subscribes to both progress channels, filters by active `requestId` (held in a ref), exposes `{ progress, setActiveRequestId, clearProgress }`.
- `useCreateSkillGithubImport`: before each skill in the import loop, set batch progress (`index`, `total`, `skillName`) locally; main events supply phase + `clonePercent`. On scan start, set active scan `requestId`.
- New `SkillImportProgressPanel` component: renders phase label (i18n), optional progress bar with `{{percent}}%`, optional `{{index}} / {{total}}: {{name}}`, and a fallback spinner + "processing" when loading but no detail.
- `CreateSkillGithubImportPanel`: insert the panel between the URL input and the results list, shown while `isLoading`.

### i18n

- New keys under `skill.importProgress.*` in all 7 locales (`en`, `zh`, `zh-TW`, `ja`, `fr`, `de`, `es`): `cloning`, `readingFiles`, `safetyScanning`, `applying`, `finalizing`, `scanningRepo`, `listingEntries`, `item`, `processing`.

## Data / Storage Impact

None. Progress is transient UI state sent over IPC events; nothing is persisted to SQLite or the filesystem.

## Rollback

The change is purely additive (new optional fields, new channels, new UI). Reverting removes the new channels/types/UI; existing install/scan behavior is unaffected because all progress hooks are optional.

## Test Strategy

- `gitClone` stderr parsing: unit test with a fake stderr stream feeding `Receiving objects: 47% (...)`, unparseable lines, 0%/100%, multi-line; assert `onProgress` calls and that parse failures never throw.
- `saveRemoteGitSkillPackage` phase emission: assert phase order with mocked clone/file-read/safety.
- IPC handler: fake `event.sender.send`, assert `PROGRESS_CHANNEL` payload + `requestId`; assert no-op when `requestId` absent.
- Renderer hook: simulate preload progress events; assert state update and stale-`requestId` filtering.
- Validator: `requestId` rejected when non-string, accepted when absent.
- Coverage target: 100% lines/branches/conditions for new production code, including parse-failure branches, absent-`requestId` degrade, and absent-`onProgress` no-op.
