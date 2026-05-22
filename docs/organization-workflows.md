# Organization Workflows

Phase 12 organization workflows add local organization identity, policy bundles, approval quorum, retention planning, evidence export modes, and audit reports.

They are local-first. They do not deploy, publish, merge, push branches, push tags, upload source, upload evidence archives, or delete evidence.

```bash
vibe org status
vibe org init --confirm "INIT ORGANIZATION"
vibe org reviewers
vibe org audit --verify
```

`vibe org init` creates `.vibecli/org/keys`, `.vibecli/org/policy-bundles`, `.vibecli/org/audit`, and `.vibecli/org/exports`. It may enable `organization.enabled`, but it does not create a signing key unless explicitly requested.
