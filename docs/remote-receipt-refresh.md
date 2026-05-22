# Remote Receipt Refresh

Receipt refresh is a read-only check of an existing remote submission receipt.

```bash
vibe receipt-refresh <run-id>
vibe receipt-refresh <run-id> --dry-run
vibe receipt-refresh <run-id> --verify-remote --confirm "VERIFY REMOTE RECEIPT <run-id>"
```

The default command does not call remote endpoints. `--verify-remote` performs a read-only GET only after exact confirmation, bounds the response body, and redacts tokens and headers.
