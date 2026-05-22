# Disposal Approvals

`vibe disposal-approvals <run-id>` shows the local disposal approval matrix.

Adding an approval requires exact confirmation:

```bash
vibe disposal-approvals <run-id> --add --reviewer local-reviewer --role release_manager --decision approved --note "Approved eligible local evidence disposal" --confirm "ADD DISPOSAL APPROVAL <run-id>"
```

Approvals are local integrity records. They do not delete evidence and cannot override legal hold, missing archive verification, or failed pre-delete checks.
