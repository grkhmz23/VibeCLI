# Dogfood QA

Phase 16 adds local dogfood QA for VibeCLI itself.

Dogfood fixtures are created under `.vibecli/dogfood/fixtures`. They are isolated git repositories and may be mutated only inside that dogfood workspace.

Safe workflow:

```sh
vibe dogfood plan
vibe dogfood fixtures
vibe dogfood run
vibe dogfood report
```

Dogfood runs use dry-run VibeCLI workflows by default. They do not call live providers and do not modify the main repository source.

Applying generated patches inside fixtures requires exact confirmation:

```sh
vibe dogfood run --apply-fixture-patches --confirm "APPLY DOGFOOD FIXTURE PATCHES"
```
