# Provider Diagnostics

Provider diagnostics help teams understand whether configured providers are usable.

```bash
vibe providers doctor
vibe providers doctor --models
```

Checks include:

- required env var presence
- provider health check
- `runAgent` support
- `streamAgent` support
- model listing support
- optional model listing errors

Diagnostics never print raw API keys.
