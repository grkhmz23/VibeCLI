# Repository Lifecycle

Phase 8 adds local repository lifecycle artifacts after a VibeCLI run.

Use:

```bash
vibe lifecycle <run-id>
```

This writes:

- `.vibecli/runs/<run-id>/git/repository-lifecycle.json`
- `.vibecli/runs/<run-id>/git/REPOSITORY_LIFECYCLE.md`

The lifecycle summary includes branch, apply, commit, GitHub PR, verification, scanner, ledger, readiness, and next safe actions.

It does not mutate source files, push, create PRs, or merge.
