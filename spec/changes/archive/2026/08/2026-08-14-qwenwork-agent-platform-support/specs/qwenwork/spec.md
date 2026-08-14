# QwenWork Platform Delta Spec

## Added Requirements

### Requirement: PromptHub must recognize QwenWork as a built-in platform

PromptHub must provide a built-in `qwenwork` platform representing QwenWork
(千问办公). It must use the user-specified `~/.qwenwork` root on macOS/Linux
and `%USERPROFILE%\.qwenwork` on Windows, with `skills/` as the user-level
Skill directory convention. It must appear in the platform catalog and the
default platform ordering so existing Agent and Skill discovery surfaces it.

#### Scenario: User distributes a Skill to QwenWork

- Given QwenWork is enabled as a PromptHub platform
- When the user installs a Skill to QwenWork
- Then PromptHub writes the package under the resolved `~/.qwenwork/skills/<skill-name>` directory
- And the platform remains visible even before QwenWork has created its root directory.

#### Scenario: User selects QwenWork in the platform list

- Given QwenWork is a built-in platform
- When the user opens the Agent platform list
- Then QwenWork appears in its declared default-sorted position after QoderWorker
- And it renders the official QwenWork brand mark (`qwenwork.png`).

### Requirement: PromptHub must not advertise unverified QwenWork depth capabilities

PromptHub must record QwenWork with empty placeholder depth capabilities, so
provider/model, sessions, and usage are reported as `planned` and appearance as
`unsupported`. It must not expose MCP, session, or provider/model management
until QwenWork-specific adapters exist.

#### Scenario: Capability inventory reports QwenWork as planned

- Given QwenWork is a built-in platform
- When the capability inventory is resolved
- Then `providerModel`, `sessions`, and `usage` report status `planned` with evidence `adapter-evidence-pending`
- And `appearance` reports status `unsupported`
- And QwenWork is included in the platform count and planned-session adapter assertions.
