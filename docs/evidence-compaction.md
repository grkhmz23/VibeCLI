# Evidence Compaction

`vibe evidence-compact <run-id>` generates a compaction report that estimates how much smaller a compact summary bundle could be. It does not delete originals or rewrite evidence.

Create a compact summary bundle:

```bash
vibe evidence-compact <run-id> --bundle --confirm "CREATE COMPACT EVIDENCE <run-id>"
```

Verify:

```bash
vibe evidence-compact <run-id> --verify
```

Compact bundles include summaries only and exclude private keys, `.env` files, raw provider outputs, and unbounded command logs by default.
