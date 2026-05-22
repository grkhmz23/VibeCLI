# Provenance

Phase 10 generates SLSA-inspired local provenance for a VibeCLI run.

```bash
vibe provenance key status
vibe provenance key init --confirm "CREATE PROVENANCE KEY"
vibe provenance key export-public
vibe provenance <run-id>
vibe provenance <run-id> --sign --confirm "SIGN PROVENANCE <run-id>"
vibe provenance <run-id> --verify
```

Unsigned provenance generation writes `.vibecli/runs/<run-id>/provenance/provenance-statement.json` and `PROVENANCE.md`. The statement hashes the prompt instead of storing raw prompt text and records release, ledger, verification, scanner, CI, deployment-readiness, and release-readiness metadata.

Signing uses a local Ed25519 key under `.vibecli/keys/`. The private key is never printed and is not included in handoff, release, or evidence bundles. Local signatures provide local integrity evidence only; they are not legal identity proof or certified SLSA compliance.
