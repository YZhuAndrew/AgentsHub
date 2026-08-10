# Design

<!-- traceability: enforced -->

## `DES-BUILD-001`: Trim Desktop release targets to macOS arm64 and Windows x64

The change is a configuration-only trim of the release surface. No production application code, persistence, IPC contract, or filesystem layout is touched. The Desktop release harness currently declares four native targets via three surfaces: the `electron-builder` architecture lists, the pnpm build scripts that forward `--arch` flags, and the GitHub Actions release matrix. All three surfaces are updated together so a release tag produces exactly one macOS artifact set (arm64), one Windows artifact set (x64), and one Linux artifact set (x64).

## Affected Areas

- Data model: none.
- IPC / API: none.
- Filesystem / sync: none. Build output directory `apps/desktop/dist` will contain fewer artifacts.
- UI / UX: none at runtime. User-facing README download tables and architecture guidance are edited to match the trimmed artifact set.
- Release harness: `apps/desktop/electron-builder.config.cjs`, `apps/desktop/package.json` build scripts, `.github/workflows/release.yml` matrix and the macOS x64 architecture verification branch.

## Tradeoffs

- Pro: release time and CI minutes drop because two matrix jobs (macOS Intel runner, Windows arm64) are removed.
- Pro: README download tables stop advertising artifacts that are no longer published.
- Con: Intel Mac users and ARM Windows users have no upgrade path from future releases. Accepted for this fork.
- Con: the macOS x64 verification branch in the release workflow becomes dead code once macOS x64 is removed; it is deleted to keep the harness honest, which means a future macOS x64 reintroduction must re-add both the matrix row and the verification branch.

## Failure And Rollback

- External boundary: GitHub Releases. If a release is cut and a consumer expects a macOS x64 or Windows arm64 asset, that asset will simply be absent. No partial-failure state is possible because no step depends on the removed artifacts.
- Partial failure behavior: not applicable; each removed target is an independent matrix job / builder entry.
- Recovery/rollback: restore the two matrix rows, the builder arch entries, the two script flags, and the README rows. No data or migration rollback is required.

## Analyze Result

- Requirement links: `FR-BUILD-001`.
- Verification links: `TEST-BUILD-001` .. `TEST-BUILD-004`.
- Blocking conflicts: none. The only active changes touching the release harness (`grok-build-platform-support`, `release-0-6-0-version-alignment`) are orthogonal to architecture targets.
- Unresolved `[待确认]`: none.

## Traceability

| Requirement       | Design            | Verification       | Task             |
| ----------------- | ----------------- | ------------------ | ---------------- |
| `FR-BUILD-001`    | `DES-BUILD-001`   | `TEST-BUILD-001`   | `T-BUILD-001`    |
| `FR-BUILD-001`    | `DES-BUILD-001`   | `TEST-BUILD-002`   | `T-BUILD-002`    |
| `FR-BUILD-001`    | `DES-BUILD-001`   | `TEST-BUILD-003`   | `T-BUILD-003`    |
| `FR-BUILD-001`    | `DES-BUILD-001`   | `TEST-BUILD-004`   | `T-BUILD-004`    |
