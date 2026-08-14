# AgentsHub 0.8.0 Release Preparation

## Phase And Status

- Phase: implement
- Status: in-progress
- Primary requirement: `FR-REL080-001`
- Exit condition: all product distributions report `0.8.0`, the changelog and
  release record document the changes shipped since `v0.7.2`, generated website
  metadata is synchronized, and the release harness passes; tagging and
  publication happen only after explicit maintainer confirmation.

## Why

The fork stable line published `v0.7.2` on 2026-08-13. Since then 49
non-merge commits landed (agent management workbench completion, MCP project
and Pi configuration workflows for #200/#201/#202, canonical storage
authority, prompt list projection, image-generation workbench redesign, and
desktop UX features) while `CHANGELOG.md` still has an empty `[Unreleased]`
section. Three GitHub issues (#200, #201, #202) are recorded locally as
`release_pending` and can only close after the containing stable release is
published.

## Scope

- In scope:
  - align product distribution manifests to `0.8.0` (root, desktop, CLI,
    self-hosted web, Cloudflare Worker, mobile package, Expo app metadata,
    `CLI_VERSION`, and the CLI `--version` test)
  - align the project context version in `AGENTS.md`
  - add the bilingual `0.8.0` changelog entry with the verbatim unsigned-fork
    macOS security notice
  - add the `spec/releases/0.8.0.md` release record and index entry
  - sync generated website release metadata and localized README release
    history sections
  - run `pnpm verify:release:quick` and the full `pnpm verify:release` gate
- Out of scope:
  - creating or pushing the `v0.8.0` tag before maintainer confirmation
  - publishing GitHub Release assets or closing #200/#201/#202 (post-publish
    convergence)
  - archiving completed active changes (separate convergence commits)
  - the untracked intro videos and `website/articles/` content
  - changing private package versions under `packages/*`

## Risks

- A missed product manifest could produce artifacts with inconsistent
  versions.
- The changelog must describe user-visible changes relative to the previous
  stable (`0.7.2`), including content already previewed in the historical
  `0.6.0-beta.1` prerelease, so stable-line users see a complete upgrade
  narrative.
- The release notes must keep the verbatim macOS unsigned-fork notice
  (release-rules §8).

## Rollback Thinking

Before publication, rollback consists of restoring the affected manifests to
`0.7.2`, removing the changelog section, release record, and generated website
updates. No database, filesystem, or user-data migration is involved.

## Related Records

- Release rules: `spec/releases/release-rules.md`
- Execution procedure: `.agents/skills/release-sync/SKILL.md`
- Previous stable record: `spec/releases/0.7.2.md`
- Release-pending issues: #200, #201, #202
  (`spec/issues/active/ISS-20260806-001-mcp-issue-triage.md`)
