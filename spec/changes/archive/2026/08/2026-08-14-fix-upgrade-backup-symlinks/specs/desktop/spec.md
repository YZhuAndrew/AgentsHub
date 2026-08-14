# Spec Delta: upgrade backup handles symlinks

## Modified Requirements

### `FR-UPGSYM-001`: pre-upgrade backup must not abort on symlinks

`createUpgradeDataSnapshot` MUST complete when the userData tree contains
symbolic links (e.g. symlink-mode Skill installs). The backup copy filter MUST:
- skip transient database sidecar files (unchanged);
- preserve symlinks whose target resolves within the source root (so internal
  links such as symlink-installed Skills are backed up faithfully and restorable);
- skip symlinks whose target resolves outside the source root (so the snapshot
  stays restorable; the restore path already rejects links escaping userData);
- preserve dangling symlinks as-is.

The within-root comparison MUST normalize both the source root and the link
target via `realpath` so it is correct on platforms whose system directories are
themselves symlinks (e.g. macOS `/var` → `/private/var`).

#### Scenario: internal symlink (symlink-installed skill)

- **GIVEN** userData contains a symlink resolving within userData
- **WHEN** a pre-upgrade snapshot is created
- **THEN** the snapshot succeeds and contains the symlink (as a symlink).

#### Scenario: escaping symlink

- **GIVEN** userData contains a symlink resolving outside userData
- **WHEN** a pre-upgrade snapshot is created
- **THEN** the snapshot succeeds, the escaping link is omitted, and regular
  files are still captured.

## Removed Requirements

- The prior "reject (throw on) any symbolic link in the snapshot" behavior is
  superseded by `FR-UPGSYM-001`.

## Verification

- `TEST-UPGSYM-001`: `upgrade-backup.test.ts` — internal symlink preserved;
  escaping symlink skipped; snapshot succeeds in both cases; transient DB
  sidecars still skipped. Legacy migration now migrates a snapshot with an
  escaping link (skipping only the link) instead of skipping the whole snapshot.
