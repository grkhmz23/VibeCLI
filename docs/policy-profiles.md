# Policy Profiles

`vibe init` creates four local policy profiles:

- `fast`
- `secure`
- `company-grade`
- `strict-enterprise`

Profiles are stored under `.vibecli/policies/profiles/` and are normal YAML files. They define routing, security, verification, scanner, approval, ledger, and budget expectations.

Commands:

```bash
vibe policies list
vibe policies show company-grade
vibe policies validate
vibe run "Implement auth" --policy company-grade
```

`strict-enterprise` cannot disable exact confirmation.
