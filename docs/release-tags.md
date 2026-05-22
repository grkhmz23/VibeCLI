# Release Branches And Tags

`vibe release-branch <run-id>` previews a safe local release branch name. Creating the branch requires exact confirmation:

```bash
vibe release-branch <run-id> --create --confirm "CREATE RELEASE BRANCH <run-id>"
```

Branch creation uses local `git checkout -b` and never pushes.

`vibe tag <run-id>` previews a local release tag. Creating the local tag requires exact confirmation:

```bash
vibe tag <run-id> --create --confirm "CREATE TAG <run-id>"
```

Tags are local-only in Phase 9. VibeCLI does not push tags and does not create GitHub releases.
