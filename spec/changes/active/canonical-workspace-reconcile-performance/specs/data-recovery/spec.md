# Data Recovery Delta: Canonical Workspace Reconcile Cost

## ADDED Requirements

### FR-RECON-001: Unchanged workspaces are not re-materialized

`hydrateCanonicalSkillWorkspace` MUST return the existing workspace path
without copying, deleting, or renaming any files when the workspace contains a
`.canonical-bundle-hash` marker whose value equals the canonical bundle
manifest `contentHash`.

#### Scenario: repeated hydration of an unchanged bundle

- GIVEN a published canonical Skill bundle and a hydrated workspace
- WHEN `hydrateCanonicalSkillWorkspace` runs again and the bundle revision is
  unchanged
- THEN the workspace directory contents are not rewritten (an in-workspace
  sentinel file added after hydration survives)

#### Scenario: bundle revision changes

- GIVEN a hydrated workspace whose marker hash matches the previous revision
- WHEN the skill is republished so the bundle `contentHash` changes
- THEN hydration re-materializes the workspace from the new bundle and writes
  the new hash marker

#### Scenario: marker missing or unreadable

- GIVEN a hydrated workspace whose `.canonical-bundle-hash` is missing
- WHEN hydration runs
- THEN the workspace is re-materialized from the bundle

### FR-RECON-002: Canonical reconcile runs once per process per data root

The desktop and core `initDatabase()` wrappers MUST run
`CanonicalSkillDB.reconcileCanonicalWorkspaces()` and
`CanonicalRuleDB.reconcileCanonicalWorkspaces()` at most once per process for a
given data root, while per-mutation publication inside `CanonicalSkillDB`
continues to hydrate affected skills.

#### Scenario: repeated initDatabase calls

- GIVEN the canonical authority is established and the first `initDatabase()`
  call completed its reconcile
- WHEN `initDatabase()` is invoked again in the same process for the same data
  root
- THEN the reconcile pass does not execute again

#### Scenario: process restart re-reconciles

- GIVEN a new process (for example after backup-restore relaunch)
- WHEN `initDatabase()` runs
- THEN the reconcile pass executes exactly once for the process

### FR-RECON-003: Custom agent settings reads are cached

`readCustomAgentsFromSettings()` MUST serve results from a TTL cache (5 s) and
MUST be invalidated together with the existing custom paths cache when settings
are updated via `invalidateCustomPathsCache()`.

#### Scenario: batch platform listing

- GIVEN a settings row `customAgents` with entries
- WHEN `getSupportedPlatforms()` is called repeatedly within the TTL
- THEN only the first call reads the database

#### Scenario: settings update invalidates the cache

- GIVEN a cached `customAgents` value
- WHEN `invalidateCustomPathsCache()` runs (settings were updated)
- THEN the next read returns the updated rows

## MODIFIED Requirements

None. The canonical bundle remains the sole durable authority for Skill
package content; hydration remains a derived, disposable projection.

## REMOVED Requirements

None.
