# Reviewer Feedback

Reviewer feedback ingestion is read-only by default.

Show existing feedback:

```bash
vibe feedback <run-id>
```

Ingest a local file:

```bash
vibe feedback <run-id> --file review-notes.md
```

Ingest GitHub feedback with the `gh` CLI:

```bash
vibe feedback <run-id> --github --pr 123 --confirm "INGEST FEEDBACK <run-id>"
```

Feedback is redacted and bounded before being written to:

- `.vibecli/runs/<run-id>/reviewer-feedback.json`
- `.vibecli/runs/<run-id>/REVIEW_RESPONSE_PLAN.md`

Feedback ingestion does not create repair patches, apply changes, or run commands.
