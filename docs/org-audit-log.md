# Organization Audit Log

The organization audit log is local and tamper-evident. It writes JSONL events plus a hash chain under `.vibecli/org/audit`.

```bash
vibe org audit
vibe org audit --verify
vibe org-report <run-id>
```

The audit log does not claim external audit logging. It stores bounded, redacted event summaries and artifact hashes.
