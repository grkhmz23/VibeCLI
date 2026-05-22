# Audit Interoperability

Phase 13 adds local enterprise audit interoperability. It maps existing VibeCLI run artifacts into audit-support reports without remote submission, source modification, deployment, package publishing, evidence deletion, or certification claims.

Use:

```bash
vibe audit-map <run-id>
vibe audit-coverage <run-id>
vibe audit-gaps <run-id>
```

These commands write redacted artifacts under `.vibecli/runs/<run-id>/audit/`.

The output is control mapping support only. It is not legal or regulatory certification.
