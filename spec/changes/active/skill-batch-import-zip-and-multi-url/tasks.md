# Tasks: Skill Batch Import (ZIP + multi-URL)

## 1. Contract + lifecycle (backend)
- [ ] shared types: add `local-zip` source kind.
- [ ] core package-operation: validate + getSourceIdentity for `local-zip`.
- [ ] desktop lifecycle: getSourceUrl, deriveSourceId, materializeNonRemoteSource
      for `local-zip` (read bytes → extractSkillZipArchive).
- [ ] test-first: package-operation `local-zip` validation; lifecycle
      materialization (valid/missing-SKILL/traversal/zip-bomb/oversized).

## 2. Local-zip snapshot service + IPC
- [ ] `skill-installer-local-zip.ts`: `getLocalZipSkillPackageSnapshot`.
- [ ] IPC `SKILL_GET_LOCAL_ZIP_PACKAGE_SNAPSHOT` + handler + preload method.
- [ ] test-first: snapshot returns identity+fingerprint, does not persist,
      cleans temp.

## 3. Multi-ZIP picker
- [ ] IPC `DIALOG_SELECT_SKILL_ARCHIVES` + handler (multi-select, .zip filter).
- [ ] preload `selectSkillArchives()`.

## 4. Renderer batch UI
- [ ] `useCreateSkillBatchImport.ts` hook (preview + driver + progress + summary).
- [ ] `CreateSkillBatchImportPanel.tsx` (dropzone + picker + URL textarea + list).
- [ ] wire `batch` mode into CreateSkillEntryPanels / CreateSkillModal /
      controller.
- [ ] test-first: hook loop/isolation/progress/summary; URL parsing.

## 5. My Skills DnD
- [ ] `normalizeDroppedSkillPath` keeps `.zip`; add `isSkillArchivePath`.
- [ ] `SkillManager.handleDropImport` routes `.zip` into batch mode.
- [ ] test-first: util keeps `.zip`, recognizes archive path.

## 6. i18n (7 locales)
- [ ] batch import title, dropzone hint, URL placeholder, picker button,
      progress/summary/failure copy, multi-skill flag.

## 7. Converge
- [ ] `pnpm test -- --run`, `pnpm lint`, `pnpm typecheck` (pre-existing
      startupModule error unrelated).
- [ ] implementation.md; sync stable docs if they describe import entry points.
