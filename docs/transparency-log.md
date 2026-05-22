# Transparency Log

Phase 11 creates local transparency entries and an append-only local chain:

```bash
vibe transparency <run-id>
vibe transparency append <run-id> --confirm "APPEND TRANSPARENCY <run-id>"
vibe transparency verify
vibe transparency verify <run-id>
```

The local chain is tamper-evident only. VibeCLI does not claim public or external transparency unless a remote submission receipt exists.
