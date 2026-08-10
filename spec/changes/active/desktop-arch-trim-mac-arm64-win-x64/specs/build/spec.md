# Spec Delta: Desktop Build Targets

## Added Requirements

None.

## Modified Requirements

### `FR-BUILD-001`: Desktop release targets are macOS arm64 and Windows x64 only

The Desktop release harness MUST produce macOS artifacts for `arm64` only and Windows artifacts for `x64` only. The release build matrix, the `electron-builder` architecture lists, and the local `electron:build:mac` / `electron:build:win` scripts MUST NOT request macOS `x64` or Windows `arm64`.

#### Scenario: Local macOS build script

- **GIVEN** a developer runs `pnpm electron:build:mac` on an Apple Silicon host
- **WHEN** `electron-builder` resolves the macOS target
- **THEN** only `arm64` DMG and ZIP artifacts are produced
- **AND** no `*-x64.dmg` or `*-x64.zip` is emitted under `apps/desktop/dist`.

#### Scenario: Local Windows build script

- **GIVEN** a developer runs `pnpm electron:build:win` on a Windows x64 host
- **WHEN** `electron-builder` resolves the Windows target
- **THEN** only the `x64` NSIS installer is produced
- **AND** no `*-arm64.exe` setup artifact is emitted.

#### Scenario: Release CI matrix

- **GIVEN** a release tag is pushed
- **WHEN** the release workflow runs
- **THEN** the build matrix executes exactly one macOS job (arm64), one Windows job (x64), and one Linux job (x64)
- **AND** no macOS Intel runner job and no Windows arm64 job are scheduled.

#### Scenario: User-facing download table

- **GIVEN** a user opens any localized README
- **WHEN** the user reads the download section
- **THEN** the table lists macOS Apple Silicon, Windows x64, and the macOS Apple Silicon zip portable
- **AND** no macOS Intel download row and no Windows arm64 guidance is present.

## Removed Requirements

- Removed: implicit production of a macOS `x64` DMG/ZIP and a Windows `arm64` NSIS installer. Compatibility impact: existing Intel Mac clients and ARM Windows clients on the auto-updater channel will no longer receive matching artifacts. Accepted product decision for this fork; documented in README download tables.

## Verification

- `TEST-BUILD-001`: assert `apps/desktop/electron-builder.config.cjs` `mac.*.arch` equals `["arm64"]` and `win.nsis.arch` equals `["x64"]`.
- `TEST-BUILD-002`: assert `apps/desktop/package.json` `electron:build:mac` passes only `--arm64` and `electron:build:win` passes only `--x64`.
- `TEST-BUILD-003`: assert `.github/workflows/release.yml` matrix contains no macOS x64 row and no Windows arm64 row.
- `TEST-BUILD-004`: assert every localized README download table contains no macOS Intel row and no Windows arm64 guidance.
