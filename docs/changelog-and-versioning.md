# Changelog And Versioning

`vibe changelog <run-id>` creates a Keep a Changelog style preview in release artifacts. It does not modify `CHANGELOG.md`.

Writing the changelog requires exact confirmation:

```bash
vibe changelog <run-id> --write --confirm "WRITE CHANGELOG <run-id>"
```

`vibe version <run-id>` plans a semver bump from detected `package.json`, `pyproject.toml`, or `Cargo.toml` versions. It does not modify source files by default.

Applying a version plan requires exact confirmation:

```bash
vibe version <run-id> --apply --confirm "APPLY VERSION <run-id>"
```

Version application modifies only files listed in `release/version-plan.json`, does not modify lockfiles, and writes rollback artifacts under `release/version-rollback/`.
