# VibeCLI

Local-first, provider-agnostic AI software delivery orchestrator.

VibeCLI turns one prompt into a structured engineering workflow: intake, repository scan, architecture planning, implementation proposal, tests, security review, patch review, approval, guarded apply, verification, handoff, release evidence, provenance, audit evidence, dogfood QA, and beta release-candidate checks.

## Why VibeCLI Is Different

VibeCLI is not a generic chat CLI. It is a local workflow runner for software delivery:

- Multi-agent workflow with explicit engineering roles.
- Provider-agnostic model routing and fallback policy.
- Local-first run ledger and artifact store.
- Patch proposals before source writes.
- Approval and exact-confirmation gates for sensitive actions.
- Verification, scanner, handoff, release, provenance, audit, and beta evidence.
- Remote mutations are disabled by default or require exact confirmation where supported.

## Current Status

VibeCLI is beta / release-candidate tooling. Dry-run mode works without provider keys. Live provider smoke passed when configured with OpenRouter, using `openai/gpt-4o-mini`, with no source writes, patch generation, deploy, publish, push, or key logging. The package is prepared for GitHub/local terminal testing, but it has not been published to npm by this prep step.

Production use requires manual validation. Audit and compliance artifacts are evidence-support records only; they do not certify legal or regulatory compliance.

## Installation

### A. From Local Clone

```sh
pnpm install
pnpm build
pnpm vibe --help
```

### B. From Local Tarball

```sh
pnpm build
npm pack
npm install -g ./vibecli-0.1.0.tgz
vibe --help
```

### C. From GitHub After Push

The configured Git remote is `https://github.com/grkhmz23/VibeCLI` and the current branch is `main`.

Install the current branch directly from GitHub:

```sh
npm install -g git+https://github.com/grkhmz23/VibeCLI.git#main
```

For the default branch without a branch pin:

```sh
npm install -g git+https://github.com/grkhmz23/VibeCLI.git
```

## Quick Start

```sh
vibe init
vibe doctor
vibe console
vibe run "Add a safe health check and tests"
vibe status
vibe workspace <run-id>
vibe review <run-id> --diff
```

Dry-run mode does not call model providers. Source writes require review, approval, and exact-confirmed apply.

## Provider Setup

OpenRouter:

```sh
export OPENROUTER_API_KEY="..."
vibe providers add openrouter
vibe providers doctor
vibe models list --provider openrouter
```

Generic OpenAI-compatible provider:

```sh
export LOCAL_API_KEY="..."
vibe providers add openai-compatible --name local --base-url http://localhost:11434/v1 --api-key-env LOCAL_API_KEY
vibe providers doctor
```

External OpenCode adapter, if you run one locally:

```sh
vibe providers add opencode
vibe providers doctor
```

## Safety Model

- Agents propose; VibeCLI applies only after approval.
- Patch proposals are reviewed before writes.
- Apply and rollback require exact confirmations.
- Rollback artifacts are written for applied patch sets.
- Provider config stores environment variable names, not raw keys.
- Live provider calls are optional and never happen by default.
- npm publish, deploy, push, merge, tag push, and release publication are not automated by default.
- Dangerous commands and source-write attempts are classified and blocked by policy gates.

## Core Workflows

### Run And Review

```sh
vibe run "Implement a small safe change"
vibe status
vibe workspace <run-id>
vibe review <run-id>
vibe diff <run-id> --check
```

### Apply And Rollback

```sh
vibe approve <run-id>
vibe apply <run-id> --confirm "APPLY <run-id>"
vibe rollback <run-id> --confirm "ROLLBACK <run-id>"
```

### Verify And Scan

```sh
vibe verify <run-id> --confirm "VERIFY <run-id>"
vibe scan <run-id>
vibe scan <run-id> --external --confirm "SCAN <run-id>"
vibe ledger <run-id> --verify
```

### Repair

```sh
vibe repair <run-id> --dry-run
```

### Git Lifecycle

```sh
vibe branch <run-id>
vibe commit-message <run-id>
vibe commit <run-id> --create --confirm "COMMIT <run-id>"
vibe lifecycle <run-id>
```

Git lifecycle commands are local and guarded. VibeCLI does not force push or push tags.

### Handoff And PR

```sh
vibe handoff <run-id>
vibe checklist <run-id>
vibe pr-body <run-id>
vibe github pr <run-id>
```

GitHub mutation commands require exact confirmation where they change remote state.

### Release And Provenance

```sh
vibe release <run-id> --channel beta
vibe release-readiness <run-id>
vibe provenance <run-id>
vibe provenance <run-id> --sign --confirm "SIGN PROVENANCE <run-id>"
vibe evidence <run-id>
```

Release commands generate local evidence and previews. They do not deploy, publish npm packages, push tags, or publish GitHub releases by default.

### Organization, Audit, And Evidence

```sh
vibe org status
vibe org-policy bundle
vibe org-approvals <run-id>
vibe audit-map <run-id>
vibe audit-coverage <run-id>
vibe evidence-inventory <run-id>
vibe evidence-lifecycle <run-id>
```

These workflows are local evidence and audit-support features. They are not legal identity proof or compliance certification.

### Dogfood And Beta Readiness

```sh
vibe dogfood run
vibe dogfood-apply-smoke
vibe security-redteam
vibe package-check
vibe package-install-check
vibe docs-check --strict
vibe beta-check
vibe beta-rc
```

Optional live RC smoke:

```sh
vibe live-smoke --rc --confirm "RUN LIVE RC SMOKE"
```

## Command Reference

Use `vibe --help` for the full command list. Important command groups:

- Run/review: `run`, `status`, `workspace`, `review`, `diff`
- Apply safety: `approve`, `apply`, `rollback`
- Verification: `verify`, `scan`, `ledger`, `repair`
- Providers: `providers list`, `providers doctor`, `models list`
- Git lifecycle: `branch`, `commit-message`, `commit`, `lifecycle`, `merge-readiness`
- Handoff: `handoff`, `checklist`, `pr-body`, `approvals`
- Release/provenance: `release`, `release-readiness`, `provenance`, `checksums`, `evidence`
- Remote attestation: `remote-targets`, `attestation`, `transparency`, `registry-metadata`
- Release support: `changelog`, `version`, `release-branch`, `tag`, `ci`, `deployment-readiness`, `release-approval`
- Organization/audit: `org`, `org-policy`, `org-approvals`, `org-report`, `audit-schemas`, `audit-map`, `audit-coverage`, `audit-gaps`, `audit-export`
- Audit handoff: `compliance-bundle`, `reviewer-directory`, `auditor-handoff`
- Evidence lifecycle: `evidence-inventory`, `evidence-lifecycle`, `retention`, `retention-enforce`, `evidence-archive`, `retention-ledger`, `legal-hold`, `evidence-compact`, `evidence-report`, `evidence-export`
- Disposal: `disposal-eligibility`, `disposal-candidates`, `disposal-plan`, `disposal-attestation`, `disposal-approvals`, `disposal-precheck`, `disposal-execute`, `disposal-report`
- Beta QA: `dogfood`, `dogfood-apply-smoke`, `scanner-check`, `security-redteam`, `package-check`, `package-install-check`, `docs-check --strict`, `perf-check`, `beta-check`, `beta-backlog`, `beta-warnings`, `beta-rc`, `beta-trial`
- Diagnostics and inspection: `route`, `cost`, `inspect`, `readiness`, `feedback`, `reject`

Exact-confirmed beta/package safety commands include:

```sh
vibe dogfood run --apply-fixture-patches --confirm "APPLY DOGFOOD FIXTURE PATCHES"
vibe scanner-check --run-safe --confirm "RUN SAFE SCANNER CHECK"
```

Strict docs coverage list:

```sh
vibe audit-export <run-id>
vibe audit-gaps <run-id>
vibe audit-schemas list
vibe auditor-handoff <run-id>
vibe beta-backlog
vibe beta-trial create
vibe beta-warnings
vibe checksums <run-id>
vibe compliance-bundle <run-id>
vibe cost <run-id>
vibe deployment-readiness <run-id>
vibe disposal-approvals <run-id>
vibe disposal-attestation <run-id>
vibe disposal-candidates <run-id>
vibe disposal-eligibility <run-id>
vibe disposal-execute <run-id>
vibe disposal-plan <run-id>
vibe disposal-precheck <run-id>
vibe disposal-report
vibe evidence-compact <run-id>
vibe evidence-export <run-id>
vibe evidence-report
vibe feedback <run-id>
vibe inspect <run-id>
vibe legal-hold <run-id>
vibe org-report <run-id>
vibe perf-check
vibe readiness <run-id>
vibe registry-metadata <run-id>
vibe reject <run-id>
vibe release-approval <run-id>
vibe remote-targets list
vibe retention <run-id>
vibe retention-enforce <run-id>
vibe retention-ledger
vibe reviewer-directory list
vibe route
vibe transparency <run-id>
```

Detailed workflow notes are in `docs/`.

## Development

```sh
pnpm install
pnpm lint
pnpm test
pnpm build
pnpm format
```

## Packaging

```sh
pnpm build
npm pack
npm install -g ./vibecli-0.1.0.tgz
vibe --version
```

The package uses a `files` whitelist and excludes local runtime state, `.env` files, private keys, dogfood reports, beta reports, run artifacts, evidence archives, and `node_modules`.

## Security

See `SECURITY.md`.

Short version: VibeCLI is local-first, exact-confirmed for sensitive actions, and designed to avoid logging raw provider keys or bundling private keys. Dry-run mode is provider-free. Remote submission and GitHub mutation workflows are optional and guarded.

## Limitations

- Beta software; manual validation is required before serious use.
- Local signatures are local integrity evidence, not legal identity proof.
- Audit and compliance bundles do not certify compliance.
- Live model behavior depends on configured providers.
- This repository prep does not publish to npm, create releases, deploy, push tags, or upload artifacts.

## License

MIT. See `LICENSE`.
