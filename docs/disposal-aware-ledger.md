# Disposal-Aware Ledger

After governed disposal, `vibe ledger <run-id> --verify` can report `pass_with_disposals` when intentionally deleted files are recorded in `DELETED_ARTIFACTS.json` and backed by an untampered disposal receipt.

Strict mode treats missing files as failures even when a disposal receipt exists:

```bash
vibe ledger <run-id> --verify --strict
```

Unexpected missing files still fail verification. Tampered disposal receipts also fail verification.
