---
name: release-sync
description: PromptHub release update skill. Use for `/update-readme`, version bumps, changelog updates, website sync, GUI screenshot/doc refresh, and multilingual release/documentation alignment.
---

# PromptHub Release Sync

Use this skill for version bumps, release preparation, changelog or README
updates, website release sync, screenshots, and multilingual release material.

## Read First

1. `AGENTS.md`
2. `spec/releases/release-rules.md`
3. `spec/releases/README.md` and the target version record, when present
4. `package.json`, workspace package manifests, and the newest relevant
   `CHANGELOG.md` section

Do not treat this skill as a second release-policy source. Stable release
semantics belong in `spec/releases/release-rules.md`; this skill is the
execution procedure.

## Establish Scope

Before editing, identify:

- target version and release date
- stable, prerelease, historical prerelease, or docs-only update
- affected distributions: desktop, CLI, self-hosted web, worker, mobile
- whether public copy, in-app copy, screenshots, installers, or signing changed

For non-trivial release work, create or update the matching active change
before implementation.

## Source And Sync Order

1. Update version-bearing manifests for affected distributions, including the
   root and workspace packages when the monorepo version changes.
2. Update `CHANGELOG.md` and `spec/releases/<version>.md`.
3. Sync repository-facing documentation:
   - `README.md`
   - `docs/README.md`
   - `docs/README.en.md`
   - `docs/README.zh-TW.md`
   - `docs/README.ja.md`
   - `docs/README.de.md`
   - `docs/README.es.md`
   - `docs/README.fr.md`
4. Run `pnpm --dir website sync:release` and inspect:
   - `website/src/generated/release.ts`
   - `website/src/content/docs/changelog.md`
   - `website/src/content/docs/introduction.md`
   - `website/src/content/docs/en/introduction.md`
5. Update non-generated website copy only when the release contract changed:
   - `website/src/i18n/ui.ts`
   - `website/src/pages/index.astro`
   - `website/src/pages/en/index.astro`
6. When desktop user-facing copy changed, synchronize all locale files under
   `apps/desktop/src/renderer/i18n/locales/`.
7. When visible GUI or feature emphasis changed, inspect and update matching
   assets under `docs/imgs/` and `website/public/imgs/`.
8. Synchronize durable conclusions into `spec/workflow/*`, `spec/knowledge/*`,
   `spec/rules/*`, or `spec/adr/*` only when their stable contracts changed.

## Release Semantics

- Stable-facing badges, default downloads, and install instructions continue
  to point to the latest stable version when preparing a prerelease.
- Historical prereleases below an existing stable version are manual testing
  artifacts, not the default upgrade path.
- Do not document a GUI state without matching current UI evidence or updated
  screenshots.
- Do not silently skip localized docs or locale files; record why a surface is
  unaffected.
- When mentioning CLI availability, distinguish the CLI/npm distribution from
  desktop-bundled behavior.
- Use the website sync command instead of hand-editing generated metadata.

## macOS Security Notice (Required On Every Release)

AgentsHub is a community-maintained fork build without Apple Developer signing.
Every release that ships a macOS desktop artifact MUST include the following
notice verbatim in its GitHub release notes / `CHANGELOG.md` entry, and it must
also be present in the README install section when that section exists:

> **macOS 安全说明**
>
> AgentsHub 是社区维护的 fork 构建，未配置 Apple Developer 签名。首次启动时
> macOS Gatekeeper 可能拦截；如提示"已损坏"或"无法验证开发者"，请运行：
>
> ```bash
> sudo xattr -rd com.apple.quarantine /Applications/AgentsHub.app
> ```

Do not paraphrase, translate, or omit this notice on any macOS-bearing release.
This skill text overrides any inherited upstream PromptHub assumption that
macOS artifacts are Developer-ID signed and notarized. If a future release
becomes signed/notarized, update `spec/releases/release-rules.md` and this
section together before dropping the notice.

## Verification

Run the lowest relevant checks first, then:

- `pnpm verify:release:quick` for local release-impacting changes
- `pnpm verify:release` before tagging or publishing a release candidate
- for macOS-bearing releases, confirm the unsigned-fork "macOS 安全说明"
  notice is present in the generated release notes (see the
  "macOS Security Notice" section above). AgentsHub ships unsigned, so
  `codesign` / `xcrun stapler validate` / `spctl` Developer ID checks do
  not apply

Record commands, results, skipped surfaces, and residual risks in the active
change `implementation.md`. The quick profile is diagnostic and does not grant
release approval.

## Completion Report

Report:

- target version and release type
- affected distributions and manifests
- website sync status
- screenshot status
- macOS security notice included on the release (required for macOS-bearing releases)
- updated docs and locales
- verification results
- intentionally skipped surfaces and remaining release risk
