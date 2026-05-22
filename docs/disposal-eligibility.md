# Disposal Eligibility

`vibe disposal-eligibility <run-id>` evaluates local disposal gates and writes:

- `.vibecli/runs/<run-id>/evidence-lifecycle/disposal/DISPOSAL_ELIGIBILITY.json`
- `.vibecli/runs/<run-id>/evidence-lifecycle/disposal/DISPOSAL_ELIGIBILITY.md`

Eligibility checks retention expiry, legal hold status, archive verification, retention ledger status, run ledger status, and organization disposal approval when configured.

This command never deletes files and never calls remote services.
