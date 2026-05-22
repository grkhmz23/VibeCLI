# Live Provider Smoke

`vibe live-smoke` is preview-only by default. It shows provider routing and missing environment variables without calling providers.

An actual provider call requires exact confirmation:

```sh
vibe live-smoke --provider openrouter --model openai/gpt-4o-mini --confirm "RUN LIVE SMOKE"
```

The prompt is intentionally tiny and cannot write source:

```text
Return JSON only: {"ok": true, "message": "live smoke"}
```

Provider credits may be spent only after exact confirmation. API keys are read from environment variables and are never logged.
