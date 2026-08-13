# Spec Delta: Skill Batch Import (ZIP + multi-URL)

## Added Requirements

### `FR-BATCH-001`: Install a skill from a local ZIP archive

PromptHub MUST install a skill from a local `.zip` archive through the atomic
package lifecycle, reusing the hardened ZIP extractor. The lifecycle MUST
validate the package, fingerprint it, run safety review, and apply it atomically
with rollback on failure — identical guarantees to remote-zip install.

#### Scenario: Valid single-skill ZIP

- **GIVEN** a `.zip` containing a `SKILL.md` (optionally in a wrapper folder)
- **WHEN** the user installs it via drag/drop, file picker, or batch import
- **THEN** the skill is materialized, validated, and installed into the managed
  skills directory
- **AND** a DB row is created with a `local-zip`-derived source identity.

#### Scenario: ZIP rejected by safety bounds

- **GIVEN** a `.zip` with path-traversal entries, excessive size/count, or
  zip-bomb compression
- **WHEN** install is attempted
- **THEN** the operation fails fast with a sanitized diagnostic
- **AND** no files are written to the managed skills directory.

### `FR-BATCH-002`: Preview a local ZIP without installing

PromptHub MUST provide a read-only snapshot of a local `.zip` (parsed
SKILL.md identity + fingerprint) so the user can review a batch before
applying. The snapshot MUST NOT write to the managed skills directory or DB.

### `FR-BATCH-003`: Batch import from multiple sources

PromptHub MUST install multiple skill sources in one action: a mix of local
`.zip` archives and GitHub URLs. The batch MUST run sequentially, update
progress per item, isolate each item's failure (one bad source does not abort
the rest), route safety-review-required items through the existing review
queue, and report a structured summary (`succeeded`, `failed`, `reviewRequired`).

#### Scenario: Mixed batch with one failing source

- **GIVEN** two valid ZIPs and one malformed ZIP
- **WHEN** the user runs batch import
- **THEN** the two valid skills install, the malformed one is reported as failed
- **AND** a summary toast reflects `2 succeeded, 1 failed`
- **AND** already-applied installs are not rolled back by the later failure.

### `FR-BATCH-004`: Drag-and-drop ZIPs onto My Skills

Dragging one or more `.zip` files onto the My Skills view MUST open the batch
import surface pre-filled with those archives for review. Directories and
`.md` files continue to use the existing local-scan flow.

### `NFR-BATCH-001`: Reuse, do not duplicate, install primitives

The local-zip path MUST reuse `extractSkillZipArchive`, the package lifecycle,
fingerprinting, safety review, and atomic replacement — it MUST NOT introduce a
parallel install codepath that bypasses those guarantees.

## Verification

- `TEST-BATCH-001`: local-zip lifecycle tests — valid ZIP installs; ZIP without
  SKILL.md errors; traversal/zip-bomb/oversized ZIPs are rejected; duplicate
  names handled. Fixtures built with `fflate.zipSync`.
- `TEST-BATCH-002`: `getLocalZipPackageSnapshot` returns identity+fingerprint
  without persisting; cleans its temp dir.
- `TEST-BATCH-003`: `validateOperationSource` accepts/rejects `local-zip`;
  `getSourceIdentity` covers it.
- `TEST-BATCH-004`: `useCreateSkillBatchImport` loops, isolates failures,
  advances progress, summarizes; URL text parsing; `normalizeDroppedSkillPath`
  keeps `.zip`.
