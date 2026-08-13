# Spec Delta: TRAE Work CN root directory

## Modified Requirements

### `FR-TRAEWCN-001`: TRAE Work CN shares the TRAE IDE CN root

The built-in `trae-work-cn` platform MUST resolve its default root directory to
`~/.trae-cn` (macOS/Linux: `~/.trae-cn`; Windows: `%USERPROFILE%\.trae-cn`),
the same path as `trae-cn` (TRAE IDE CN). It MUST NOT resolve to a separate
`~/.trae-work-cn` root.

#### Scenario: Resolve the default root

- **GIVEN** the `trae-work-cn` built-in platform with no custom root override
- **WHEN** PromptHub resolves its root and skills directory
- **THEN** the root is `<home>/.trae-cn` and the skills directory is
  `<home>/.trae-cn/skills`
- **AND** the resolved root equals the `trae-cn` platform's resolved root.

#### Scenario: Custom override still honored

- **GIVEN** a user-configured root override for `trae-work-cn`
- **WHEN** PromptHub resolves the root
- **THEN** the override takes precedence over the shared default.

## Removed Requirements

- The prior "isolated `~/.trae-work-cn` root to avoid mutating TRAE IDE CN
  configuration" decision is superseded by `FR-TRAEWCN-001` (user-confirmed
  shared data directory).

## Verification

- `TEST-TRAEWCN-001`: `skill-installer-utils` registry/path test asserts
  `trae-work-cn` resolves to `.trae-cn`, not `.trae-work-cn`, and equals
  `trae-cn`'s resolved root.
