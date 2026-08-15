# Release Delta: 0.8.1

## ADDED Requirements

### FR-REL-081-001: Version alignment

Every shipped distribution manifest, the standalone CLI runtime version, the
version-alignment test guard, and AGENTS.md MUST carry `0.8.1` when the
release is prepared.

#### Scenario: version alignment guard

- GIVEN the release prep commit
- WHEN `node --test scripts/version-alignment.test.mjs` runs
- THEN all distribution manifests and `CLI_VERSION` report 0.8.1

### FR-REL-081-002: Public release notes include the hotfix and the macOS notice

`CHANGELOG.md` MUST contain a `0.8.1` entry dated 2026-08-15 describing both
fixes bilingually and including the verbatim macOS unsigned-fork
"macOS 安全说明" notice with the quarantine workaround. README and localized
README histories MUST carry matching 0.8.1 sections and badges.

#### Scenario: localized doc sync

- GIVEN the release prep commit
- WHEN each `docs/README.*.md` is inspected
- THEN its version badge shows 0.8.1 and a 0.8.1 history section exists

### FR-REL-081-003: Website metadata regenerated

The website release metadata MUST be regenerated through
`pnpm --dir website sync:release` rather than hand-edited, so
`website/src/generated/release.ts`, `website/src/content/docs/changelog.md`,
and both introduction docs reflect 0.8.1.

#### Scenario: website sync

- GIVEN the updated CHANGELOG
- WHEN `pnpm --dir website sync:release` runs
- THEN generated release metadata reports version 0.8.1 and includes the new
  changelog section

## MODIFIED Requirements

None.

## REMOVED Requirements

None.
