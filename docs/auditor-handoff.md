# Auditor Handoff

`vibe auditor-handoff <run-id>` creates an auditor-facing redacted handoff bundle.

```bash
vibe auditor-handoff <run-id>
vibe auditor-handoff <run-id> --verify
```

The bundle includes coverage, gaps, evidence indexes, signature status, reviewer approval summaries, retention summaries, and verification status. It excludes private keys, raw secrets, raw provider outputs, and unbounded logs. It is never uploaded by VibeCLI in Phase 13.
