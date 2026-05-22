# Multi-Reviewer Approvals

Phase 12 adds local approval matrices with reviewer roles and quorum checks.

```bash
vibe org-approvals <run-id>
vibe org-approvals <run-id> --add --reviewer local-reviewer --role release_manager --decision approved --note "Approved" --confirm "ADD ORG APPROVAL <run-id>"
vibe org-approvals <run-id> --quorum
vibe org-approvals <run-id> --verify
```

Approval notes are hashed and secret-looking text is redacted before storage. Approval quorum does not bypass apply, verification, scanner, release, deployment, or publishing gates.
