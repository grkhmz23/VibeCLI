# Scanner Readiness

`vibe scanner-check` detects optional external scanners without running heavy scans:

- gitleaks
- semgrep
- osv-scanner
- trivy
- pnpm audit
- npm audit
- yarn npm audit
- bun audit

Safe local version/help checks require exact confirmation:

```sh
vibe scanner-check --run-safe --confirm "RUN SAFE SCANNER CHECK"
```

Missing scanners are non-fatal for dry-run beta checks.
