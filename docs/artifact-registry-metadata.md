# Artifact Registry Metadata

Phase 11 generates OCI-inspired metadata for manual operator use:

```bash
vibe registry-metadata <run-id>
vibe registry-metadata <run-id> --image ghcr.io/example/app --tag 1.2.3
```

Artifacts are written under `.vibecli/runs/<run-id>/remote-attestation/`. VibeCLI does not run Docker, ORAS, cosign, registry login, or registry push in Phase 11.
