# Release 0.8.0 Delta

## Added Requirements

### `FR-REL080-001`: Product Version Alignment

The root monorepo and every shipped application distribution must report
`0.8.0` from its authoritative manifest.

#### `AC-REL080-001`

Root, Desktop, CLI, self-hosted Web, Cloudflare Worker, Mobile package, and
Expo application manifests all report exactly `0.8.0`, `CLI_VERSION` equals
`0.8.0`, and the CLI `--version` test asserts `0.8.0`.

### `FR-REL080-002`: Changelog Coverage For The Stable Gap

`CHANGELOG.md` must contain a dated `0.8.0` entry that documents the
user-visible changes shipped since `v0.7.2` in the existing bilingual format.

#### `AC-REL080-002`

The entry covers, at minimum: MCP project and Pi configuration workflows
(#200/#201/#202), agent management workbench completion (provider/model
workbench, Pi provider import, session and quota surfaces, expanded rules and
MCP targets), canonical file-first storage authority, prompt list projection,
image-generation workbench redesign, window geometry persistence, Markdown
skill file preview, and the unsigned macOS direct-install update routing.

### `FR-REL080-003`: macOS Unsigned-Fork Notice

The `0.8.0` changelog entry and generated release notes must include the
verbatim "macOS 安全说明" notice required by release-rules §8.

#### `AC-REL080-003`

The notice text appears verbatim, including the
`sudo xattr -rd com.apple.quarantine /Applications/AgentsHub.app` command.

### `FR-REL080-004`: Release Record And Website Sync

A `spec/releases/0.8.0.md` record must exist with summary, contents,
distribution, caveats, verification, and rollback sections, and generated
website release metadata must be refreshed through
`pnpm --dir website sync:release`.

#### `AC-REL080-004`

`spec/releases/README.md` indexes the new record, and
`website/src/generated/release.ts` plus the generated changelog mirror the
published stable state after the release is promoted.

### `NFR-REL080-001`: Release Gate Before Tagging

The full `pnpm verify:release` harness must pass (or its remaining failures
be recorded as unrelated with evidence) before the `v0.8.0` tag is created.

## Verification

- `TEST-REL080-001`: assert all authoritative product manifests equal
  `0.8.0` and the CLI reports `0.8.0`.
- `TEST-REL080-002`: assert the dated `0.8.0` changelog section exists and
  names the required change groups.
- `TEST-REL080-003`: assert the verbatim macOS notice is present in the
  changelog entry.
- `TEST-REL080-004`: assert the release record exists, is indexed, and
  website sync output is generated rather than hand-edited.
- `TEST-REL080-005`: record `pnpm verify:release:quick` and
  `pnpm verify:release` results with any unrelated residual failures.
