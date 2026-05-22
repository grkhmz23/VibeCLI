# Branching And Commits

Phase 8 branch and commit commands are guarded repository operations.

Branch preview:

```bash
vibe branch <run-id>
```

Branch creation:

```bash
vibe branch <run-id> --create --confirm "CREATE BRANCH <run-id>"
```

Commit message generation:

```bash
vibe commit-message <run-id>
vibe commit-msg <run-id>
```

Commit preview:

```bash
vibe commit <run-id>
```

Commit creation:

```bash
vibe commit <run-id> --create --confirm "COMMIT <run-id>"
```

VibeCLI stages only applied files by default and does not stage raw run artifacts, `.env` files, private keys, protected paths, or unrelated files. Commit commands never push.
