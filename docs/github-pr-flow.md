# GitHub PR Flow

GitHub integration is optional and uses the `gh` CLI.

```bash
vibe github doctor
vibe github pr <run-id>
vibe github pr <run-id> --create --confirm "CREATE PR <run-id>"
```

The default PR command is a dry summary. PR creation requires exact confirmation and does not push by default. Pushing requires `--push` and the exact `PUSH AND CREATE PR <run-id>` confirmation.

VibeCLI refuses force push and refuses main/master branches unless explicitly allowed.
