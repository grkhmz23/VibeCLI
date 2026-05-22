# CI Ingestion

`vibe ci <run-id>` shows locally ingested CI status, or records an unknown local status when no CI has been ingested.

GitHub Actions ingestion is read-only and requires exact confirmation:

```bash
vibe ci <run-id> --github --confirm "INGEST CI <run-id>"
```

Local CI JSON can be ingested without remote calls:

```bash
vibe ci <run-id> --file ci-status.json
```

CI ingestion does not rerun workflows, dispatch workflows, deploy, publish, push, or mutate GitHub state. Output is redacted and bounded before persistence.
