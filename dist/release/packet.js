import { execFile } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";
import { loadConfig } from "../config/config.js";
import { verifyLedger } from "../ledger/verify.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { readApprovalNotes } from "../approvals/notes.js";
import { readPolicyExceptions } from "../handoff/policy-exceptions.js";
import { RunStore } from "../orchestrator/run-store.js";
import { pathExists, readJson } from "../utils/fs.js";
import { resolveReleaseChannel } from "./config.js";
import { writeReleaseManifest } from "./integrity.js";
import { redactReleaseJson, redactReleaseText } from "./redaction.js";
import { updateReleaseState } from "./state.js";
const execFileAsync = promisify(execFile);
async function git(args, cwd) {
    return execFileAsync("git", args, { cwd })
        .then(({ stdout }) => stdout.trim() || null)
        .catch(() => null);
}
async function optionalJson(path) {
    return pathExists(path) ? readJson(path).catch(() => undefined) : undefined;
}
function verificationStatus(value) {
    if (value === "passed" || value === "failed" || value === "skipped" || value === "not_started")
        return value;
    return value ? "unknown" : "not_started";
}
function scannerStatus(state) {
    const scanners = state.scanners;
    if (!scanners || scanners.builtinStatus === "not_started")
        return "not_started";
    if (scanners.criticalFindings > 0 ||
        scanners.highFindings > 0 ||
        scanners.builtinStatus === "failed")
        return "failed";
    if (scanners.builtinStatus === "warning")
        return "warning";
    if (scanners.builtinStatus === "skipped")
        return "skipped";
    return "passed";
}
export async function buildReleaseSummary(cwd, runId, options = {}) {
    const config = await loadConfig(cwd);
    const channel = resolveReleaseChannel(config.release, options.channel);
    const store = new RunStore(cwd);
    const state = await store.readState(runId);
    const runPath = store.runPath(runId);
    const version = await optionalJson(join(runPath, "release", "version-plan.json"));
    const ci = await optionalJson(join(runPath, "release", "ci-status.json"));
    const ledger = await verifyLedger(cwd, runId).catch(() => undefined);
    const exceptions = await readPolicyExceptions(cwd, runId).catch(() => ({
        runId,
        createdAt: new Date().toISOString(),
        exceptions: []
    }));
    const risks = [];
    const blockingReasons = [];
    const warnings = [];
    if (!ledger)
        blockingReasons.push("Ledger manifest is missing.");
    else if (!ledger.ok)
        blockingReasons.push("Ledger verification failed.");
    if (state.verification?.status !== "passed")
        warnings.push("Tests/build/lint were not run or did not pass.");
    if (scannerStatus(state) === "not_started")
        warnings.push("Scanner status was not run.");
    if (!ci)
        warnings.push("CI status was not ingested.");
    if (!pathExists(join(runPath, "release", "DEPLOYMENT_READINESS.md"))) {
        warnings.push("Deployment readiness was not checked.");
    }
    if (state.apply.status === "applied" &&
        !pathExists(join(runPath, "rollback", "pre-apply-metadata.json"))) {
        blockingReasons.push("Rollback plan is missing after applied source changes.");
    }
    const unresolvedCritical = exceptions.exceptions.filter((item) => (item.severity === "critical" || item.severity === "high") && item.status !== "approved");
    if (unresolvedCritical.length)
        blockingReasons.push("Unresolved high/critical policy exceptions exist.");
    if (state.scanners && (state.scanners.criticalFindings > 0 || state.scanners.highFindings > 0)) {
        blockingReasons.push("Scanner high/critical findings exist.");
    }
    if (channel === "production") {
        if (state.verification?.status !== "passed")
            blockingReasons.push("Production requires passed verification.");
        if (!ci || ci.status !== "passed")
            blockingReasons.push("Production requires passed CI status.");
    }
    if (options.strict) {
        if (state.verification?.status !== "passed")
            blockingReasons.push("Strict release requires passed verification.");
        if (scannerStatus(state) === "failed")
            blockingReasons.push("Strict release blocks scanner failures.");
    }
    const verdict = blockingReasons.length > 0
        ? "blocked"
        : warnings.length > 0
            ? "ready_with_warnings"
            : `ready_for_${channel}`;
    const summary = {
        runId,
        createdAt: new Date().toISOString(),
        channel,
        policy: state.policy ?? null,
        profile: null,
        version: {
            current: version?.currentVersion ?? null,
            planned: version?.plannedVersion ?? null,
            bump: version?.bump ?? null
        },
        git: {
            branch: await git(["branch", "--show-current"], cwd),
            commitSha: await git(["rev-parse", "HEAD"], cwd),
            releaseBranch: state.release?.releaseBranch.branch ?? null,
            tag: state.release?.tag.tag ?? null
        },
        gates: {
            ledger: ledger ? (ledger.ok ? "pass" : "fail") : "missing",
            verification: verificationStatus(state.verification?.status),
            scanners: scannerStatus(state),
            readiness: state.readiness?.verdict ?? null,
            mergeReadiness: state.lifecycle?.mergeReadiness.verdict ?? null,
            ci: ci?.status ?? "not_ingested"
        },
        risks,
        releaseVerdict: verdict,
        blockingReasons: [...new Set(blockingReasons)],
        warnings: [...new Set(warnings)],
        nextActions: [
            `vibe changelog ${runId}`,
            `vibe version ${runId}`,
            `vibe deployment-readiness ${runId} --channel ${channel}`,
            `vibe release-readiness ${runId} --channel ${channel}`
        ]
    };
    return redactReleaseJson(summary);
}
export async function generateReleasePacket(cwd, runId, options = {}) {
    const store = new RunStore(cwd);
    const state = await store.readState(runId);
    const summary = await buildReleaseSummary(cwd, runId, options);
    if (options.strict && summary.releaseVerdict === "blocked") {
        await updateReleaseState(store, runId, (release) => {
            release.packet = { status: "failed", channel: summary.channel };
        });
        throw new Error(`Strict release packet is blocked: ${summary.blockingReasons.join("; ")}`);
    }
    const packet = renderReleasePacket(summary, state.prompt, state.provenance, state.remoteAttestation, state.organization, state.audit, state.evidenceLifecycle, state.evidenceDisposal);
    await store.writeTextArtifact(runId, "release/RELEASE_PACKET.md", packet);
    await store.writeArtifact(runId, "release/RELEASE_SUMMARY.json", summary);
    await store.writeTextArtifact(runId, "release/RELEASE_CHECKLIST.md", renderReleaseChecklist(summary));
    await store.writeTextArtifact(runId, "release/RELEASE_NOTES.md", renderReleaseNotes(summary));
    if (!pathExists(join(store.runPath(runId), "release", "DEPLOYMENT_READINESS.md"))) {
        await store.writeTextArtifact(runId, "release/DEPLOYMENT_READINESS.md", "Deployment readiness was not checked.\nNo deploy command was executed.\n");
    }
    if (!pathExists(join(store.runPath(runId), "release", "CI_STATUS.md"))) {
        await store.writeTextArtifact(runId, "release/CI_STATUS.md", "CI status was not ingested.\n");
    }
    await readApprovalNotes(cwd, runId).catch(() => []);
    await writeReleaseManifest(cwd, runId);
    await updateReleaseState(store, runId, (release) => {
        release.packet = {
            status: "generated",
            channel: summary.channel,
            generatedAt: summary.createdAt
        };
    });
    await writeLedgerManifest(cwd, runId);
    return summary;
}
export function renderReleasePacket(summary, prompt, provenance, remoteAttestation, organization, audit, evidenceLifecycle, evidenceDisposal) {
    return redactReleaseText(`# Release Packet

Run id: ${summary.runId}

Prompt: ${prompt}

Channel: ${summary.channel}

Policy: ${summary.policy ?? "none"}

Release verdict: ${summary.releaseVerdict}

Source modification status: ${summary.gates.verification}

Branch: ${summary.git.branch ?? "unknown"}

Commit: ${summary.git.commitSha ?? "unknown"}

CI: ${summary.gates.ci}

Deployment readiness: ${summary.gates.readiness ?? "not_checked"}

Provenance: statement=${provenance?.statement?.status ?? "not_started"} signature=${provenance?.signature?.status ?? "not_started"} evidence=${provenance?.evidence?.status ?? "not_started"} githubRelease=${provenance?.githubReleaseDraft?.status ?? "not_started"}

Remote attestation: export=${remoteAttestation?.export?.status ?? "not_started"} transparency=${remoteAttestation?.transparency?.status ?? "not_started"} submission=${remoteAttestation?.submission?.status ?? "not_started"} registry=${remoteAttestation?.registryMetadata?.status ?? "not_started"}

Organization: enabled=${organization?.enabled ?? false} policyBundle=${organization?.policyBundle?.status ?? "not_started"} approvals=${organization?.approvals?.status ?? "not_started"} approved=${organization?.approvals?.approvedCount ?? 0} missingRoles=${organization?.approvals?.missingRoles?.join(",") ?? "none"} receiptRefresh=${organization?.receiptRefresh?.status ?? "not_started"} retention=${organization?.retention?.status ?? "not_started"} evidenceExport=${organization?.evidenceExport?.status ?? "not_started"} audit=${organization?.audit?.status ?? "not_started"}

Audit interoperability: schema=${audit?.schema?.activeSchema ?? "none"} coverage=${audit?.coverage?.status ?? "not_started"} percent=${audit?.coverage?.percentSatisfied ?? "unknown"} criticalMissing=${audit?.coverage?.criticalMissing ?? 0} highMissing=${audit?.coverage?.highMissing ?? 0} export=${audit?.export?.status ?? "not_started"} compliance=${audit?.complianceBundle?.status ?? "not_started"} auditorHandoff=${audit?.auditorHandoff?.status ?? "not_started"}

Evidence lifecycle: inventory=${evidenceLifecycle?.inventory?.status ?? "not_started"} files=${evidenceLifecycle?.inventory?.totalFiles ?? "unknown"} archive=${evidenceLifecycle?.archive?.status ?? "not_started"} archivePath=${evidenceLifecycle?.archive?.archivePath ?? "none"} retentionLedger=${evidenceLifecycle?.retentionLedger?.status ?? "not_started"} legalHold=${evidenceLifecycle?.legalHold?.status ?? "not_started"} compaction=${evidenceLifecycle?.compaction?.status ?? "not_started"}

Evidence disposal: eligibility=${evidenceDisposal?.eligibility?.status ?? "not_started"} plan=${evidenceDisposal?.plan?.status ?? "not_started"} precheck=${evidenceDisposal?.precheck?.status ?? "not_started"} execution=${evidenceDisposal?.execution?.status ?? "not_started"}

Version plan: ${summary.version.current ?? "unknown"} -> ${summary.version.planned ?? "unknown"}

Changelog summary: generated separately with vibe changelog ${summary.runId}.

Rollback plan: ${summary.blockingReasons.includes("Rollback plan is missing after applied source changes.") ? "missing" : "available or not required"}

Known risks:
${summary.risks.map((risk) => `- ${risk.severity}: ${risk.message}`).join("\n") || "- none"}

Blocking reasons:
${summary.blockingReasons.map((reason) => `- ${reason}`).join("\n") || "- none"}

Warnings:
${summary.warnings.map((warning) => `- ${warning}`).join("\n") || "- none"}

Exact next safe commands:
${summary.nextActions.map((action) => `- ${action}`).join("\n")}

No deployment command was executed. No package was published. No branch or tag was pushed. No remote release was created.
`);
}
function renderReleaseChecklist(summary) {
    return `# Release Checklist

- Ledger: ${summary.gates.ledger}
- Verification: ${summary.gates.verification}
- Scanners: ${summary.gates.scanners}
- CI: ${summary.gates.ci}
- Deployment readiness reviewed
- Changelog reviewed
- Version plan reviewed
- Release approval recorded when required
`;
}
function renderReleaseNotes(summary) {
    return `Release ${summary.version.planned ?? summary.runId}

Channel: ${summary.channel}

Verdict: ${summary.releaseVerdict}

No deployment, publish, merge, branch push, tag push, or remote release was performed by VibeCLI.
`;
}
//# sourceMappingURL=packet.js.map