# Spec Delta: Unify Skill Platform Visibility

## Added Requirements

### `FR-SPV-001`: Single authoritative enabled predicate

PromptHub MUST determine a platform's distribution/list visibility from one
authoritative predicate, shared by Settings and every Skills distribution or
Agent list surface:

- the shared distribution target `agent-skills-global` is always enabled;
- a custom Agent platform is enabled iff its `customAgent.enabled` is not
  `false`;
- any other (built-in) platform is enabled iff its id is not in
  `disabledPlatformIds`.

Filesystem detection MUST NOT hide an enabled built-in platform from these
lists.

#### Scenario: Enabled but undetected built-in platform

- **GIVEN** a built-in platform whose id is not in `disabledPlatformIds`
- **AND** its root directory does not exist on disk
- **WHEN** the user opens Skills global distribution or the Agents list
- **THEN** the platform appears in the list
- **AND** it is selectable for install.

#### Scenario: Disabled platform hidden everywhere consistently

- **GIVEN** a built-in platform whose id is in `disabledPlatformIds`
- **WHEN** the user opens Settings and any Skills list surface
- **THEN** Settings shows the toggle as OFF
- **AND** the Skills list surfaces omit the platform.

### `FR-SPV-002`: Detection is a hint, not a gate

For distribution rows, PromptHub MAY show a non-blocking hint when an enabled
target's root directory has not been detected on disk and the skill is not yet
installed there. The hint MUST NOT prevent selection or install, and MUST be
suppressed for the shared distribution target and for already-installed rows.

#### Scenario: Undetected enabled target is shown with a hint

- **GIVEN** an enabled built-in platform whose root is not on disk
- **WHEN** the user views the distribution row for a skill not installed there
- **THEN** the row renders a "not detected; will be created on install" hint
- **AND** the row remains selectable.

### `FR-SPV-003`: Complete platform ordering

`DEFAULT_SKILL_PLATFORM_ORDER` MUST contain every id in `SKILL_PLATFORMS`
exactly once so that Settings and Skills sort platforms into consistent
positions.

#### Scenario: Order array covers the registry

- **GIVEN** the current `SKILL_PLATFORMS` registry
- **WHEN** the order array is validated
- **THEN** every registry id is present exactly once.

## Modified Requirements

- Skills distribution and Agent list surfaces derive membership from
  `FR-SPV-001` instead of the former detection-or-configured gate.
- Disk detection remains available as a separate predicate for surfaces whose
  purpose is to browse real installations.

## Removed Requirements

- None. The former "distribution visibility = detected OR configured" rule is
  superseded by `FR-SPV-001`/`FR-SPV-002`.

## Verification

- `TEST-SPV-001`: `filterEnabledPlatforms`/`isPlatformEnabled` unit tests prove
  an enabled-but-undetected built-in platform is retained, disabled built-ins
  are dropped, disabled custom Agents are dropped, and the shared target is
  always enabled.
- `TEST-SPV-002`: a registry/order test asserts `DEFAULT_SKILL_PLATFORM_ORDER`
  equals the set of `SKILL_PLATFORMS` ids (catches missing `copilot`/`amp`).
- `TEST-SPV-003`: `SkillPlatformTargetRow` renders the not-detected hint only
  when undetected, not installed, and not the shared target.
- `TEST-SPV-004`: a distribution regression test asserts the list includes an
  enabled-but-undetected built-in platform.
