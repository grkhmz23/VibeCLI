# Ledger Integrity

VibeCLI maintains a local tamper-evident ledger manifest:

```text
.vibecli/runs/<run-id>/ledger-manifest.json
```

The manifest records SHA-256 hashes and sizes for important run artifacts. `manifestHash` is computed with the `manifestHash` field excluded to avoid recursive self-hash bugs.

Commands:

```bash
vibe ledger <run-id>
vibe ledger <run-id> --verify
vibe ledger <run-id> --refresh --confirm "REFRESH LEDGER <run-id>"
```

This is local tamper evidence only. It does not prove identity and does not provide remote notarization.
