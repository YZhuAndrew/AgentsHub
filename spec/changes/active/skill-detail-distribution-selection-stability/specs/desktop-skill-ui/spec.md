# Delta Spec

## Added

- `FR-SDSS-001`: While a Skill distribution surface is open, background install-status refreshes and store object-identity churn for the same skill must not clear the user's platform selection.
- `FR-SDSS-002`: Switching to a different skill resets the platform selection; completing a batch install clears the selection; platform ids that become installed are pruned from an existing selection so a selection only ever contains currently-uninstalled platforms.
- `FR-SDSS-003`: The Skill detail auto safety scan must not re-run merely because the skill object identity changed in the store; it re-runs only when the skill's scan-relevant inputs change (skill id, name, source metadata, resolved content, AI config, or the auto-scan setting).
- `FR-SDSS-004`: Persisting a safety report that is unchanged from the current store value must not replace the skill object in the store.

## Modified

- The Skill markdown preview re-renders only when its rendered inputs change; unrelated parent re-renders must not re-parse the markdown document.

## Scenarios

- `TEST-SDSS-001`: Selecting a platform and then letting the delayed mount-time install-status IPC resolve keeps the selection intact.
- `TEST-SDSS-002`: Re-rendering the platform hook with a new skill object identity for the same id does not re-fetch install status and does not clear the selection.
- `TEST-SDSS-003`: Switching the hook to a different skill id clears the selection; platforms reported installed by a refresh are pruned from the selection.
- `TEST-SDSS-004`: A completed batch install clears the selection.
- `TEST-SDSS-005`: With auto-scan enabled, rendering the Skill detail page performs a bounded number of safety scans (no infinite scan/save loop) while the skill store still receives the persisted report.
- `TEST-SDSS-006`: Saving a safety report equal to the current one leaves the skill object identity in the store unchanged.
