# Implementation: Release 0.8.1 Prep

## What Shipped

(to be completed with verification results)

- Version alignment to 0.8.1 across: root package.json, apps/desktop,
  apps/cli, apps/web, apps/web-cloudflare, apps/mobile package.json,
  apps/mobile/app.json, packages/core/src/cli/types.ts, scripts/
  version-alignment.test.mjs, apps/cli/tests/run.test.ts, AGENTS.md.
- CHANGELOG 0.8.1 bilingual entry with the verbatim macOS unsigned-fork
  notice; spec/releases/0.8.1.md record; releases index row.
- README.md + docs/README.{en,zh-TW,ja,de,es,fr}.md version badges and 0.8.1
  history sections.
- Website metadata regenerated via `pnpm --dir website sync:release`.

## Verification

- (pending: commands and results recorded after execution)

## Skipped Surfaces

- GUI screenshots and desktop locale files: hotfix changes no visible copy.
- Full local `verify:release`: deferred to the CI release gate.
