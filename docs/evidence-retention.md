# Evidence Retention

Retention commands plan and mark retention metadata only. Phase 12 does not delete, purge, move, upload, or archive evidence remotely.

```bash
vibe retention <run-id>
vibe retention <run-id> --policy production
vibe retention <run-id> --mark --confirm "MARK RETENTION <run-id>"
vibe retention <run-id> --purge-preview
```

Legal hold policies use `retainUntil: null` and produce no purge eligibility. Purge preview is informational only.
