# Scanners

VibeCLI has two scanner layers in Phase 5.

Built-in scanners run with:

```bash
vibe scan <run-id>
```

They check protected file touches, secret-looking patch content, env example coverage, package script safety, and test presence.

External scanners require explicit confirmation:

```bash
vibe scan <run-id> --external --confirm "SCAN <run-id>"
```

Supported optional integrations are:

- `gitleaks`
- `osv-scanner`
- `semgrep`
- `trivy`
- package-manager audit

Missing scanner binaries are recorded as skipped. External scanner output is redacted before it is written to artifacts.
