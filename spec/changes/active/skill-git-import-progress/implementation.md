# Implementation

Status: complete.

## What shipped

Detailed progress reporting for the "从Git仓库安装" (Install from Git Repository) flow, covering both the Scan and Import phases. The UI now shows a phase label, a live git clone percentage bar (when git reports object transfer), and a batch counter (index/total + skill name), instead of an opaque spinner.

### Contract (shared + core)

- `packages/shared/types/skill.ts`: added `SkillImportProgressDetail` type and optional `requestId?` on `SkillPackageOperationRequest`.
- `packages/shared/constants/ipc-channels.ts`: added `SKILL_PACKAGE_OPERATION_PROGRESS` and `SKILL_SCAN_REMOTE_PROGRESS` channels.
- `packages/core/src/skills/package-operation.ts`: `validateSkillPackageOperationRequest` now validates the optional `requestId`.

### Main process

- `apps/desktop/src/main/services/skill-installer-utils.ts`: `gitClone` accepts an optional `onProgress` callback, spawns with `--progress`, and parses `Receiving objects: NN%` from stderr (splitting on CR and LF to capture in-place updates). New pure helper `parseGitClonePercent`. Parsing is best-effort and never affects the clone outcome; the completion (100%) callback fires on a successful close. All existing behavior (60s timeout, SIGKILL, URL validation, failure stderr return) unchanged.
- `apps/desktop/src/main/services/skill-installer-remote-package.ts`: `saveRemoteGitSkillPackage` emits phase transitions via optional `onProgress`: `staging` (cloning, with `clonePercent`), `scanning` (reading files + fingerprint), `scanning` (safety scan), `applying` (writing).
- `apps/desktop/src/main/services/skill-installer.ts`: `scanRemoteGitRepoViaClone` / `scanRemoteGithub` accept an optional `onProgress` and emit `resolving` (cloning, with `clonePercent`) and `resolving` (listing entries).
- `apps/desktop/src/main/services/skill-package-lifecycle.ts`: `SkillPackageLifecycleService.run(input, { emit })` threads an `emit` callback; `execute`/`stage`/`install`/`update`/`applyInstall`/`applyUpdate` call it at phase boundaries (`staging` via `stagePackage` context, `applying`, `finalizing`). Emission is wrapped so a throwing callback never affects the operation.
- `apps/desktop/src/main/services/skill-package-lifecycle-desktop.ts`: `stagePackage` context and `materializeRemoteSource` carry `onProgress` through to `saveRemoteGitSkillPackage`.
- `apps/desktop/src/main/ipc/skill/shared.ts`: `createSkillProgressSender(event, channel, kind, requestId)` builds a never-throwing emitter bound to the requesting renderer; returns `undefined` when no `requestId` (legacy callers degrade to no-op).
- `apps/desktop/src/main/ipc/skill/package-operation-handlers.ts`: captures `event.sender`, builds the emitter from `request.requestId`, passes `{ emit }` to `lifecycle.run`.
- `apps/desktop/src/main/ipc/skill/platform-handlers.ts`: scan handler captures `event.sender`, accepts a trailing `requestId`, emits `SKILL_SCAN_REMOTE_PROGRESS`.

### Preload

- `apps/desktop/src/preload/api/skill.ts`: `runPackageOperation` injects a generated `requestId` when absent; `scanRemoteGithub` generates and tracks a per-call scan `requestId`; new `onPackageOperationProgress`/`onScanRemoteProgress` subscribers and `lastScanRequestId()` accessor.

### Renderer

- `apps/desktop/src/renderer/components/skill/useSkillImportProgress.ts` (new): subscribes to both progress channels, scopes install events to an active-batch flag and scan events to the active scan `requestId`, exposes `progress`, `batchProgress`, and scoping/clear controls.
- `apps/desktop/src/renderer/components/skill/SkillImportProgressPanel.tsx` (new): renders the phase label (mapped from the structured `message` token to i18n), an optional clone-percentage progress bar, an optional batch counter, and a fallback spinner + "Processing…" label.
- `apps/desktop/src/renderer/components/skill/useCreateSkillModalController.ts`: integrates `useSkillImportProgress`; exposes `importProgress`, `importBatchProgress`, `clearImportProgress`; clears progress on close.
- `apps/desktop/src/renderer/components/skill/useCreateSkillGithubImport.ts`: scan sets the active scan `requestId`; import toggles the batch-active flag and updates batch progress per skill; progress is cleared at start and finish.
- `apps/desktop/src/renderer/components/skill/CreateSkillGithubImportPanel.tsx`: inserts `<SkillImportProgressPanel>` between the URL input and the results list while loading.

### i18n

- Added `skill.importProgress.*` (cloning, readingFiles, safetyScanning, applying, finalizing, scanningRepo, listingEntries, item, processing) to all 7 locales (`en`, `zh`, `zh-TW`, `ja`, `fr`, `de`, `es`). Key parity verified across all locales.

## Data / Storage Impact

None. Progress is transient UI state carried over IPC events; nothing is persisted.

## Verification

- `pnpm --filter @prompthub/core typecheck` — pass.
- `pnpm --filter @prompthub/shared typecheck` — pass.
- `pnpm --filter @prompthub/desktop typecheck` — pass for all changed files (the only remaining error, `startupModule` in `settings-general-actions.ts`, is pre-existing and belongs to the separate `startup-behavior-settings` change).
- `pnpm lint` (root) — pass; file-size limit pass; ESLint 0 warnings.
- Focused tests (all pass):
  - `packages/core/tests/skill-package-operation.test.ts` (20) — added `requestId` validator cases.
  - `apps/desktop/tests/unit/main/skill-installer-utils.test.ts` (84) — added `parseGitClonePercent` cases (parse, multi-line CR, null, out-of-range) and `gitClone` onProgress cases (live percent, unparseable ignore, throwing callback tolerance); updated the existing clone-args assertion for the new `--progress` flag.
  - `apps/desktop/tests/unit/main/skill-installer-remote-package.test.ts` (18) — added phase-transition order and no-`onProgress` cases.
  - `apps/desktop/tests/unit/main/skill-installer-remote-git-package.test.ts` (16) — updated the `gitClone` call assertion for the new optional 4th argument.
  - `apps/desktop/tests/unit/main/skill-package-operation-ipc.test.ts` (4) — added progress-forwarding and no-`requestId` degrade cases; updated the existing run-call assertion.
  - `apps/desktop/tests/unit/components/use-skill-import-progress.test.tsx` (3, new) — batch-active scoping, scan `requestId` scoping, and clear/reset behavior.
  - `apps/desktop/tests/unit/components/skill-import-progress-panel.test.tsx` (3, new) — phase label + percentage bar, batch counter, fallback label.
  - `apps/desktop/tests/unit/services/skill-locale-regression.test.ts` — pass (locale parity unaffected).
- Aggregate focused run: 226 tests across 10 skill test files — all pass.

## Follow-ups (not in this change)

- No cancel/abort support added; the existing 60s clone timeout remains the only abort path.
- GitHub HTTPS scan path uses the REST API and emits no clone percentage (only a generic processing indicator), by design.
- Preload `scanRemoteGithub` generates its own `requestId`; a future refactor could let the renderer pass it explicitly to avoid the `lastScanRequestId()` indirection.
