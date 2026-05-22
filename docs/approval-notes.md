# Approval Notes

Approval notes are local integrity records for review handoff.

```bash
vibe approvals <run-id> --add --type review --decision approved --reviewer "Reviewer" --note "Reviewed" --confirm "ADD APPROVAL NOTE <run-id>"
vibe approvals <run-id> --verify
```

They use local SHA-256 payload hashes. They do not prove legal identity and do not use private keys.
