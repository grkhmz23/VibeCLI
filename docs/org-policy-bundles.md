# Organization Policy Bundles

Organization policy bundles summarize local organization config, policy profile hashes, approval policies, retention policies, security baseline, and remote-attestation defaults.

```bash
vibe org key init --confirm "CREATE ORG KEY"
vibe org-policy bundle
vibe org-policy bundle --sign --confirm "SIGN ORG POLICY"
vibe org-policy verify
vibe org-policy show
```

Signed bundles use a local Ed25519 organization key stored under `.vibecli/org/keys/`. The private key is gitignored and is never included in run artifacts or exports. A signed policy bundle is local integrity evidence, not a legal certificate.
