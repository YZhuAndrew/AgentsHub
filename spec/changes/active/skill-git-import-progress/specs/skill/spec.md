# spec.md — Skill Git Import Progress

## Requirement

When a user installs skills from a Git repository, the UI must show detailed progress instead of an opaque spinner, for both the Scan phase and the Import phase.

## Scenarios

### Scan phase (clone-based: SSH / non-GitHub hosts)

- **Given** the user enters a Git repository URL that requires a clone to scan (SSH or self-hosted Git),
- **When** they click "Scan Repository",
- **Then** the UI shows a phase label indicating the repository is being cloned, and, while git reports object-transfer progress, a live percentage.

- **When** the clone completes and SKILL.md entries are being enumerated,
- **Then** the UI shows a phase label indicating entries are being listed.

- **When** the scan completes,
- **Then** the progress panel is hidden and the results list is shown.

### Scan phase (GitHub HTTPS — REST API)

- **Given** the URL uses GitHub HTTPS (no clone),
- **When** scanning,
- **Then** the UI shows a generic "processing" indicator (no clone percentage, since no clone occurs).

### Import phase (single or batch)

- **Given** the user has selected one or more skills and clicks import,
- **When** each skill is being processed,
- **Then** the UI shows the batch counter (`index / total`) and the current skill name, plus the current internal phase label: cloning (with live percentage), reading files / computing fingerprint, safety scanning, or applying/writing.

- **When** a phase has no sub-detail (e.g. reading files),
- **Then** the phase label is shown without a percentage.

- **When** all skills are processed,
- **Then** the progress panel is hidden and the import summary is shown.

### Degradation

- **When** no progress detail is available but loading is active,
- **Then** the UI shows a spinner with a generic "processing" label.

- **When** the main process has no `requestId` (legacy callers),
- **Then** no progress events are emitted and install/scan still succeed normally.
