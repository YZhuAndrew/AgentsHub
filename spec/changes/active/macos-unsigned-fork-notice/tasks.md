# Tasks

- [x] Add required verbatim "macOS 安全说明" notice step to
      `.agents/skills/release-sync/SKILL.md` and a completion-report check.
- [x] Create this active change folder.
- [x] Rewrite `spec/releases/release-rules.md` §8 and its scenario to the
      unsigned-fork policy.
- [x] Fix `release-sync/SKILL.md` verification line (drop signing checks).
- [x] Correct false "signed and notarized" install claims in `README.md` and
      the six localized `docs/README.*.md` files.
- [x] Correct historical changelog signing/notarization lines across the seven
      README locales.
- [x] Correct the root `CHANGELOG.md` 0.7.2 release-pipeline bullet and
      propagate to `website/src/content/docs/changelog.md` via
      `pnpm --dir website sync:release`.
- [x] Fix signing-info link text in `README.md` and `docs/README.ja.md`.
- [x] **Follow-up (resolved):** `CHANGELOG.md` 0.7.2 in-app-update entry
      corrected to reflect manual DMG routing for the unsigned fork; propagated
      to the website changelog via `pnpm --dir website sync:release`.
- [x] **Follow-up (resolved):** the active `update-channel-hardening` change was
      reconciled — `FR-UPDATER-005` / `DES-UPDATER-005` reversed to unsigned-fork
      manual DMG routing, code reverted in `updater.ts` + `UpdateDialog.tsx`,
      and `macUnsignedUpdateHint` added to all 7 locales. See that change's
      implementation.md revision note.
- [x] Update `implementation.md` with what shipped and verification status.
