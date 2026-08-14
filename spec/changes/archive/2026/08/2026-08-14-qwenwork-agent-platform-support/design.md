# Design

## `DES-QWENWORK-001`: QwenWork Built-in Platform (Minimal Skeleton)

`packages/shared/constants/platforms.ts` owns the built-in platform catalog.
Add the `qwenwork` entry there so existing desktop platform discovery, Skill
distribution, and configuration override consume one shared definition. This
mirrors the `qoderwork` minimal-skeleton precedent (root dir + `skills/`
convention only).

## Affected Areas

- Data model: no persisted schema change; existing built-in platform override settings apply by platform id.
- IPC / API: no new channels; existing supported-platform APIs expose the entry automatically through `getPlatformById` and `buildManagedAgents`.
- Filesystem / sync: user root `~/.qwenwork` (macOS/Linux) and `%USERPROFILE%\.qwenwork` (Windows); Skills `skills/`. No MCP, rules, agents, commands, or config file previews in this skeleton.
- UI / UX: existing Agent and Skill surfaces render the entry with the official QwenWork brand mark (`qwenwork.png`, 180×180 transparent RGBA PNG, sourced from the official `apple-touch-icon`), with the Lucide `Bot` icon retained only as a load-failure fallback.

## Tradeoffs

- A minimal skeleton exposes Skill distribution without verified MCP/session/provider contracts. This is intentional and consistent with `qoderwork`: the empty `depthCapabilities()` correctly advertises all depth features as `planned` rather than implying support that has not been verified against the official QwenWork docs.
- The user root `~/.qwenwork` follows the `qwen` / `qoderwork` naming convention and is user-specified. Re-confirmation against `https://qwenwork.cn/docs` is a follow-up before any deeper adapter work.

## Failure And Rollback

- External boundary: filesystem writes use the existing Skill platform service and validation. No QwenWork-specific durable state is created by this skeleton.
- Partial failure behavior: existing per-platform result reporting applies.
- Recovery/rollback: disabling or removing the catalog entry does not delete previously distributed QwenWork files.

## Analyze Result

- Requirement links: `FR-QWENWORK-001`
- Verification links: `TEST-QWENWORK-001`, `TEST-QWENWORK-002`, `TEST-QWENWORK-003`, `TEST-QWENWORK-004`
- Blocking conflicts: none. Documentation tooling was rate-limited during this change; the user root is user-specified and recorded as a follow-up confirmation item.
- Unresolved `[待确认]`: none for the skeleton scope. Deeper integration (MCP/session/provider) is explicitly out of scope and deferred.

## Traceability

| Requirement | Design | Verification | Task |
| --- | --- | --- | --- |
| `FR-QWENWORK-001` | `DES-QWENWORK-001` | `TEST-QWENWORK-001`, `TEST-QWENWORK-002`, `TEST-QWENWORK-003`, `TEST-QWENWORK-004` | `T-QWENWORK-001` through `T-QWENWORK-006` |
