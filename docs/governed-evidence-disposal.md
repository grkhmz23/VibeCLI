# Governed Evidence Disposal

Phase 15 supports local disposal of eligible run-evidence files only. It is designed for explicit operator review, not automatic purge.

Disposal is blocked unless the run has a plan, pre-delete checks pass, legal hold is not enabled, and the operator provides exact confirmation:

```bash
vibe disposal-execute <run-id> --confirm "DELETE EVIDENCE <run-id>"
```

VibeCLI never deletes source files, archives, private keys, `.env` files, global ledgers, organization audit logs, remote evidence, branches, tags, releases, deployments, packages, or registry artifacts in Phase 15.

Safe workflow:

```bash
vibe disposal-eligibility <run-id>
vibe disposal-candidates <run-id>
vibe disposal-plan <run-id>
vibe disposal-attestation <run-id>
vibe disposal-precheck <run-id>
vibe disposal-execute <run-id> --dry-run
vibe disposal-execute <run-id> --confirm "DELETE EVIDENCE <run-id>"
```
