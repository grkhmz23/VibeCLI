# Audit Evidence Mapping

`vibe audit-map <run-id>` maps run artifacts to controls in the selected schema.

Mapped evidence includes ledger manifests, scanner results, verification results, CI status, release readiness, provenance, evidence bundles, remote attestation records, organization approvals, retention plans, handoff summaries, release packets, git lifecycle reports, reviewer feedback, and merge readiness.

VibeCLI does not read `.env` files, private keys, raw provider outputs, or unbounded command logs for audit mapping.
