# Remote Attestation Targets

Remote attestation targets are configured in `.vibecli/config.yaml`:

```yaml
remote_attestation:
  targets:
    org-log:
      type: generic-http
      url: https://attestations.example.com/v1/entries
      token_env: VIBECLI_ATTESTATION_TOKEN
      enabled: true
      headers:
        X-Source: vibecli
```

Commands:

```bash
vibe remote-targets list
vibe remote-targets doctor
vibe remote-targets doctor --ping --confirm "PING REMOTE TARGETS"
vibe remote-targets add generic-http --name org-log --url https://attestations.example.com/v1/entries --token-env VIBECLI_ATTESTATION_TOKEN --confirm "ADD REMOTE TARGET org-log"
vibe remote-targets disable org-log --confirm "DISABLE REMOTE TARGET org-log"
vibe remote-targets remove org-log --confirm "REMOVE REMOTE TARGET org-log"
```

Targets require safe HTTPS URLs by default. Token values are read from environment variables at submission time and are never written to config or artifacts.
