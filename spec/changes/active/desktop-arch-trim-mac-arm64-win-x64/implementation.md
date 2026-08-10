# Implementation

## Status

- Phase: implement
- Status: in-progress

## Shipped

- `spec/changes/active/desktop-arch-trim-mac-arm64-win-x64/` change folder created (proposal, design, tasks, specs/build/spec.md, this file).
- `apps/desktop/electron-builder.config.cjs`: `mac` dmg/zip architecture list trimmed to `["arm64"]`; `win` nsis architecture list trimmed to `["x64"]`.
- `apps/desktop/package.json`: `electron:build:mac` now `--mac --arm64`; `electron:build:win` now `--win --x64`.
- `.github/workflows/release.yml`: removed the macOS Intel (`macos-15-intel`, mac x64) and Windows arm64 matrix rows; removed the dead macOS x64 branch from the architecture verification step.
- README download tables and architecture guidance updated across `README.md` and `docs/README.{en,zh-TW,ja,fr,de,es}.md`.

## Verification

- `TEST-BUILD-001`: builder config mac/win arch values match the spec. Command: `grep -n "arch:" apps/desktop/electron-builder.config.cjs`. Result: PASS — mac dmg/zip = `["arm64"]`, win nsis = `["x64"]` (linux x64 unchanged).
- `TEST-BUILD-002`: build script flags match the spec. Command: `grep -n "electron:build:mac\|electron:build:win" apps/desktop/package.json`. Result: PASS — mac `--arm64`, win `--x64`.
- `TEST-BUILD-003`: release matrix contains no mac x64 / win arm64 rows. Command: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/release.yml'))"` + matrix grep. Result: PASS — YAML valid; matrix is mac arm64 + win x64 + linux only; no `macos-15-intel`.
- `TEST-BUILD-004`: every localized README download table has no macOS Intel row and no Windows arm64 guidance. Command: `grep -rn "Intel\|x64 DMG\|Surface Pro X\|Windows arch" README.md docs/README.*.md`. Result: PASS — no matches.
- Lint gate: `pnpm lint:file-size`. Result: PASS — "File line limit passed".

## Analyze

- Traceability complete: yes (`FR-BUILD-001` -> `DES-BUILD-001` -> `TEST-BUILD-001..004` -> `T-BUILD-001..008`).
- Conflicts/blockers resolved: none. Orthogonal active changes (`grok-build-platform-support`, `release-0-6-0-version-alignment`) do not touch architecture targets.

## Converge

- Stable workflow/knowledge/rules synced: not applicable; the build target inventory is implicit in `apps/desktop/electron-builder.config.cjs` and no stable doc enumerates it. The README download tables are the user-facing source of truth and are now consistent with the trimmed targets.
- Issues/releases/ADRs/indexes synced: no GitHub issue or release record references the removed targets; nothing to update.
- Final change destination: this change is a release-harness trim with no runtime behavior delta, so it stays under `spec/changes/active/` until the next release tag cuts artifacts from the trimmed matrix; archive it under `spec/changes/archive/<YYYY>/<MM>/` after the first release that publishes only macOS arm64 + Windows x64.

## Synced Docs

- Pending.

## Follow-ups

- If a future release must support Intel Macs or ARM Windows again, restore the two CI matrix rows, the builder arch entries, the two script flags, and the README rows.
