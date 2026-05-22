import { agentRoleIds } from "../agents/roles.js";
import type { RunState } from "../orchestrator/state.js";
import type { Theme } from "./theme.js";

export type HeaderInfo = {
  repoPath: string;
  profile: string;
  policy?: string;
  routingStrategy?: string;
  budgetSummary?: string;
  configStatus: string;
  providers: Array<{ name: string; status: "configured" | "missing_env"; message: string }>;
  branch: string | null;
  latestRun?: RunState;
  dogfood?: { latestBetaVerdict: string; latestDogfoodRunId: string | null };
  beta?: {
    latestBetaVerdict: string;
    latestRcReport: string | null;
    blockers: number;
    warnings: number;
    acceptedWarnings: number;
  };
};

function width(value?: number): number {
  return Math.max(40, Math.min(value ?? process.stdout.columns ?? 80, 120));
}

function line(columns?: number): string {
  return "─".repeat(width(columns));
}

export function renderLogo(theme: Theme): string {
  return [theme.cyan("VibeCLI"), theme.gray("Local-first AI software delivery company")].join("\n");
}

export function renderSafetyBanner(theme: Theme, columns?: number): string {
  return [
    line(columns),
    theme.yellow("Agents propose. VibeCLI applies only after approval."),
    line(columns)
  ].join("\n");
}

export function renderHeader(info: HeaderInfo, theme: Theme, columns?: number): string {
  const providers = info.providers
    .map(
      (provider) =>
        `${provider.name}:${provider.status === "configured" ? theme.green("ok") : theme.yellow("warn")}`
    )
    .join(" ");
  return [
    renderLogo(theme),
    "",
    `Repo: ${info.repoPath}`,
    `Profile: ${info.profile}`,
    `Policy: ${info.policy ?? "company-grade"}`,
    `Routing: ${info.routingStrategy ?? "balanced"}`,
    `Budget: ${info.budgetSummary ?? "not configured"}`,
    `Config: ${info.configStatus}`,
    `Providers: ${providers || "none"}`,
    `Branch: ${info.branch ?? "unknown"}`,
    info.latestRun
      ? `Latest run: ${info.latestRun.runId} (${info.latestRun.status})`
      : "Latest run: none",
    info.latestRun
      ? `Latest lifecycle: branch=${info.latestRun.lifecycle?.branch?.current ?? "unknown"} commit=${info.latestRun.lifecycle?.commit?.status ?? "not_started"} pr=${info.latestRun.lifecycle?.pr?.status ?? "not_started"} merge=${info.latestRun.lifecycle?.mergeReadiness?.verdict ?? "not_started"}`
      : "Latest lifecycle: none",
    info.latestRun
      ? `Latest release: channel=${info.latestRun.release?.packet.channel ?? "unknown"} readiness=${info.latestRun.release?.releaseReadiness.verdict ?? "not_started"}`
      : "Latest release: none",
    info.latestRun
      ? `Latest provenance: signature=${info.latestRun.provenance?.signature.status ?? "not_started"} evidence=${info.latestRun.provenance?.evidence.status ?? "not_started"} githubRelease=${info.latestRun.provenance?.githubReleaseDraft.status ?? "not_started"}`
      : "Latest provenance: none",
    info.latestRun
      ? `Latest remote attestation: export=${info.latestRun.remoteAttestation?.export.status ?? "not_started"} transparency=${info.latestRun.remoteAttestation?.transparency.status ?? "not_started"} submission=${info.latestRun.remoteAttestation?.submission.status ?? "not_started"} registry=${info.latestRun.remoteAttestation?.registryMetadata.status ?? "not_started"}`
      : "Latest remote attestation: none",
    info.latestRun
      ? `Latest organization: enabled=${info.latestRun.organization?.enabled ?? false} approvals=${info.latestRun.organization?.approvals.status ?? "not_started"} retention=${info.latestRun.organization?.retention.status ?? "not_started"} audit=${info.latestRun.organization?.audit.status ?? "not_started"}`
      : "Latest organization: none",
    info.latestRun
      ? `Latest audit: schema=${info.latestRun.audit?.schema.activeSchema ?? "none"} coverage=${info.latestRun.audit?.coverage.percentSatisfied ?? "unknown"} export=${info.latestRun.audit?.export.status ?? "not_started"} compliance=${info.latestRun.audit?.complianceBundle.status ?? "not_started"} handoff=${info.latestRun.audit?.auditorHandoff.status ?? "not_started"}`
      : "Latest audit: none",
    info.latestRun
      ? `Latest evidence lifecycle: inventory=${info.latestRun.evidenceLifecycle?.inventory.status ?? "not_started"} archive=${info.latestRun.evidenceLifecycle?.archive.status ?? "not_started"} legalHold=${info.latestRun.evidenceLifecycle?.legalHold.status ?? "not_started"} retentionLedger=${info.latestRun.evidenceLifecycle?.retentionLedger.status ?? "not_started"} compaction=${info.latestRun.evidenceLifecycle?.compaction.status ?? "not_started"}`
      : "Latest evidence lifecycle: none",
    info.latestRun
      ? `Latest disposal: eligibility=${info.latestRun.evidenceDisposal?.eligibility.status ?? "not_started"} plan=${info.latestRun.evidenceDisposal?.plan.status ?? "not_started"} precheck=${info.latestRun.evidenceDisposal?.precheck.status ?? "not_started"} execution=${info.latestRun.evidenceDisposal?.execution.status ?? "not_started"}`
      : "Latest disposal: none",
    info.dogfood
      ? `Latest beta: verdict=${info.dogfood.latestBetaVerdict} dogfood=${info.dogfood.latestDogfoodRunId ?? "none"}`
      : "Latest beta: unknown",
    info.beta
      ? `Latest beta RC: verdict=${info.beta.latestBetaVerdict} blockers=${info.beta.blockers} warnings=${info.beta.warnings} accepted=${info.beta.acceptedWarnings}`
      : "Latest beta RC: unknown",
    renderSafetyBanner(theme, columns)
  ].join("\n");
}

export function renderInputFrame(theme: Theme, columns?: number): string {
  return [
    line(columns),
    `${theme.cyan(">")} Type your request or /help`,
    line(columns),
    theme.gray('? shortcuts · /mode dry-run · /run "build auth flow" · /status · /exit')
  ].join("\n");
}

export function renderAgentStatusBoard(state: RunState | undefined, theme: Theme): string {
  const rows = agentRoleIds.map((agent) => {
    const status = state?.agents[agent]?.status ?? "queued";
    return `${agent.padEnd(18)} ${status}`;
  });
  const gates = agentRoleIds.map((agent) => {
    const status = state?.gates[agent]?.status ?? "not_started";
    return `${agent.padEnd(18)} ${status}`;
  });
  return [theme.bold("Agents"), ...rows, "", theme.bold("Gates"), ...gates].join("\n");
}

export function renderRunSummary(state: RunState, theme: Theme): string {
  return [
    theme.bold(`Run ${state.runId}`),
    `Status: ${state.status}`,
    `Current Agent: ${state.currentAgent ?? "none"}`,
    `Approval: ${state.approval?.status ?? "not_required"}`,
    `Apply: ${state.apply?.status ?? "not_started"}`,
    `Policy: ${state.policy ?? "none"}`,
    `Routing: ${state.routingStrategy ?? "unknown"}`,
    `Budget: ${state.budget?.status ?? "unknown"}`,
    `Ledger: ${state.ledger?.status ?? "unknown"}`,
    `Readiness: ${state.readiness?.verdict ?? "unknown"}`,
    `Verification: ${state.verification?.status ?? "not_started"}`,
    `Scanners: ${state.scanners?.builtinStatus ?? "not_started"}/${state.scanners?.externalStatus ?? "not_started"}`,
    `Repair: ${state.repair?.status ?? "not_started"}`,
    `Lifecycle: branch=${state.lifecycle?.branch?.current ?? "unknown"} commit=${state.lifecycle?.commit?.status ?? "not_started"} pr=${state.lifecycle?.pr?.status ?? "not_started"} merge=${state.lifecycle?.mergeReadiness?.verdict ?? "not_started"}`,
    `Release: packet=${state.release?.packet.status ?? "not_started"} channel=${state.release?.packet.channel ?? "unknown"} changelog=${state.release?.changelog.status ?? "not_started"} version=${state.release?.version.status ?? "not_started"} branch=${state.release?.releaseBranch.status ?? "not_started"} tag=${state.release?.tag.status ?? "not_started"} ci=${state.release?.ci.status ?? "not_started"} deploy=${state.release?.deploymentReadiness.verdict ?? "not_started"} readiness=${state.release?.releaseReadiness.verdict ?? "not_started"}`,
    `Provenance: key=${state.provenance?.key.status ?? "unknown"} statement=${state.provenance?.statement.status ?? "not_started"} signature=${state.provenance?.signature.status ?? "not_started"} checksums=${state.provenance?.checksums.status ?? "not_started"} evidence=${state.provenance?.evidence.status ?? "not_started"} githubRelease=${state.provenance?.githubReleaseDraft.status ?? "not_started"}`,
    `Remote attestation: export=${state.remoteAttestation?.export.status ?? "not_started"} transparency=${state.remoteAttestation?.transparency.status ?? "not_started"} submission=${state.remoteAttestation?.submission.status ?? "not_started"} registry=${state.remoteAttestation?.registryMetadata.status ?? "not_started"}`,
    `Organization: enabled=${state.organization?.enabled ?? false} policyBundle=${state.organization?.policyBundle.status ?? "not_started"} approvals=${state.organization?.approvals.status ?? "not_started"} receiptRefresh=${state.organization?.receiptRefresh.status ?? "not_started"} retention=${state.organization?.retention.status ?? "not_started"} evidenceExport=${state.organization?.evidenceExport.status ?? "not_started"} audit=${state.organization?.audit.status ?? "not_started"} report=${state.organization?.report.status ?? "not_started"}`,
    `Audit: schema=${state.audit?.schema.activeSchema ?? "none"} map=${state.audit?.map.status ?? "not_started"} coverage=${state.audit?.coverage.status ?? "not_started"} gaps=${state.audit?.gaps.status ?? "not_started"} export=${state.audit?.export.status ?? "not_started"} compliance=${state.audit?.complianceBundle.status ?? "not_started"} reviewerDirectory=${state.audit?.reviewerDirectory.status ?? "not_started"} auditorHandoff=${state.audit?.auditorHandoff.status ?? "not_started"}`,
    `Evidence lifecycle: inventory=${state.evidenceLifecycle?.inventory.status ?? "not_started"} archive=${state.evidenceLifecycle?.archive.status ?? "not_started"} retentionLedger=${state.evidenceLifecycle?.retentionLedger.status ?? "not_started"} legalHold=${state.evidenceLifecycle?.legalHold.status ?? "not_started"} compaction=${state.evidenceLifecycle?.compaction.status ?? "not_started"} report=${state.evidenceLifecycle?.report.status ?? "not_started"}`,
    `Evidence disposal: eligibility=${state.evidenceDisposal?.eligibility.status ?? "not_started"} candidates=${state.evidenceDisposal?.candidates.status ?? "not_started"} plan=${state.evidenceDisposal?.plan.status ?? "not_started"} attestation=${state.evidenceDisposal?.attestation.status ?? "not_started"} approvals=${state.evidenceDisposal?.approvals.status ?? "not_started"} precheck=${state.evidenceDisposal?.precheck.status ?? "not_started"} execution=${state.evidenceDisposal?.execution.status ?? "not_started"}`,
    renderAgentStatusBoard(state, theme)
  ].join("\n");
}

export function renderHelp(): string {
  return [
    "Console commands:",
    "/help",
    "/init",
    "/exit, /quit",
    "/status [run-id]",
    "/watch <run-id>",
    "/run [--live] <prompt>",
    "/mode [dry-run|live]",
    "/stream [on|off]",
    "/policies",
    "/policy <name>",
    "/route [--agent <agent>]",
    "/workspace <run-id>",
    "/review <run-id> [--diff]",
    "/diff <run-id>",
    "/approve <run-id>",
    '/apply <run-id> --confirm "APPLY <run-id>"',
    '/rollback <run-id> --confirm "ROLLBACK <run-id>"',
    "/providers",
    "/providers doctor",
    "/models",
    '/verify <run-id> --confirm "VERIFY <run-id>"',
    '/scan <run-id> [--external --confirm "SCAN <run-id>"]',
    "/repair <run-id> --dry-run",
    "/cost <run-id>",
    "/ledger <run-id> [--verify]",
    "/handoff <run-id>",
    "/pr-body <run-id>",
    "/checklist <run-id>",
    "/exceptions <run-id>",
    "/approvals <run-id> [--verify]",
    "/github doctor",
    "/github pr <run-id>",
    '/github pr <run-id> --update --pr <pr> --confirm "UPDATE PR <run-id>"',
    '/github pr <run-id> --comment --pr <pr> --confirm "COMMENT PR <run-id>"',
    '/github pr <run-id> --sync --pr <pr> --confirm "SYNC PR <run-id>"',
    "/readiness <run-id>",
    "/branch <run-id>",
    "/commit-message <run-id>",
    "/commit-msg <run-id>",
    '/commit <run-id> --create --confirm "COMMIT <run-id>"',
    "/lifecycle <run-id>",
    "/feedback <run-id>",
    '/feedback <run-id> --github --pr <pr> --confirm "INGEST FEEDBACK <run-id>"',
    "/merge-readiness <run-id>",
    "/merge-check <run-id>",
    "/release <run-id> [--channel beta|staging|production] [--verify]",
    '/changelog <run-id> [--write --confirm "WRITE CHANGELOG <run-id>"]',
    '/version <run-id> [--bump patch|minor|major|prerelease] [--apply --confirm "APPLY VERSION <run-id>"]',
    '/release-branch <run-id> [--create --confirm "CREATE RELEASE BRANCH <run-id>"]',
    '/tag <run-id> [--create --confirm "CREATE TAG <run-id>"]',
    '/ci <run-id> [--github --confirm "INGEST CI <run-id>"] [--file <path>]',
    "/deployment-readiness <run-id>",
    "/deploy-readiness <run-id>",
    '/release-approval <run-id> [--decision approved --reviewer "Name" --note "Note" --confirm "ADD RELEASE APPROVAL <run-id>"]',
    "/release-readiness <run-id>",
    "/provenance <run-id>",
    '/provenance <run-id> --sign --confirm "SIGN PROVENANCE <run-id>"',
    "/provenance <run-id> --verify",
    "/provenance key status",
    '/provenance key init --confirm "CREATE PROVENANCE KEY"',
    "/provenance key export-public",
    "/checksums <run-id> [--verify]",
    '/evidence <run-id> [--sign --confirm "SIGN EVIDENCE <run-id>"] [--verify]',
    "/github release <run-id>",
    '/github release <run-id> --create-draft --confirm "CREATE RELEASE DRAFT <run-id>"',
    "/remote-targets list",
    "/remote-targets doctor",
    '/remote-targets doctor --ping --confirm "PING REMOTE TARGETS"',
    '/remote-targets add generic-http --name <name> --url <url> --token-env <ENV> --confirm "ADD REMOTE TARGET <name>"',
    '/remote-targets disable <name> --confirm "DISABLE REMOTE TARGET <name>"',
    '/remote-targets remove <name> --confirm "REMOVE REMOTE TARGET <name>"',
    "/attestation export <run-id>",
    "/attestation submit <run-id> --target <name> --dry-run",
    '/attestation submit <run-id> --target <name> --confirm "SUBMIT ATTESTATION <run-id> TO <name>"',
    "/attestation receipt <run-id>",
    "/transparency <run-id>",
    '/transparency append <run-id> --confirm "APPEND TRANSPARENCY <run-id>"',
    "/transparency verify [run-id]",
    "/registry-metadata <run-id>",
    "/org status",
    '/org init --confirm "INIT ORGANIZATION"',
    "/org reviewers",
    "/org audit",
    "/org audit --verify",
    "/org key status",
    '/org key init --confirm "CREATE ORG KEY"',
    "/org key export-public",
    "/org-policy bundle",
    '/org-policy bundle --sign --confirm "SIGN ORG POLICY"',
    "/org-policy verify",
    "/org-policy show",
    "/org-approvals <run-id>",
    '/org-approvals <run-id> --add --reviewer <reviewer-id> --role <role> --decision approved --note "note" --confirm "ADD ORG APPROVAL <run-id>"',
    "/org-approvals <run-id> --quorum",
    "/org-approvals <run-id> --verify",
    "/receipt-refresh <run-id>",
    "/receipt-refresh <run-id> --dry-run",
    '/receipt-refresh <run-id> --verify-remote --confirm "VERIFY REMOTE RECEIPT <run-id>"',
    "/retention <run-id>",
    "/retention <run-id> --policy production",
    '/retention <run-id> --mark --confirm "MARK RETENTION <run-id>"',
    "/retention <run-id> --purge-preview",
    "/evidence-export <run-id>",
    "/evidence-export <run-id> --mode audit",
    "/evidence-export <run-id> --verify",
    "/org-report <run-id>",
    "/audit-schemas list",
    "/audit-schemas show <name>",
    "/audit-schemas validate",
    "/audit-schemas install-defaults",
    "/audit-map <run-id>",
    "/audit-map <run-id> --schema <name>",
    "/audit-coverage <run-id>",
    "/audit-gaps <run-id>",
    "/audit-export <run-id>",
    '/audit-export <run-id> --sign --confirm "SIGN AUDIT EXPORT <run-id>"',
    "/audit-export <run-id> --verify",
    "/compliance-bundle <run-id>",
    '/compliance-bundle <run-id> --sign --confirm "SIGN COMPLIANCE BUNDLE <run-id>"',
    "/compliance-bundle <run-id> --verify",
    "/reviewer-directory import --file <path>",
    "/reviewer-directory list",
    "/reviewer-directory validate --file <path>",
    "/auditor-handoff <run-id>",
    "/auditor-handoff <run-id> --verify",
    "/evidence-inventory <run-id>",
    "/evidence-inventory --all",
    "/evidence-lifecycle <run-id>",
    "/evidence-lifecycle --all",
    "/retention-enforce <run-id>",
    "/evidence-archive <run-id>",
    '/evidence-archive <run-id> --create --confirm "ARCHIVE EVIDENCE <run-id>"',
    "/evidence-archive <run-id> --verify",
    "/retention-ledger [run-id]",
    "/retention-ledger --verify",
    '/retention-ledger <run-id> --record --event <event> --summary "summary" --confirm "RECORD RETENTION EVENT <run-id>"',
    "/legal-hold <run-id>",
    '/legal-hold <run-id> --enable --reason "reason" --by "name" --confirm "ENABLE LEGAL HOLD <run-id>"',
    '/legal-hold <run-id> --release --reason "reason" --by "name" --confirm "RELEASE LEGAL HOLD <run-id>"',
    "/evidence-compact <run-id>",
    '/evidence-compact <run-id> --bundle --confirm "CREATE COMPACT EVIDENCE <run-id>"',
    "/evidence-compact <run-id> --verify",
    "/evidence-report",
    "/evidence-report --deep",
    "/disposal-eligibility <run-id>",
    "/disposal-eligibility --all",
    "/disposal-candidates <run-id>",
    "/disposal-plan <run-id>",
    "/disposal-attestation <run-id>",
    '/disposal-attestation <run-id> --sign --confirm "SIGN DISPOSAL ATTESTATION <run-id>"',
    "/disposal-approvals <run-id>",
    '/disposal-approvals <run-id> --add --reviewer <reviewer-id> --role <role> --decision approved --note "note" --confirm "ADD DISPOSAL APPROVAL <run-id>"',
    "/disposal-approvals <run-id> --quorum",
    "/disposal-approvals <run-id> --verify",
    "/disposal-precheck <run-id>",
    "/disposal-execute <run-id>",
    "/disposal-execute <run-id> --dry-run",
    '/disposal-execute <run-id> --confirm "DELETE EVIDENCE <run-id>"',
    "/disposal-report",
    "/disposal-report --deep",
    "/dogfood plan",
    "/dogfood fixtures",
    '/dogfood fixtures --clean --confirm "CLEAN DOGFOOD FIXTURES"',
    "/dogfood run",
    "/dogfood report",
    "/live-smoke",
    '/live-smoke --provider <provider> --model <model> --confirm "RUN LIVE SMOKE"',
    "/scanner-check",
    '/scanner-check --run-safe --confirm "RUN SAFE SCANNER CHECK"',
    "/security-redteam",
    "/package-check",
    "/docs-check",
    "/perf-check",
    "/beta-check",
    "/beta-check --strict",
    "/beta-backlog",
    "/beta-warnings",
    '/beta-warnings accept <warning-id> --by "Name" --reason "Reason" --confirm "ACCEPT BETA WARNING <warning-id>"',
    "/dogfood-apply-smoke",
    "/package-install-check",
    "/docs-check --strict",
    "/scanner-check --strict",
    "/scanner-check --install-guide",
    '/live-smoke --rc --confirm "RUN LIVE RC SMOKE"',
    "/beta-rc",
    "/beta-rc --strict",
    "/beta-trial create",
    "/beta-trial list",
    "/doctor",
    "/clear"
  ].join("\n");
}

export function renderReviewSummary(value: string): string {
  return value;
}

export function renderCommandResult(value: string, theme: Theme): string {
  return theme.green(value);
}

export function renderError(error: unknown, theme: Theme): string {
  return theme.red(error instanceof Error ? error.message : String(error));
}
