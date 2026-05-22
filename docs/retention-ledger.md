# Retention Ledger

The retention ledger is a local tamper-evident hash chain stored under:

```text
.vibecli/evidence-lifecycle/retention-ledger/
```

Automatic events are recorded for inventory generation, retention previews, archive creation and verification, legal hold changes, and compaction reports or bundles. Manual events require exact confirmation:

```bash
vibe retention-ledger <run-id> --record --event retention_previewed --summary "Reviewed retention" --confirm "RECORD RETENTION EVENT <run-id>"
```

Verification:

```bash
vibe retention-ledger --verify
vibe retention-ledger <run-id> --verify
```

The retention ledger is local evidence only. It does not claim remote immutability, notarization, or legal compliance.
