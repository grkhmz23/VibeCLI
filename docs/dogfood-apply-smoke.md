# Dogfood Apply Smoke

`vibe dogfood-apply-smoke` creates a fresh isolated `node-package` fixture under `.vibecli/dogfood/fixtures`, applies a deterministic safe patch inside that fixture, verifies it, rolls it back, and verifies source restoration.

It never targets the main repository or a real user repository.

Command:

- `vibe dogfood-apply-smoke`
