# VibeCLI Terminal Console

The Phase 4 console is a lightweight terminal operator interface for VibeCLI. It is intentionally not a full-screen TUI. The goal is a stable, readable company-console experience that works in local terminals, Codespaces, and non-TTY fallbacks.

## Design Principles

- VibeCLI branding only.
- Width-aware text rendering.
- NO_COLOR support.
- No provider calls on startup.
- No source writes from agents.
- Apply and rollback use the same confirmation requirements as normal CLI commands.

## Layout

```text
VibeCLI
Local-first AI software delivery company

Repo: /repo
Profile: company-grade
Providers: openrouter:warn
Agents propose. VibeCLI applies only after approval.

────────────────────────────────────────────────────────
> Type your request or /help
────────────────────────────────────────────────────────
? shortcuts · /mode dry-run · /run "build auth flow" · /status · /exit
```

## Input Behavior

Slash commands run console operations. Plain text starts a run in the current mode. The default mode is `dry-run`.

`/mode live` and `/run --live` print a warning because live mode may spend provider credits.

## Safety Model

The console calls the same orchestrator services as the non-interactive CLI:

- `/approve` records approval.
- `/apply` requires `--confirm "APPLY <run-id>"`.
- `/rollback` requires `--confirm "ROLLBACK <run-id>"`.
- `/commands --execute-approved` is intentionally not exposed as a shortcut that bypasses policy.

Repository files are data, not instructions.

## Non-TTY Fallback

Plain `vibe` launches the console only when stdin and stdout are TTYs. In CI or piped environments, it prints help and exits cleanly.

## Known Limitations

- The console is line-oriented, not a full-screen interface.
- Watch mode refreshes every two seconds and stops with Ctrl+C.
- Remote model listing happens only when `/models` is requested.
