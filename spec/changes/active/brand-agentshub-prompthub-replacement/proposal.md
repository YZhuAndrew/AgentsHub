# Proposal

## Phase And Status

- Phase: implement
- Status: in-progress
- Primary requirement: `FR-BRAND-001`
- Exit condition: All user-visible English/localized prose that still reads "PromptHub" in the desktop app is replaced with "AgentsHub", the hardcode-regression and i18n parity tests pass, and internal persistence / disk-path / external-contract identifiers that carry "PromptHub" remain intentionally unchanged and are recorded in `implementation.md`.

## Why

The product has been rebranded to AgentsHub (`app.setName("AgentsHub")`, `productName: "AgentsHub"`, tray labels, `app.name`, About heading, and repo URLs are already converted). However a large volume of user-facing copy — i18n values across 7 locales, hardcoded `t()` fallbacks, toast/notification prefixes, error messages, updater/installer messages, and prototype mock text — still reads "PromptHub". Users therefore see inconsistent branding in toasts, dialogs, the settings shell, skill/agent/MCP panels, update hints, and crash UI. This change finishes the user-visible brand swap.

## Scope

- In scope (user-visible text only):
  - `apps/desktop/src/renderer/i18n/locales/{en,zh,zh-TW,ja,fr,de,es}.json` values.
  - Hardcoded string literals in `apps/desktop/src/renderer/**` and `apps/desktop/src/main/**` shown to users: `t()` fallbacks, toasts, notifications, dialog/error text, console logs shown in dev, AI system-prompt text, prototype mock copy.
  - `apps/desktop/package.json` `description`.
- Out of scope (kept as internal/persistence/external contracts — see `implementation.md`):
  - On-disk directory `%APPDATA%/PromptHub` / `~/Library/Application Support/PromptHub`, `CONFIG_DIR_NAME` / `LEGACY_PRODUCT_NAME`, `index.ts` `productName: "PromptHub"` driving userData resolution.
  - Database filename `prompthub.db`.
  - npm scope `@prompthub/*`.
  - localStorage keys (`prompthub-settings`, `prompthub-web-device-id`), persisted source IDs (`prompthub-official`, `prompthub-cloud`).
  - HTTP `User-Agent: PromptHub-Updater` and related request headers (server contract).
  - External URL `api.prompthub.cloud`.
  - Backup-format contract: `.phub.gz`/`.phub` extensions, ZIP entry `import-with-prompthub.json`, default backup filename prefix `prompthub-backup-`.
  - Published-artifact instruction text: `brew upgrade --cask prompthub`, the `prompthub` CLI command, `prompthub-cli-*.tgz` tarball name — these match the actually published Homebrew cask (`Casks/prompthub.rb`) and CLI binary.
  - Internal identifiers: `__PROMPTHUB_*` window globals, `isPromptHubManagedLink` serialized field, type names (`PromptHubWebContext`, `PromptHubRuntimeCapabilities`), function names (`parsePromptHubBackupFile*`), `SECRET_PLACEHOLDER_PREFIX`.

## Risks

- Low risk: this change only edits user-visible string literals; no data migration or contract change.
- Decision risk: keeping `brew upgrade --cask prompthub` / `prompthub` CLI instruction text means users still see the lowercase token in update and CLI messages. This is intentional because it matches the published artifacts; changing it would give users invalid commands. Recorded here so it is not mistaken for an oversight.
- Mechanical risk: in service files (`database-backup*.ts`, `self-hosted-sync.ts`) function names contain "PromptHub" but must be preserved — those files are edited per-occurrence, not by bulk replace.

## Rollback Thinking

- All edits are additive/reversible string substitutions in source and locale files; `git revert` fully reverses the change.
- No persistence, IPC contract, schema, or disk layout change is involved, so there is no data rollback path to design.

## Related Records

- Follows the partial rebrand already present in `apps/desktop/src/main/index.ts` (`app.setName("AgentsHub")`), `apps/desktop/package.json` (`productName: "AgentsHub"`), tray menu, and locale `app.name`.
- No stable doc currently codifies the keep/don't-keep brand contract; this change's `implementation.md` records it.
