# Proposal

## Phase And Status

- Phase: implement
- Status: complete
- Primary requirement: `FR-QWENWORK-001`
- Exit condition: QwenWork (千问办公) is available as a built-in PromptHub Agent and Skill target with a documented user root, a `skills/` directory convention, a platform-visible entry with the official QwenWork brand mark, empty placeholder capabilities, and stable reference documentation. MCP, session, provider/model, and Plugin distribution remain out of scope until QwenWork-specific adapters exist.

## Why

QwenWork (千问办公, https://qwenwork.cn) is an AI agent platform and intelligent
workspace from the Qwen family, exposing Skills, Hooks, and Connectors. It is a
sibling product to the already-integrated Qwen Code (`qwen`). PromptHub should
recognize it as a native platform target so users can distribute Skills to the
documented user root instead of creating a generic custom agent.

This change adds the minimal skeleton platform identity (root dir + skills
convention), matching the established `qoderwork` precedent. Deeper integration
(MCP, sessions, provider/model management, plugins) is deferred to follow-up
changes once the official QwenWork local contracts are confirmed.

## Scope

- In scope: built-in platform identity `qwenwork`, documented default user root (`~/.qwenwork` / `%USERPROFILE%\\.qwenwork` / `~/.qwenwork`), `skills/` directory convention, the official QwenWork brand mark (`qwenwork.png`), empty placeholder depth capabilities, capability and platform-icon regression tests, and stable reference documentation.
- Out of scope: MCP target preset, session adapter, provider/model adapter, Plugin distribution, and any installer/CLI detection. These require confirmed QwenWork local contracts that are not yet verified.

## Risks

- The official QwenWork documentation (https://qwenwork.cn/docs) could not be re-fetched during this change because the documentation tooling was rate-limited. The user root `~/.qwenwork` is specified by the requesting user and follows the `qwen` / `qoderwork` naming convention; it remains a follow-up item to re-confirm against the live QwenWork docs before deeper integration.
- A minimal-skeleton platform exposes Skill distribution without a verified MCP/session/provider contract. PromptHub must not imply those capabilities until dedicated adapters exist; the empty `depthCapabilities()` placeholder correctly advertises all depth features as `planned`.

## Rollback Thinking

- The platform entry is purely additive and data-driven. Removing the catalog entry, the capability placeholder, and the fallback icon leaves all QwenWork-owned files unchanged and has no migration or persistence impact.

## Related Records

- Stable workflow/knowledge docs: `spec/knowledge/reference/agent-platforms.md`
- Reference precedent: `qoderwork` platform entry, `spec/changes/active/grok-build-platform-support/`
