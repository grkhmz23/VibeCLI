# Routing

Phase 6 routes each live agent through configured provider/model policy.

Routing supports:

- primary provider/model
- `model_alias`
- ordered fallback models
- strategy-level fallback behavior
- missing env var detection
- local-first preference metadata
- context, capability, and pricing metadata when known

Preview routing without remote model listing:

```bash
vibe route
vibe route --agent implementation
```

Live runs write `routing-plan.json` into the run ledger.
