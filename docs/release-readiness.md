# Release Readiness

`vibe release-readiness <run-id>` computes a governed release verdict from local run and release artifacts.

```bash
vibe release-readiness <run-id> --channel beta
vibe release-readiness <run-id> --channel production
```

Verdicts:

- `ready_to_release`
- `ready_with_warnings`
- `blocked`
- `not_ready`

Production blocks when ledger, verification, CI, deployment readiness, scanner findings, policy exceptions, release approval, rollback availability, or protected branch safety fail required gates.

Release readiness does not deploy, publish, merge, push branches, push tags, or create remote releases.
