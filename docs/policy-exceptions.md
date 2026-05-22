# Policy Exceptions

Policy exceptions document known policy gaps.

```bash
vibe exceptions <run-id>
vibe exceptions <run-id> --request "reason" --policy verification.require_tests --severity medium --mitigation "manual QA"
vibe exceptions <run-id> --approve <exception-id> --by "Reviewer" --confirm "APPROVE EXCEPTION <exception-id>"
```

Exception approval does not bypass source apply, verification, scanners, ledger checks, or reviewer judgment.
