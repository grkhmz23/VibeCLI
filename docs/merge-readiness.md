# Merge Readiness

Phase 8 merge readiness reports whether a run looks ready from a policy perspective.

```bash
vibe merge-readiness <run-id>
vibe merge-check <run-id>
```

Optional GitHub read-only check:

```bash
vibe merge-check <run-id> --github --pr 123 --confirm "CHECK PR <run-id>"
```

VibeCLI checks local run state, apply status, commit status, verification, scanners, ledger integrity, policy exceptions, reviewer feedback, and GitHub status checks when available.

Phase 8 does not merge branches or call `gh pr merge`.
