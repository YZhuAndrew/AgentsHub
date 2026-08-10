# Proposal

## Phase And Status

- Phase: implement
- Status: in-progress
- Primary requirement: `FR-BUILD-001`
- Exit condition: Desktop release artifacts are produced only for macOS arm64 and Windows x64; build scripts, the release CI matrix, and user-facing README download tables no longer advertise macOS Intel (x64) or Windows arm64 builds, and the trimmed release harness still produces a valid macOS arm64 + Windows x64 release.

## Why

The project's target users run Apple Silicon Macs (M-series) and standard Intel/AMD Windows PCs. Maintaining macOS x64 and Windows arm64 targets doubles the release matrix and produces artifacts that the actual user base does not consume. Trimming the matrix to macOS arm64 + Windows x64 shortens release time, removes dead CI branches, and keeps the download tables honest about what is actually published.

## Scope

- In scope:
  - `apps/desktop/electron-builder.config.cjs` architecture lists for `mac` (dmg, zip) and `win` (nsis).
  - `apps/desktop/package.json` build scripts `electron:build:mac` and `electron:build:win`.
  - `.github/workflows/release.yml` build matrix entries and the now-dead macOS x64 architecture verification branch.
  - User-facing README download tables and architecture guidance across all locales (`README.md` plus `docs/README.{en,zh-TW,ja,fr,de,es}.md`).
- Out of scope:
  - The Linux target, which stays `x64` only.
  - macOS Developer ID signing, notarization, and the `publish` block.
  - Historical changelog entries that already reference x64/arm64 for shipped releases.
  - The standalone CLI, web, Cloudflare Worker, and mobile distributions.

## Risks

- Existing users on Intel Macs or ARM Windows devices lose an upgrade path; this is an accepted product decision for this fork, recorded in the README download tables.
- If a future release must reintroduce macOS x64 or Windows arm64, the matrix and builder config need to be re-added; the change history (this folder, moved to archive) is the rollback reference.
- Any external consumer (auto-updater channel) expecting a `*-x64.dmg` or `*-arm64.exe` artifact will stop receiving it. The auto-updater config is unchanged and will simply report no update for those clients.

## Rollback Thinking

- Builder config and build scripts are additive/reversible: restore `"x64"` in `mac.*.arch`, restore `"arm64"` in `win.nsis.arch`, and restore the two CI matrix rows.
- README tables are documentation-only; restore the dropped rows to reverse the change.
- No data migration, IPC contract, or persistence change is involved, so there is no data rollback path to design.

## Related Records

- Issue: none
- ADR: none
- Stable workflow/knowledge docs: none directly; build target inventory lives implicitly in `apps/desktop/electron-builder.config.cjs`.
