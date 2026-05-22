# Release Provenance Policy

Policy profiles include provenance and GitHub release draft controls:

```yaml
provenance:
  require_provenance_statement: true
  require_signed_provenance: false
  require_signed_evidence_for_release: false
github_release:
  allow_draft_creation: true
  require_remote_tag_for_draft: true
  allow_publish: false
  allow_asset_upload: false
```

`secure` and `company-grade` require provenance statements. `company-grade` requires signed provenance for production release readiness. `strict-enterprise` requires signed provenance and signed production evidence.

No Phase 10 policy may enable GitHub release publishing or release asset uploads. Production release draft creation cannot bypass production release-readiness checks.
