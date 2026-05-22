# Deployment Readiness

`vibe deployment-readiness <run-id>` generates a local deployment-readiness report. The alias is `vibe deploy-readiness <run-id>`.

The report checks local artifacts only:

- ledger status
- release packet status
- source apply status
- verification status
- scanner high/critical findings
- CI status
- rollback availability
- environment documentation
- policy exceptions
- manual QA checklist

Production mode is stricter:

```bash
vibe deployment-readiness <run-id> --channel production
```

Deployment-readiness never executes deployment commands and never calls cloud APIs.
