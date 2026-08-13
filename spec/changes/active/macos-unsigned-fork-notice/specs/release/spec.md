# Release Spec Delta — macOS Unsigned Fork Notice

## ADDED Requirements

- AgentsHub macOS desktop release artifacts are published **unsigned** and are
  not notarized by Apple; no Apple Developer signing credentials are
  configured for the fork.
- Every macOS-bearing release MUST include the verbatim "macOS 安全说明"
  notice with the `sudo xattr -rd com.apple.quarantine
  /Applications/AgentsHub.app` workaround in its generated release notes.
- Public install documentation MUST describe the unsigned build plus the
  quarantine workaround as the normal install path.
- macOS release verification confirms the unsigned notice is present; it does
  not assert Developer ID signature, stapling, or Gatekeeper assessment.

## REMOVED Requirements

- Removed: the mandate that macOS artifacts be built with Hardened Runtime and
  notarized before publication.
- Removed: the mandate that GitHub Actions macOS jobs require Developer ID and
  notarization credentials before packaging.
- Removed: the mandate that release verification check packaged artifacts with
  `codesign`, `xcrun stapler validate`, and `spctl` Developer ID authority.

## MODIFIED Requirements

- The release workflow may still carry optional signing/notarization code
  paths; signing is active only when every Apple credential is configured. The
  fork ships without those credentials, so published artifacts are unsigned.
- If a future release reintroduces signing and notarization, §8, the
  release-sync notice section, and public install docs MUST be updated together
  before publishing.
