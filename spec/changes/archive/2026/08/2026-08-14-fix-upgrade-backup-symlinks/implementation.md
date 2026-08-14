# Implementation: upgrade backup handles symlinks

Status: implemented; pending 0.7.1 release.

## What shipped

- `apps/desktop/src/main/services/upgrade-backup.ts`: replaced
  `shouldCopySnapshotPath` (threw on any symlink) with
  `createSnapshotCopyFilter(sourceRoot)`:
  - skips transient DB sidecars;
  - preserves symlinks resolving within `realpath(sourceRoot)`;
  - skips symlinks escaping the root;
  - preserves dangling symlinks.
  - root + target are both `realpath`-normalized so macOS `/var` → `/private/var`
    does not misclassify internal links as escaping.
  - Used by both `createUpgradeDataSnapshot` (root = userData) and
    `migrateLegacyUpgradeBackups` (root = legacy backup dir).

## Tests

- `upgrade-backup.test.ts`:
  - new "preserves internal symlinks" (RED → GREEN; reproduced the reported crash);
  - new "skips symlinks escaping userData" (file link);
  - repurposed "skips escaping symlinks (directory)" (was: rejects + cleans up);
  - updated legacy-migration case: a legacy snapshot with an escaping link now
    migrates (skipping only the link) instead of being skipped wholesale.
- `upgrade-backup-restore.test.ts`: unchanged (restore-path external-symlink
  rejection stays).

## Verification

- `vitest run upgrade-backup*.test.ts`: 39/39 pass.
- The runtime error `Cannot copy upgrade backup path from symbolic link` no
  longer occurs for symlink-installed skills.

## Notes

- Users already on a version with this bug (≤ 0.7.0) cannot auto-upgrade to a
  fixed build via the in-app flow (their installed code still throws at backup
  time). They should manually install 0.7.1 over the top (bypasses the in-app
  backup), after which future auto-upgrades work. Alternatively, remove the
  offending local symlink before auto-upgrading.
