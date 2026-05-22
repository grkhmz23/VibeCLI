# Remote Attestation

Phase 11 can create local attestation export packs and optionally submit a redacted metadata payload to a configured HTTPS target.

```bash
vibe attestation export <run-id>
vibe attestation submit <run-id> --target <name> --dry-run
vibe attestation submit <run-id> --target <name> --confirm "SUBMIT ATTESTATION <run-id> TO <name>"
vibe attestation receipt <run-id>
```

Remote submission is disabled by default through `remote_attestation.allow_remote_submission: false`. Submission requires exact confirmation and sends metadata only by default. VibeCLI Phase 11 does not upload source code, evidence archives, private keys, registry artifacts, branches, tags, releases, deployments, or packages.
