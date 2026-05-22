# Beta Readiness

`vibe beta-check` aggregates local QA evidence into a beta readiness verdict:

- `beta_ready`
- `ready_with_warnings`
- `blocked`

It reads dogfood, scanner, red-team, package, docs, and performance reports. It does not call providers or remote services.

Strict mode treats missing required reports as blockers:

```sh
vibe beta-check --strict
```

Create a local blocker backlog with:

```sh
vibe beta-backlog
```

Beta readiness is a local quality gate, not production certification.
