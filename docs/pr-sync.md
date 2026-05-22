# PR Sync

GitHub PR sync uses the `gh` CLI and is optional.

Dry summary:

```bash
vibe github pr <run-id>
```

Confirmed update:

```bash
vibe github pr <run-id> --update --pr 123 --confirm "UPDATE PR <run-id>"
```

Confirmed comment:

```bash
vibe github pr <run-id> --comment --pr 123 --confirm "COMMENT PR <run-id>"
```

Confirmed sync:

```bash
vibe github pr <run-id> --sync --pr 123 --confirm "SYNC PR <run-id>"
```

Update and sync do not push and do not merge. They reuse redacted handoff artifacts and preserve the existing ledger, verification, and scanner safety gates.
