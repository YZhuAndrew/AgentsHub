# Delta Spec

## Added

- `FR-REL-082-001`: All shipped distributions (root, CLI, desktop, web, worker, mobile) align on version 0.8.2 with matching version assertions and `CLI_VERSION`.
- `FR-REL-082-002`: The 0.8.2 CHANGELOG entry documents both Skill detail page fixes bilingually and includes the verbatim macOS unsigned-fork security notice.
- `FR-REL-082-003`: The v0.8.2 stable release supersedes v0.8.1 as latest; the published v0.8.1 release notes carry an advisory pointing users to 0.8.2.

## Scenarios

- `TEST-REL-082-001`: `scripts/version-alignment.test.mjs` passes with expected version 0.8.2.
- `TEST-REL-082-002`: CLI `--version` assertion test passes for 0.8.2.
- `TEST-REL-082-003`: Website generated release metadata reports 0.8.2 and the changelog mirrors the CHANGELOG entry.
