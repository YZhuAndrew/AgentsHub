# Design

## Current State

- `.github/workflows/release.yml` already includes a "Check macOS signing
  secrets" step that sets `signed=true` only when all Apple credentials exist;
  otherwise it warns and publishes an **unsigned** build. AgentsHub does not
  configure those secrets, so published macOS artifacts are unsigned.
- The same workflow's `Create Release with gh CLI` step already emits the
  verbatim "macOS 安全说明" notice with the quarantine workaround into the
  generated release notes.
- `spec/releases/release-rules.md` §8 still mandates Developer-ID signing,
  notarization, and `codesign`/`stapler`/`spctl` verification — contradicting
  the unsigned reality.
- `README.md` and the six localized `docs/README.*.md` files claim macOS
  packages are "signed with Developer ID and notarized by Apple," which is
  false for this fork.

## Intended State

- §8 is the single source of truth: AgentsHub macOS artifacts are unsigned and
  not notarized; the quarantine workaround is the normal install path; release
  verification confirms the notice is present rather than asserting signatures.
- The release-sync skill enforces the verbatim notice on every macOS-bearing
  release.
- Public install docs describe the unsigned build as the normal path and do not
  claim signing or notarization.

## Affected Modules

- `spec/releases/release-rules.md` — §8 and its scenario rewritten.
- `.agents/skills/release-sync/SKILL.md` — notice section (done) and
  verification line.
- `README.md`, `docs/README.en.md`, `docs/README.zh-TW.md`,
  `docs/README.ja.md`, `docs/README.fr.md`, `docs/README.es.md`,
  `docs/README.de.md` — install-section corrections.

## Tradeoffs

- Keeping the workflow's optional signing paths preserves a future
  re-enablement route without code churn, at the cost of dormant complexity.
- Public docs become more accurate but less reassuring; this is preferred over
  false security claims.
