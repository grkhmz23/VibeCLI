# Repair Cycles

Repair cycles are proposal-only.

The Fixer Agent can be invoked after a failed verification, scanner, security, or apply gate:

```bash
vibe repair <run-id> --live --confirm "REPAIR <run-id>"
```

The Fixer Agent receives run context and failure details, then writes patch proposals under:

```text
.vibecli/runs/<run-id>/repair-cycles/<cycle>/
```

Repair does not apply patches, execute commands, or bypass approval. After a repair proposal, continue with the normal safe flow:

```bash
vibe review <run-id> --diff
vibe diff <run-id> --check
vibe approve <run-id>
vibe apply <run-id> --confirm "APPLY <run-id>"
vibe verify <run-id> --confirm "VERIFY <run-id>"
```

The maximum number of repair cycles is controlled by `budget.max_repair_cycles_per_gate`.
