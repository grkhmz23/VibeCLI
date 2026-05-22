# Reviewer Directory Import

Reviewer directory import reads local JSON, YAML, or CSV files.

```bash
vibe reviewer-directory validate --file reviewers.yaml
vibe reviewer-directory import --file reviewers.yaml
vibe reviewer-directory import --file reviewers.yaml --apply --confirm "IMPORT REVIEWERS"
```

Raw email addresses are hashed by default. VibeCLI does not connect to SSO, LDAP, or network identity providers in Phase 13.
