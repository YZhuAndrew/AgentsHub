# Implementation

## Phase And Status

- Phase: implement
- Status: done (pending converge/archive)

## What Shipped

Finished the user-visible brand swap from "PromptHub" to "AgentsHub" across the desktop app, CLI help text, and shared package constants. Only user-facing text changed; no logic, schema, IPC contract, persistence layout, or on-disk path was modified.

### Replaced (user-visible text only)

- **i18n locale values** — all 7 locale files (`en`, `zh`, `zh-TW`, `ja`, `fr`, `de`, `es`) plus `agent-definitions.ts`: replaced capital `PromptHub` → `AgentsHub` in ~1057 values (toasts, descriptions, hints, error copy, sync/conflict labels, AI system-prompt text).
- **Renderer hardcoded strings** (~90 occurrences across ~76 files): `t()` fallbacks, toast/notification prefixes (`Toast.tsx` now `AgentsHub - <title>`), window title bar (`TitleBar.tsx`), settings modal heading (`SettingsModal.tsx`), renderer crash UI (`RendererErrorBoundary.tsx`), rules conflict UI (`RulesManager.tsx`), skill/agent/mcp/plugin panel copy, prototype mock data, AI system-prompt text in `ai-content-workflows.ts` / `quick-add-utils.ts` / `image-prompt-reverse-utils.ts`.
- **Main process user-visible messages**: `updater.ts` ("This AgentsHub build appears to be installed via Homebrew..."), `legacy-cli-invocation.ts` ("AgentsHub Desktop was not started" / "standalone AgentsHub CLI"), `index.ts` ("Target directory already contains AgentsHub data"), `cloud-api.ts` ("Unable to reach AgentsHub Cloud"), `agent-conversation-service.ts` ("# AgentsHub conversation handoff" clipboard/LLM header), `skill-installer-discovery.ts` (`platformName: "AgentsHub"`), internal comments in `crud-handlers.ts` / `agent-usage-service.ts` / `skill-installer-platform.ts`.
- **packages/shared**: `constants/mcp-market.ts` — MCP official store `description` ("AgentsHub-maintained MCP catalog...") and `url` corrected to `github.com/legeling/AgentsHub`.
- **packages/core**: `cli/help.ts`, `cli/doctor-command.ts`, `cli/plugin-command.ts`, `cli/run.ts`, `cli/skill/service.ts` — CLI help/status text (capital PromptHub → AgentsHub; lowercase `prompthub` command token preserved everywhere). `mcp-target-sync-policy.ts` — MCP target sync status reason strings.
- **`apps/desktop/package.json`** `description` field.

### Deliberately kept as internal / persistence / external contracts

These remain "PromptHub"/"prompthub" by design. Renaming any of them would orphan existing user data, break server/update contracts, or invalidate published-artifact instructions.

- **On-disk directory** `%APPDATA%/PromptHub` / `~/Library/Application Support/PromptHub`: `data-path.ts` `CONFIG_DIR_NAME` / `LEGACY_PRODUCT_NAME`, `runtime-paths.ts` `DEFAULT_PRODUCT_NAME`, `index.ts` `productName: "PromptHub"` passed to runtime-path resolvers. `app.setName("AgentsHub")` provides the display name while userData stays pinned to the legacy directory for existing users.
- **Database filename** `prompthub.db` (20+ sites) and its backup-detection regex.
- **npm scope** `@prompthub/*` (~1400 import lines) — out of scope for this change.
- **localStorage keys** `prompthub-settings`, `prompthub-web-device-id`; persisted source IDs `prompthub-official`, `prompthub-cloud`, `MCP_OFFICIAL_MARKET_SOURCE_ID`.
- **HTTP `User-Agent` headers**: `PromptHub-Updater`, `PromptHub/1.0`, `PromptHub/image-download`, `PromptHub/<provider>-connectivity`, `PromptHub/remote-skill-fetch`, etc. (server contracts).
- **External URL** `https://api.prompthub.cloud` (live DNS).
- **Backup-format contract**: `.phub.gz`/`.phub` extensions, ZIP entry `import-with-prompthub.json`, default backup filename prefix `prompthub-backup-`, `LEGACY_UPGRADE_BACKUP_ROOT_NAME = "PromptHub-upgrade-backups"`.
- **MCP managed-block markers** `# >>> PromptHub MCP managed block >>>` / `<<< PromptHub MCP managed block <<<` in `packages/shared/utils/mcp-config.ts` — written into users' MCP config files; renaming would orphan existing managed blocks.
- **Published-artifact instruction text**: `brew upgrade --cask prompthub`, the `prompthub` CLI command, `prompthub-cli-*.tgz` tarball name — these match the actually published Homebrew cask (`Casks/prompthub.rb`) and CLI binary. Changing them would give users invalid commands.
- **Disk-mark / app-variant detection**: `recovery-paths.ts` `APP_NAME_VARIANTS = ["PromptHub", "prompthub"]`, `cli-installer.ts` regex matching installed `PromptHub.app`, `testing/e2e.ts` `app.setName("PromptHub E2E")`.
- **Internal identifiers**: `__PROMPTHUB_*` window globals, `isPromptHubManagedLink` serialized skill field, type names (`PromptHubWebContext`, `PromptHubRuntimeCapabilities`, `PromptHubFile`), function names (`parsePromptHubBackupFile*`, `normalizePromptHubWebBaseUrl`, `isPromptHub*`, `solvePromptHubCaptcha*`), `PROMPTHUB_CLOUD_STORE_ID`/`PROMPTHUB_CLOUD_STORE_URL`, `promptHubCloud` capability flag, `SECRET_PLACEHOLDER_PREFIX`.
- **Attribution / fork notice** (intentional upstream reference): `AboutSettings.tsx` "Fork of PromptHub, maintained by YZhuAndrew" and "AGPL-3.0 License © 2026 AgentsHub (fork of PromptHub)"; `App.tsx` comment "upstream PromptHub v0.5.2 regression".
- **Built-in skill registry** `packages/shared/constants/skill-registry.ts`: the "PromptHub CLI Operator" skill identity (`slug`, frontmatter `name`, tags) is coupled to the `prompthub` CLI binary and is a persisted identity; left intact to avoid orphaning installed skill records.

## What Changed During Execution

- The initial mechanical `\bPromptHub\b` → `AgentsHub` pass on tests over-replaced assertions that validate the **kept** contracts. Reverted those test files/lines so they continue to assert the persisted contract values:
  - `mcp-config.test.ts` / `mcp-library-import-health.test.ts` — MCP managed-block marker fixtures reverted to `PromptHub MCP managed block`.
  - `recovery-paths.test.ts`, `data-path.test.ts`, `upgrade-backup.test.ts` — fully reverted (they assert `%APPDATA%/PromptHub`, `APP_NAME_VARIANTS`, `LEGACY_UPGRADE_BACKUP_ROOT_NAME`).
  - `about-settings.test.ts` — footer assertion corrected to `"AgentsHub (fork of PromptHub)"` to match the intentional attribution.
- `cli-installer.test.ts` was excluded from the test replacement pass because it fixtures the installed `PromptHub.app` CLI wrapper (disk contract).
- Discovered and fixed two missed `packages/shared`/`packages/core` user-visible strings not covered by the first renderer/main pass: `mcp-market.ts` store description + stale repo URL, and `packages/core/src/cli/*` + `mcp-target-sync-policy.ts`.

## Verification

- `pnpm --filter @prompthub/desktop test -- --run`: 4733 passed, 22 failed. All 22 failures are **pre-existing and unrelated** to this change: the skill-ui / skill-i18n / skill-manager-large-dataset / skill-installer-export-remote suites fail at `SkillManager.tsx:417` (`Object.entries(skillUpdateStatuses)` with a null state — a wiring bug in the in-progress skill work, not a string change); `updater-real-scenario` fails on a network `latest.yml` 404; `agent-workspace-tabs` fails on tab-availability logic in an unmodified source file. Confirmed the brand edits are string-literal-only and cannot cause a null-state `TypeError`.
- Brand-focused sweep (22 test files asserting changed brand strings: hardcode-regression, i18n-init, about-settings, rules-manager, renderer-error-boundary, plugin-agent-target-picker, toast, top-bar, image-prompt-reverse, create-skill-modal, skill-library-import-modal, skill-projects-view-overview, cli-settings, update-dialog, settings-page, skill-settings, mcp-config, mcp-library-import-health, mcp-library-persistence-targets, legacy-cli-invocation, updater): **243/243 passed**.
- `pnpm --filter @prompthub/core test -- --run`: 113/113 passed.
- `pnpm --filter @prompthub/cli test -- --run`: 122/122 passed.
- `pnpm lint` (root `lint:file-size` + `@prompthub/desktop` eslint `--max-warnings 0`): passed.

## Stable Docs To Sync

- No stable doc currently codifies the keep/don't-keep brand contract. This `implementation.md` is the record; if a future change proposes to rename any "kept" item, it must first add a migration (dual-read for keys, dual-name awareness for paths/files, server-side UA allowlisting) rather than a blind rename.

## Follow-ups

- A separate change could rename the npm scope `@prompthub/*` → `@agentshub/*` (~1400 mechanical import lines + lockfile regen) if desired; low risk but large surface, intentionally deferred.
- The built-in "PromptHub CLI Operator" skill and its `source_url` (`legeling/PromptHub`) could be rebranded once the CLI binary/cask are themselves renamed; today they intentionally stay coupled to the published `prompthub` artifact.
