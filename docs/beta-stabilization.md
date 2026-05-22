# Beta Stabilization

Phase 17 turns local dogfood evidence into beta release-candidate gates. It remains local-first and does not publish, deploy, push, create releases, upload evidence, upload source, or call live providers without exact confirmation.

Recommended workflow:

- `vibe dogfood run`
- `vibe dogfood-apply-smoke`
- `vibe scanner-check --strict`
- `vibe scanner-check --install-guide`
- `vibe security-redteam`
- `vibe package-check`
- `vibe package-install-check`
- `vibe docs-check --strict`
- `vibe perf-check`
- `vibe beta-check`
- `vibe beta-warnings`
- `vibe beta-backlog`
- `vibe beta-rc --strict`
- `vibe beta-trial create --target solo-developer`

Optional live RC smoke:

- `vibe live-smoke --rc --confirm "RUN LIVE RC SMOKE"`
