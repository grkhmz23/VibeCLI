# GitHub Release Drafts

Phase 10 can preview and optionally create or update GitHub draft releases:

```bash
vibe github release <run-id>
vibe github release <run-id> --check-remote-tag
vibe github release <run-id> --create-draft --confirm "CREATE RELEASE DRAFT <run-id>"
vibe github release <run-id> --update-draft --tag <tag> --confirm "UPDATE RELEASE DRAFT <run-id>"
```

The default command is preview-only and does not call GitHub mutation APIs. Draft creation requires exact confirmation, signed provenance unless explicitly allowed, ledger verification unless explicitly allowed, release readiness that is not blocked unless explicitly allowed, an existing local tag, and an existing remote tag by default.

VibeCLI Phase 10 does not publish GitHub releases, upload release assets, push tags, push branches, create remote tags, deploy, merge, or publish packages.
