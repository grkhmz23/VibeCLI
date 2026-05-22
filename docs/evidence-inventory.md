# Evidence Inventory

`vibe evidence-inventory <run-id>` scans only `.vibecli/runs/<run-id>` and writes:

- `EVIDENCE_INVENTORY.json`
- `EVIDENCE_INVENTORY.md`

Inventory classifies evidence into run ledger, patches, rollback, verification, scanner, handoff, git lifecycle, release, provenance, evidence, remote attestation, organization, audit, console, and unknown classes.

Private keys are blocked. `.env` and `.env.*` are blocked except `.env.example`. Raw provider outputs and unbounded command logs are sensitive and excluded from default archives. The inventory records hashes, sizes, sensitivity, archive inclusion, and warnings without uploading or deleting anything.
