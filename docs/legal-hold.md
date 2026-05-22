# Legal Hold Metadata

Legal hold commands write local metadata only. They do not delete, purge, move, upload, or preserve files through any external service.

Enable:

```bash
vibe legal-hold <run-id> --enable --reason "Audit preservation" --by "Local Reviewer" --confirm "ENABLE LEGAL HOLD <run-id>"
```

Release:

```bash
vibe legal-hold <run-id> --release --reason "Hold no longer required" --by "Local Reviewer" --confirm "RELEASE LEGAL HOLD <run-id>"
```

Reason text is hashed and redacted. Legal hold blocks purge candidate recommendations in lifecycle previews. Phase 14 still has no purge/delete implementation.
