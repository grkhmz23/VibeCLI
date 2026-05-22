# Beta Warning Triage

`vibe beta-warnings` aggregates warning evidence from beta, dogfood, scanner, docs, package, security, and performance reports.

Commands:

- `vibe beta-warnings`
- `vibe beta-warnings accept <warning-id> --by "<name>" --reason "<reason>" --confirm "ACCEPT BETA WARNING <warning-id>"`
- `vibe beta-warnings resolve <warning-id> --by "<name>" --reason "<reason>" --confirm "RESOLVE BETA WARNING <warning-id>"`

Accepted warnings remain visible in RC reports. Acceptance is local risk tracking, not risk removal.
