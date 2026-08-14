# AgentsHub 0.8.0 Release Preparation Tasks

- [x] `T-REL080-000` Define the release boundary and traceability chain before
      implementation (`FR-REL080-001`, `DES-REL080-001`, `TEST-REL080-001`).
- [x] `T-REL080-001` Align all shipped product manifests to `0.8.0`
      including `CLI_VERSION` and the CLI `--version` test, and align the
      `AGENTS.md` project version (`FR-REL080-001`, `DES-REL080-001`,
      `TEST-REL080-001`).
- [x] `T-REL080-002` Write the dated bilingual `0.8.0` changelog entry with
      the verbatim macOS unsigned-fork notice (`FR-REL080-002`,
      `FR-REL080-003`, `DES-REL080-002`, `TEST-REL080-002`,
      `TEST-REL080-003`).
- [x] `T-REL080-003` Add the `spec/releases/0.8.0.md` preparation record and
      index it (`FR-REL080-004`, `DES-REL080-003`, `TEST-REL080-004`).
- [x] `T-REL080-004` Sync localized README release history sections and run
      `pnpm --dir website sync:release`; verify generated files only
      (`FR-REL080-004`, `DES-REL080-003`, `DES-REL080-004`,
      `TEST-REL080-004`).
- [x] `T-REL080-005` Run `pnpm verify:release:quick` and the full
      `pnpm verify:release` gate; record results and residual risks
      (`NFR-REL080-001`, `TEST-REL080-005`).
- [ ] `T-REL080-006` Pause for maintainer confirmation; then commit, tag
      `v0.8.0`, trigger the release workflow, promote the draft to latest,
      and update the release record to `Published`.
- [ ] `T-REL080-007` Post-publish convergence: close #200/#201/#202, refresh
      issue snapshots and the local delivery overlay, then archive completed
      active changes and regenerate `spec/changes/index.md`.
