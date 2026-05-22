# Compliance Check Bundles

`vibe compliance-bundle <run-id>` creates a read-only local bundle for audit support.

```bash
vibe compliance-bundle <run-id>
vibe compliance-bundle <run-id> --sign --confirm "SIGN COMPLIANCE BUNDLE <run-id>"
vibe compliance-bundle <run-id> --verify
```

The bundle is redacted, local, and not uploaded. It excludes private keys, `.env` files, raw provider outputs, and unbounded logs. It does not certify compliance.
