# Evidence Lifecycle

Phase 14 evidence lifecycle automation is local-first. It inventories run evidence, previews retention enforcement, creates local redacted archives, records retention ledger events, tracks legal hold metadata, reports compaction opportunities, and summarizes cross-run lifecycle status.

Core commands:

```bash
vibe evidence-inventory <run-id>
vibe evidence-lifecycle <run-id>
vibe retention-enforce <run-id>
vibe evidence-archive <run-id>
vibe retention-ledger --verify
vibe evidence-report
```

No evidence lifecycle command deletes evidence, purges artifacts, uploads evidence, uploads source code, deploys, publishes, merges, pushes branches, or pushes tags in Phase 14.
