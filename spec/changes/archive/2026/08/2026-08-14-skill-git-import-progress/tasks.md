# Tasks

- [x] Shared: add `SkillImportProgressDetail` type + `requestId?` on `SkillPackageOperationRequest`.
- [x] Shared: add 2 IPC channels (`SKILL_PACKAGE_OPERATION_PROGRESS`, `SKILL_SCAN_REMOTE_PROGRESS`).
- [x] Core: validate `requestId` in `validateSkillPackageOperationRequest`.
- [x] Main: `gitClone` `onProgress` + `--progress` stderr parsing.
- [x] Main: `saveRemoteGitSkillPackage` phase `onProgress`.
- [x] Main: `scanRemoteGitRepoViaClone` / `scanRemoteGithub` `onProgress`.
- [x] Main: lifecycle `emit` threading + desktop deps `onProgress`.
- [x] Main: `package-operation-handlers` capture sender + emit progress.
- [x] Main: scan handler capture sender + emit progress.
- [x] Preload: `onPackageOperationProgress` / `onScanRemoteProgress` + requestId injection.
- [x] Renderer: `useSkillImportProgress` hook.
- [x] Renderer: `SkillImportProgressPanel` component.
- [x] Renderer: wire into controller + github import hook + panel.
- [x] i18n: add `skill.importProgress.*` to all 7 locales.
- [x] Tests: gitClone parsing, saveRemoteGitSkillPackage phases, handler emit, renderer hook, validator, panel.
- [x] Verify: focused tests (226 pass), `pnpm lint`, coverage for new code.
- [x] Finalize `implementation.md`.
