# Implementation

## Shipped

- Added a required "macOS Security Notice (Required On Every Release)" section
  to `.agents/skills/release-sync/SKILL.md` with the verbatim notice text, plus
  a completion-report line confirming the notice is included on macOS-bearing
  releases.
- Rewrote `spec/releases/release-rules.md` §8 from a signing/notarization
  mandate to "macOS Unsigned Fork Distribution", and updated its "Maintainer
  publishes macOS desktop artifacts" scenario accordingly.
- Updated the release-sync skill verification line: macOS verification now
  confirms the unsigned notice is present instead of asserting
  `codesign` / `stapler` / `spctl` Developer ID checks.
- Corrected false "signed and notarized" install instructions in `README.md`
  and all six localized `docs/README.*.md` files so they describe the unsigned
  build plus the quarantine workaround as the normal install path.
- Corrected historical changelog bullets that claimed macOS signing/
  notarization across the seven README locales.
- Removed misleading "signing info" link text from `README.md` and
  `docs/README.ja.md`.
- Corrected the root `CHANGELOG.md` 0.7.2 release-pipeline bullet and ran
  `pnpm --dir website sync:release`, which updated only
  `website/src/content/docs/changelog.md`.

## Verification

- Confirmed the notice is already emitted by `.github/workflows/release.yml`
  in the `Create Release with gh CLI` step (unchanged).
- Confirmed `release.yml` publishes an unsigned build when Apple credentials
  are absent (the fork's actual state).
- Corroborated by per-release specs `0.6.1.md`, `0.6.2.md`, and `0.7.0.md`,
  which already state "macOS builds are not Apple Developer-ID signed or
  notarized".
- Verified zero remaining false signing claims across `README.md` and the six
  localized `docs/README.*.md` files via targeted grep.
- Verified `pnpm --dir website sync:release` changed only
  `website/src/content/docs/changelog.md` (no unrelated generated-file churn).

## Pending / Follow-ups

- `CHANGELOG.md` 0.7.2 lines 119-120 claim in-app updates for "signed and
  notarized" direct installs. This behavioral claim is tied to the active
  `update-channel-hardening` change and needs confirmation of unsigned in-app
  update behavior before rewording.
- §0.6 conflict: the active `update-channel-hardening` change assumes signed/
  notarized macOS artifacts for `electron-updater` verification, which
  conflicts with the unsigned-fork policy established here. Requires user
  direction to reconcile.

## Synced Docs

- `spec/releases/release-rules.md` §8 and scenario (unsigned-fork policy).
- `README.md` and six localized `docs/README.*.md` install and changelog
  sections.
- Root `CHANGELOG.md` and generated `website/src/content/docs/changelog.md`.
