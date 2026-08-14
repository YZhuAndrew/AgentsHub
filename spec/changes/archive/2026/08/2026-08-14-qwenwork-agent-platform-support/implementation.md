# Implementation

## Status

- Phase: implement
- Status: complete

## Shipped

- Added the built-in `qwenwork` platform to `SKILL_PLATFORMS` in
  `packages/shared/constants/platforms.ts` with id `qwenwork`, name `QwenWork`,
  Lucide `Bot` icon, the user-specified root `~/.qwenwork` (macOS/Linux) and
  `%USERPROFILE%\.qwenwork` (Windows), and a `skills/` directory convention.
- Added `qwenwork` to `DEFAULT_SKILL_PLATFORM_ORDER` immediately after
  `qoderwork`.
- Added the empty placeholder `qwenwork: depthCapabilities()` entry in
  `packages/shared/constants/agent-platform-capabilities.ts` so provider/model,
  sessions, and usage report `planned` and appearance reports `unsupported`.
- Bundled the official QwenWork octopus mascot as
  `apps/desktop/src/renderer/assets/platforms/qwenwork.png` (180×180
  transparent RGBA PNG, bright-green `#41D87E`). The mark is sourced from the
  official QwenWork site octopus favicon asset (`/favicon.svg?v=octopus`,
  served as an alicdn-hosted `id="octo"` SVG path set), rendered at high
  resolution, content-cropped, and square-padded to match the 180×180
  convention of `qoder.png` / `qoderwork.png`. Registered it in
  `PLATFORM_ICONS`; the Lucide `Bot` entry in `FALLBACK_ICONS` is retained as a
  load-failure fallback.
- Updated the capability regression test
  (`apps/desktop/tests/unit/services/agent-platform-capabilities.test.ts`):
  bumped the built-in platform count assertion from 35 to 36 and added
  `qwenwork` to `expectedPlannedSessionAdapters`.
- Synced the stable reference table in
  `spec/knowledge/reference/agent-platforms.md` with the QwenWork row.

## Asset Boundary

- PromptHub-managed user assets: `skills/` through the existing Skill workflow.
- Not advertised in this skeleton: MCP configuration, sessions, provider/model
  management, Plugin distribution, global rules, agents, and commands.
- No QwenWork-owned runtime, credential, or session files are read or written
  by this integration.

## Verification

- `TEST-QWENWORK-001`: `agent-platform-capabilities.test.ts` — the new platform
  is counted (36 built-in platforms) and its empty depth inventory satisfies
  the every-platform, every-capability, and planned-session adapter assertions.
- `TEST-QWENWORK-002`: `agent-root-paths.test.ts` — `qwenwork` participates in
  the default ordering and root-path resolution without breaking existing
  platforms.
- `TEST-QWENWORK-003`: `managed-agents.test.ts` — `buildManagedAgents` derives
  the `qwenwork` entry without regressions.
- `TEST-QWENWORK-004`: `platform-icon.test.tsx` — `qwenwork` renders the
  official `qwenwork.png` brand mark (180×180 real PNG) instead of the generic
  fallback, and the existing "all bundled `.png` assets are real PNG files"
  scan continues to pass with the new asset present.
- Targeted Vitest execution: all four files pass
  (capabilities 19, root-paths 17, managed-agents 20, platform-icon 18 —
  `74 tests passed`). The broader desktop suite contains one pre-existing
  failure in `agent-workspace-tabs.test.ts:85` that also fails on a clean
  `HEAD` (Qwen skills-tab enablement) and is unrelated to this change.

## Analyze

- Traceability complete: yes (`FR-QWENWORK-001` -> `DES-QWENWORK-001` ->
  `TEST-QWENWORK-001..003` -> `T-QWENWORK-001..006`).
- Conflicts/blockers resolved: yes.

## Converge

- Stable workflow/knowledge/rules synced: `spec/knowledge/reference/agent-platforms.md`.
- Issues/releases/ADRs/indexes synced: not required.
- Follow-up: re-confirm the `~/.qwenwork` root and deeper local contracts
  (MCP/session/provider/Plugin) against `https://qwenwork.cn/docs` once
  documentation tooling is available; expand depth adapters as a separate
  change if confirmed.
- Final change destination: `spec/changes/archive/` (pending maintainer archival).
