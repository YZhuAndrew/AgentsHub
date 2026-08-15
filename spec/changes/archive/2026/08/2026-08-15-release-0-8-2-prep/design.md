# Design

Same mechanical release-preparation path as v0.8.1 (`release-0-8-1-prep`):

1. Bump version strings in root `package.json`, `apps/{cli,desktop,web,web-cloudflare,mobile}/package.json`, `apps/mobile/app.json`, `packages/core/src/cli/types.ts` (`CLI_VERSION`), `AGENTS.md`, and the two version assertions (`scripts/version-alignment.test.mjs`, `apps/cli/tests/run.test.ts`).
2. Add the bilingual CHANGELOG 0.8.2 entry with the verbatim macOS unsigned-fork notice.
3. Record `spec/releases/0.8.2.md` and prepend the release index row.
4. Sync README and 7 localized READMEs (badge + history section).
5. Regenerate website release metadata with `pnpm --dir website sync:release`.
6. Verification: version-alignment + CLI tests, `pnpm verify:release:quick`, full `pnpm verify:release` before tagging.
7. Publish: push tag `v0.8.2`, dispatch the release workflow on the tag (verify job gates builds), promote the draft release to latest, then add the v0.8.1 upgrade advisory.

Supersession note: v0.8.1 stays published; 0.8.2 becomes the latest stable so stable-channel auto-update clients upgrade off the affected builds.
