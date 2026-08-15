# Tasks: Release 0.8.1 Prep

- [x] T-REL-081-1: bump versions to 0.8.1 (root, apps/*, app.json, CLI_VERSION,
      guard, CLI test, AGENTS.md) — TEST-REL-081-1: version-alignment test
- [x] T-REL-081-2: CHANGELOG entry + macOS notice; spec/releases/0.8.1.md +
      index; README + 6 localized README sections/badges — TEST-REL-081-2
- [x] T-REL-081-3: `pnpm --dir website sync:release` — TEST-REL-081-3
- [x] Local gates: `pnpm test:ci-config`, `pnpm spec:index:check`,
      `pnpm spec:test`, `pnpm verify:release:quick`
- [ ] Commit release prep (excluding unrelated working-tree files)
- [ ] Push main; tag `v0.8.1`; monitor CI verify + build + draft release
- [ ] Verify draft assets and update-manifest hashes; promote to latest
- [ ] Rerun workflow post-promote for Homebrew/R2 mirrors
- [ ] Converge: mark release record Published, archive completed change
      folders, refresh spec/issues local status
