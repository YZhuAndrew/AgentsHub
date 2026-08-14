# Unify Skill Platform Visibility (Toggle-Authoritative)

## Phase And Status

- Phase: implement
- Status: in-progress
- Primary requirement: `FR-SPV-001`
- Exit condition: every Skills-module platform/Agent list surface and the
  Settings "Platform Display Order" toggles agree on the same authoritative
  enabled predicate; disk detection no longer hides an enabled built-in
  platform, and ordering is complete (`DEFAULT_SKILL_PLATFORM_ORDER` covers
  every registry id).

## Why

Users observed that the "Agents" list shown in Skills (global distribution,
Agents view, batch deploy, list view, manager) diverges from the "Agent 平台
是否启用" toggles in Settings: a platform toggled ON in Settings could be
absent from Skills, the counts differed, the order shifted, and the apparent
enabled state did not match.

Root cause: Skills surfaces shared `filterDeployablePlatforms()`, which gated
built-in platforms on **filesystem detection** (root dir exists) or explicit
configuration before applying the disabled filter. Settings listed **all**
`SKILL_PLATFORMS` and only consulted `disabledPlatformIds`. Two different
predicates produced two different lists. A secondary cause: the order array
`DEFAULT_SKILL_PLATFORM_ORDER` had 35 entries while the registry had 37
(missing `copilot` and `amp`), so the two surfaces sorted identically-named
platforms into different positions.

The install path already creates missing platform roots via
`fs.mkdir({ recursive: true })`, so requiring on-disk detection before showing
a target is not a correctness requirement — it is an over-restrictive filter.

## Scope

- In scope:
  - define one authoritative "platform enabled" predicate shared by Settings
    and every Skills distribution/Agent list surface;
  - replace the detection-gated membership filter with the toggle-authoritative
    filter in Skills surfaces (global distribution, Agents view, batch deploy,
    list view, manager, and sidebar resource controller where appropriate);
  - demote disk detection to a non-blocking hint badge in the distribution row;
  - complete `DEFAULT_SKILL_PLATFORM_ORDER` so it contains every registry id;
  - route Settings enabled/ordered state through the same predicate.
- Out of scope:
  - changing the on-disk install/uninstall lifecycle or receipt logic;
  - changing custom Agent persistence (`customAgent.enabled`) semantics;
  - the one-time legacy `trae` → `trae-cn` path migration;
  - unifying the duplicate `SHARED_AGENT_SKILLS_TARGET_ID` literal between
    `packages/core` and `packages/shared` (recorded as a follow-up).

## Risks

- Default state has `disabledPlatformIds = []`, so by default the distribution
  list now shows all enabled platforms (longer than the old detected-only
  list). This is the intended consistency behavior and is communicated by the
  detection hint plus user-managed toggles and ordering.
- A surface that genuinely browses real installations (sidebar resource
  controller) must not switch to toggle-authoritative membership if its purpose
  is to scan existing directories; it should use the detection-only filter.
- Switching a shared filter function used by many surfaces can propagate an
  unintended semantic change, so the migration is per-call-site and explicit.

## Rollback Thinking

No SQLite schema or persisted-state shape changes are introduced. The
toggle-authoritative predicate is pure and reversible: restoring the previous
`filterDeployablePlatforms` behavior at the call sites restores the old
visibility. `DEFAULT_SKILL_PLATFORM_ORDER` additions are additive and only
affect sort position.

## Related Records

- Stable reference: `spec/knowledge/reference/agent-platforms.md`
- Related active changes:
  `spec/changes/active/skills-issue-194-shared-global-target/`,
  `spec/changes/active/qwenwork-agent-platform-support/`
- Governing rules:
  `spec/rules/tdd-design-gate.md`,
  `spec/rules/testing-standards.md`,
  `spec/rules/submission-traceability-rules.md`
