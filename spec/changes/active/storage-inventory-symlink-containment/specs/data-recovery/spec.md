# Data Recovery Delta

## Modified Requirements

### Requirement: Storage inventory must classify contained symlinks instead of refusing them in record mode

`createStorageInventory` with `symlinkPolicy: "record"` must classify each
encountered symlink as `internal` (realpath resolves inside the inventory
root), `escaping` (resolves outside), or `dangling` (realpath fails with
`ENOENT`). Any other `realpath` failure (`ELOOP`, permission errors) must
throw instead of being classified as dangling. Classification must compare
against the realpath-resolved root so platform directory aliases (macOS
`/var` -> `/private/var`) cannot misclassify internal links as escaping.

#### Scenario: Internal relative alias link

- Given a canonical storage root containing `data/skills/demo/AGENTS.md` as a
  relative symlink to `CLAUDE.md` in the same directory
- When `createStorageInventory` runs with `symlinkPolicy: "record"`
- Then the inventory records the link with kind `internal` and its raw target
- And the regular `CLAUDE.md` file is inventoried normally
- And the inventory digest and totals exclude the link itself

#### Scenario: Symlink cycle fails closed

- Given a storage root containing two symlinks that point at each other
- When `createStorageInventory` runs with `symlinkPolicy: "record"`
- Then the call throws an error naming the cyclic path
- And the link is not classified as dangling

### Requirement: Inventory copies must support explicit symlink preservation policies

`copyStorageInventory` must accept a symlink policy controlling how recorded
links land in the destination:

- `preserve`: recreate `internal` links (target rewritten as a relative path
  inside the destination) and `dangling` links with relative targets; skip
  escaping links and dangling links with absolute targets. Used when copying
  the user's own live root (0.7.1 snapshot contract).
- `preserve-strict`: same recreation rules, but escaping links and absolute
  dangling targets throw. Used when copying untrusted backup/candidate roots.

Destination links are never verified by `verifyStorageInventory`, which
remains regular-file-only.

#### Scenario: Preserve normalizes absolute internal targets

- Given an inventory whose source root contains an internal symlink with an
  absolute target inside the source root
- When `copyStorageInventory` runs with `preserve` or `preserve-strict`
- Then the destination contains a symlink whose target is the equivalent
  relative path resolving inside the destination root

#### Scenario: Strict policy rejects escaping links

- Given a backup root containing a symlink resolving outside the root
- When `copyStorageInventory` runs with `preserve-strict`
- Then the copy throws before any destination content is published

### Requirement: Startup authority publication must tolerate contained Skill symlinks

The canonical storage authority publication path must not fail when Skill
packages under `data/skills` contain intra-package symlinks. The checkpoint
capacity inventory must use the record policy, and the canonical projector
must materialize contained links as regular shadow files carrying the target
content. Escaping or dangling links inside a Skill package must fail
publication with an error naming the package path.

#### Scenario: First publication with alias-linked Skill package

- Given a 0.7.x user data root with an authority state absent, a renderer
  migration marker present, and a Skill package containing
  `AGENTS.md -> CLAUDE.md`
- When `ensureCanonicalStorageAuthorityOnStartup` runs
- Then publication completes and the canonical shadow contains `AGENTS.md`
  as a regular file with the same content as `CLAUDE.md`

#### Scenario: Escaping link inside a Skill package fails closed

- Given a Skill package containing a symlink resolving outside the package
- When the canonical projector collects package files
- Then publication fails with an error naming the offending link

### Requirement: Upgrade backups and restores must be symmetric for contained symlinks

Upgrade snapshot creation must preserve contained links with relative targets
(normalizing absolute internal targets). Restoring an upgrade backup must
recreate contained links into the staged candidate instead of refusing every
symlink; escaping links inside a backup must still fail the restore and roll
back current data.

#### Scenario: Round-trip a backup containing an internal link

- Given an upgrade backup created from a root containing
  `data/skills/demo/AGENTS.md -> CLAUDE.md`
- When `restoreFromUpgradeBackupAsync` runs
- Then the staged candidate recreates `AGENTS.md` as a symlink with the same
  relative target
- And the restore completes

#### Scenario: Tampered backup with escaping link still fails

- Given a backup root containing a symlink resolving outside the backup root
- When `restoreFromUpgradeBackupAsync` runs
- Then the restore fails, rolls back current data, and no staged candidate
  is published

### Requirement: Remaining inventory consumers must use the record policy on live roots

Portable snapshot restore (candidate preparation and capacity checks),
storage-root migration (copy, verify, and rollback digest comparison), and
journaled database recovery (detached root copy) must use the record policy
on live roots and recreate contained links in staged copies with the same
preserve semantics as upgrade backups. Legacy-layout migration assertions
inside recovery normalization remain fail-closed.

#### Scenario: Portable restore candidate preserves Skill links

- Given a live root with `data/skills` containing an internal symlink
- When a portable snapshot restore prepares its candidate
- Then the staged candidate contains the recreated symlink
- And the candidate verification still passes

## Removed Requirements

None. The default `refuse` behavior remains for consumers that never opted
in; no stable requirement is weakened.
