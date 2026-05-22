# Governed Release Operations

Phase 9 release operations are local-first and artifact-driven.

Core flow:

```bash
vibe release <run-id> --channel beta
vibe changelog <run-id>
vibe version <run-id> --bump patch
vibe ci <run-id>
vibe deployment-readiness <run-id> --channel beta
vibe release-readiness <run-id> --channel beta
```

`vibe release` creates a local release packet under `.vibecli/runs/<run-id>/release/`. It does not create branches, tags, deployments, packages, GitHub releases, or remote mutations.

Generated packet files include:

- `RELEASE_PACKET.md`
- `RELEASE_SUMMARY.json`
- `RELEASE_MANIFEST.json`
- `RELEASE_CHECKLIST.md`
- `RELEASE_NOTES.md`
- `DEPLOYMENT_READINESS.md`
- `CI_STATUS.md`

Use `vibe release <run-id> --verify` to verify the release manifest and underlying run ledger.
