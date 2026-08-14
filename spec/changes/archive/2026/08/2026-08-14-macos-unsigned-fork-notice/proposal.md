# Proposal

## Why

AgentsHub is a community-maintained fork that ships macOS desktop artifacts
**unsigned** and without Apple notarization. The release workflow already
generates an unsigned-fork "macOS 安全说明" notice with the
`sudo xattr -rd com.apple.quarantine` workaround, but the repository's stable
release policy and several public README files still claim the artifacts are
Developer-ID signed and notarized. That is a false, security-relevant claim
that contradicts both the build reality and the generated release notes.

This change makes the unsigned-fork policy the explicit source of truth so the
release procedure, stable spec, and public docs agree.

## Scope

- In scope:
  - Rewrite `spec/releases/release-rules.md` §8 from a signing/notarization
    mandate to an unsigned-fork distribution policy.
  - Codify the verbatim "macOS 安全说明" notice as a required step in
    `.agents/skills/release-sync/SKILL.md` (already done).
  - Correct false "signed and notarized" install claims in `README.md` and the
    localized `docs/README.*.md` files so they describe the unsigned build as
    the normal install path.
  - Record that the prior `macos-developer-id-signing` change's signing
    capability is dormant for this fork (no Apple credentials are configured).
- Out of scope:
  - Re-introducing Apple Developer signing or notarization.
  - Changing the release workflow's optional signing code paths (they remain
    available if credentials are ever configured).
  - Windows or Linux signing.

## Risks

- Public docs previously overstated macOS security guarantees; correcting them
  makes the unsigned status explicit, which is accurate but less reassuring.
- Historical changelog entries that mention signing/notarization describe past
  release notes and are handled separately to avoid rewriting history silently.

## Rollback Thinking

Reverting this change restores the false signing claims, which is undesirable.
If signing is ever re-enabled, update §8, the release-sync notice section, and
the public install docs together rather than partially.
