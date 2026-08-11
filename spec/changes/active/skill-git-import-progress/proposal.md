# Proposal

## Problem

"从Git仓库安装" (Install from Git Repository) shows only a single spinner during both the Scan and Import phases, with no textual or percentage feedback. The Import phase is especially opaque: `installGitHubSkills` loops over each selected skill sequentially, and each skill internally re-clones the repo (`gitClone`), reads every file's bytes to compute a fingerprint (`readLocalRepoFileBuffersByPath`), runs a safety scan, and writes to disk. From the UI this entire sequence looks like one frozen spinner, so large repos appear stuck for a long time with no indication of what is happening or how far along the work is.

## Scope

- Report detailed progress for both the Scan phase (`scanRemoteGithub` clone path) and the Import phase (`runPackageOperation` → lifecycle → `saveRemoteGitSkillPackage`).
- Progress detail includes: current phase label, batch counter (`index / total` + skill name), and live git clone percentage parsed from `git clone --progress` stderr.
- Reuse the existing `agent-session-index` progress pattern (client `requestId` + `event.sender.send` + preload `onProgress` + renderer subscription) and the existing `SkillPackageOperationPhase` enum.

## Non-Goals

- No persistence or database changes; progress is non-durable UI state.
- No change to the clone algorithm (still `--depth 1` shallow clone, 60s timeout).
- No change to GitHub HTTPS scan path (which uses the REST API and emits no clone progress); only the SSH / non-GitHub clone scan path reports clone percentage.
- No cancel/abort support in this change (the clone timeout remains the only abort).
