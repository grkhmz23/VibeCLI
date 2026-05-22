# Verified Engineering Loop

Phase 5 turns VibeCLI runs into an auditable engineering loop:

1. Run dry-run or live agents.
2. Open a review workspace.
3. Validate proposed diffs.
4. Approve and apply only with exact confirmation.
5. Verify package scripts explicitly.
6. Run built-in or external scanners.
7. Ask the Fixer Agent for repair proposals only when a gate fails.

The loop is intentionally not autonomous. Agents propose patches and commands, but source files change only through guarded apply.

## Core Commands

```bash
vibe workspace <run-id>
vibe diff <run-id> --check
vibe verify <run-id> --confirm "VERIFY <run-id>"
vibe scan <run-id>
vibe scan <run-id> --external --confirm "SCAN <run-id>"
vibe repair <run-id> --live --confirm "REPAIR <run-id>"
vibe cost <run-id>
```

## Artifacts

Phase 5 writes review and verification artifacts into `.vibecli/runs/<run-id>/`:

- `review-workspace.json`
- `REVIEW_WORKSPACE.md`
- `patch-validation.json`
- `verification-results.json`
- `scanner-results.json`
- `external-scanner-results.json`
- `cost-estimate.json`
- `repair-cycles/<cycle>/`

These artifacts are part of the run ledger and can be inspected without applying source changes.
