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
- [ ] **Follow-up (needs user direction):** `CHANGELOG.md` 0.7.2 lines 119-120
      claim in-app updates for "signed and notarized" direct installs. This is
      a behavioral claim tied to the active `update-channel-hardening` change,
      which assumes signed/notarized macOS artifacts. Decide wording once the
      unsigned in-app-update behavior is confirmed.
- [ ] **Follow-up (§0.6 conflict):** the active `update-channel-hardening`
      change is built on a "signed and notarized" premise that conflicts with
      the unsigned-fork policy established here. Needs reconciliation.
- [x] Update `implementation.md` with what shipped and verification status.
