# Signed Evidence

Phase 10 evidence bundles collect redacted release-safe artifacts into a local archive:

```bash
vibe checksums <run-id>
vibe checksums <run-id> --verify
vibe evidence <run-id>
vibe evidence <run-id> --sign --confirm "SIGN EVIDENCE <run-id>"
vibe evidence <run-id> --verify
```

Checksums cover release packets, release readiness, deployment readiness, CI status, selected handoff and lifecycle artifacts, the ledger manifest, and provenance artifacts. The ledger manifest is also verified through `vibe ledger` because it is recomputed after provenance operations.

Evidence bundles exclude `.vibecli/keys`, private keys, `.env` files, raw agent outputs, full command logs, and full run directories. Signed evidence ensures signed provenance exists before building the bundle.
