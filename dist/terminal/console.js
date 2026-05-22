import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { loadConfig } from "../config/config.js";
import { createProviderRegistry } from "../providers/registry.js";
import { executePhaseOneWorkflow, executePhaseTwoLiveWorkflow } from "../orchestrator/workflow.js";
import { RunStore } from "../orchestrator/run-store.js";
import { approveRun } from "../orchestrator/approval.js";
import { applyRun } from "../orchestrator/apply.js";
import { estimateRunCost } from "../cost/estimate.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { verifyLedger } from "../ledger/verify.js";
import { readApprovalNotes, verifyApprovalNotes } from "../approvals/notes.js";
import { createHandoffBundle, verifyHandoffBundle } from "../handoff/bundle.js";
import { generatePrDescription } from "../handoff/pr-description.js";
import { buildHandoffSummary } from "../handoff/bundle.js";
import { generateReviewerChecklist } from "../handoff/reviewer-checklist.js";
import { readPolicyExceptions } from "../handoff/policy-exceptions.js";
import { evaluateReadiness } from "../handoff/readiness.js";
import { githubDoctor } from "../github/gh.js";
import { githubPr } from "../github/pr.js";
import { updateGithubPr } from "../github/pr-update.js";
import { branchRun } from "../git-lifecycle/branch.js";
import { generateCommitMessage } from "../git-lifecycle/commit-message.js";
import { commitRun } from "../git-lifecycle/commit.js";
import { buildLifecycle } from "../git-lifecycle/lifecycle.js";
import { evaluateMergeReadiness } from "../git-lifecycle/merge-readiness.js";
import { generateChangelogEntry, writeChangelog } from "../release/changelog.js";
import { ingestCiFile, ingestGithubCi, showOrCreateLocalCiStatus } from "../release/ci.js";
import { evaluateDeploymentReadiness } from "../release/deployment-readiness.js";
import { generateReleasePacket } from "../release/packet.js";
import { addReleaseApproval } from "../release/approval.js";
import { releaseBranchRun } from "../release/release-branch.js";
import { evaluateReleaseReadiness } from "../release/release-readiness.js";
import { tagRun } from "../release/tag.js";
import { applyVersionPlan } from "../release/version-apply.js";
import { planVersion } from "../release/version.js";
import { verifyReleaseIntegrity } from "../release/integrity.js";
import { githubReleaseDraft } from "../github/release-draft.js";
import { createChecksums, verifyChecksums } from "../provenance/checksums.js";
import { createEvidenceBundle, verifyEvidenceBundle } from "../provenance/evidence-bundle.js";
import { exportPublicKey, initProvenanceKey, keyStatus } from "../provenance/keyring.js";
import { signProvenance } from "../provenance/envelope.js";
import { generateProvenanceStatement } from "../provenance/statement.js";
import { verifyProvenance } from "../provenance/verify.js";
import { createAttestationExport } from "../remote-attestation/export-pack.js";
import { readRemoteSubmissionReceipt } from "../remote-attestation/receipt.js";
import { refreshReceipt } from "../remote-attestation/receipt-refresh.js";
import { generateRegistryMetadata } from "../remote-attestation/registry-metadata.js";
import { submitAttestation } from "../remote-attestation/submit.js";
import { addRemoteTarget, disableRemoteTarget, doctorRemoteTargets, listRemoteTargets, removeRemoteTarget } from "../remote-attestation/targets.js";
import { appendTransparencyEntry, generateTransparencyEntry, verifyTransparencyLog } from "../remote-attestation/transparency.js";
import { ingestGithubFeedback } from "../reviewer-feedback/github.js";
import { ingestLocalFeedback } from "../reviewer-feedback/local.js";
import { readJson } from "../utils/fs.js";
import { addOrgApproval, getApprovalMatrix, verifyApprovalMatrix } from "../org/approval-matrix.js";
import { createEvidenceExport, verifyEvidenceExport } from "../org/evidence-export-policy.js";
import { exportOrgPublicKey, initOrgKey, orgKeyStatus } from "../org/keyring.js";
import { createOrgAuditReport } from "../org/audit-report.js";
import { createOrgPolicyBundle, showOrgPolicyBundle, verifyOrgPolicyBundle } from "../org/policy-bundle.js";
import { createRetentionPlan } from "../org/retention.js";
import { initOrganization, listOrgReviewers, orgAuditSummary, orgStatus } from "../org/status.js";
import { generateAuditCoverage } from "../audit/coverage.js";
import { createAuditExport, verifyAuditExport } from "../audit/export.js";
import { generateAuditEvidenceMap } from "../audit/evidence-mapper.js";
import { generateAuditGaps } from "../audit/gaps.js";
import { createComplianceBundle, verifyComplianceBundle } from "../audit/compliance-bundle.js";
import { applyReviewerImport, previewReviewerImport } from "../audit/reviewer-import.js";
import { readReviewerDirectoryFile } from "../audit/reviewer-directory.js";
import { auditSchemaSummary } from "../audit/schema.js";
import { installDefaultAuditSchemas, listAuditSchemas, loadAuditSchema, validateAuditSchemas } from "../audit/schema-loader.js";
import { createAuditorHandoff, verifyAuditorHandoff } from "../audit/auditor-handoff.js";
import { createEvidenceReport } from "../evidence-lifecycle/cross-run-report.js";
import { createDisposalReport } from "../evidence-disposal/cross-run.js";
import { buildDisposalCandidates } from "../evidence-disposal/candidates.js";
import { evaluateDisposalEligibility } from "../evidence-disposal/expiry.js";
import { createDisposalPlan } from "../evidence-disposal/plan.js";
import { createDisposalAttestation } from "../evidence-disposal/attestation.js";
import { addDisposalApproval, getDisposalApprovals, verifyDisposalApprovals } from "../evidence-disposal/approval.js";
import { runDisposalPrecheck } from "../evidence-disposal/predelete.js";
import { dryRunDisposal, executeDisposal } from "../evidence-disposal/delete.js";
import { createBetaBacklog } from "../dogfood/backlog.js";
import { runBetaCheck } from "../dogfood/beta-readiness.js";
import { readDogfoodState } from "../dogfood/config.js";
import { runDocsCheck } from "../dogfood/docs-coverage.js";
import { cleanDogfoodFixtures, createDogfoodFixtures } from "../dogfood/fixture-writer.js";
import { previewLiveSmoke, runLiveSmoke } from "../dogfood/live-smoke.js";
import { runPackageCheck } from "../dogfood/package-check.js";
import { runPerfCheck } from "../dogfood/performance.js";
import { latestDogfoodReport } from "../dogfood/report.js";
import { createDogfoodPlan, runDogfood } from "../dogfood/runner.js";
import { scannerReadiness } from "../dogfood/scanner-readiness.js";
import { runSecurityRedteam } from "../dogfood/redteam.js";
import { readBetaState } from "../beta/config.js";
import { acceptBetaWarning, collectBetaWarnings } from "../beta/warnings.js";
import { runDogfoodApplySmoke } from "../beta/dogfood-apply-smoke.js";
import { runPackageInstallCheck } from "../beta/package-install.js";
import { createBetaRcReport } from "../beta/rc-report.js";
import { createBetaTrialPack, listBetaTrials, showBetaTrial } from "../beta/trial-pack.js";
import { createEvidenceArchive, previewEvidenceArchive } from "../evidence-lifecycle/archive.js";
import { verifyEvidenceArchive } from "../evidence-lifecycle/archive-verify.js";
import { createCompactEvidenceBundle, createCompactionReport, verifyCompactEvidenceBundle } from "../evidence-lifecycle/compaction.js";
import { createEvidenceLifecycleIndex, createEvidenceLifecycleReport } from "../evidence-lifecycle/lifecycle-report.js";
import { generateEvidenceInventory, summarizeAllInventories } from "../evidence-lifecycle/inventory.js";
import { enableLegalHold, legalHoldStatus, releaseLegalHold } from "../evidence-lifecycle/legal-hold.js";
import { previewRetentionEnforcement } from "../evidence-lifecycle/retention-enforcement.js";
import { recordManualRetentionEvent, retentionLedgerSummary } from "../evidence-lifecycle/retention-ledger.js";
import { verifyRetentionLedger } from "../evidence-lifecycle/retention-ledger-verify.js";
import { listPolicyProfileNames, loadPolicyProfile } from "../policies/profile-loader.js";
import { diagnoseProviders } from "../routing/diagnostics.js";
import { routeAgent, buildRoutingPlan } from "../routing/router.js";
import { routingStrategyForProfile } from "../routing/policy.js";
import { repairRun } from "../orchestrator/repair.js";
import { rollbackRun } from "../orchestrator/rollback.js";
import { scanRunBuiltin, scanRunExternal } from "../orchestrator/scan.js";
import { verifyRun } from "../orchestrator/verify.js";
import { formatReview, readPatchDiffs, reviewRun } from "../orchestrator/diff.js";
import { buildReviewWorkspace } from "../orchestrator/workspace.js";
import { hasGit } from "../utils/git.js";
import { pathExists } from "../utils/fs.js";
import { createTheme } from "./theme.js";
import { renderCommandResult, renderError, renderHeader, renderHelp, renderInputFrame, renderReviewSummary, renderRunSummary } from "./render.js";
import { createConsoleReadline } from "./input.js";
import { parseConsoleCommand } from "./shortcuts.js";
async function branch(cwd) {
    if (!(await hasGit()))
        return null;
    const { execFile } = await import("node:child_process");
    const { promisify } = await import("node:util");
    try {
        const { stdout } = await promisify(execFile)("git", ["branch", "--show-current"], { cwd });
        return stdout.trim() || null;
    }
    catch {
        return null;
    }
}
async function history(cwd, entry) {
    const path = join(cwd, ".vibecli", "console-history.jsonl");
    const existing = pathExists(path)
        ? (await readFile(path, "utf8")).trim().split("\n").filter(Boolean)
        : [];
    const next = [...existing.slice(-99), JSON.stringify(entry)];
    await writeFile(path, `${next.join("\n")}\n`, "utf8");
}
async function startupHeader(context) {
    const config = await loadConfig(context.cwd);
    const latestRunId = await new RunStore(context.cwd).latestRunId();
    const latestRun = latestRunId
        ? await new RunStore(context.cwd).readState(latestRunId)
        : undefined;
    const providers = Object.entries(config.providers).map(([name, provider]) => ({
        name,
        status: "api_key_env" in provider && !process.env[provider.api_key_env]
            ? "missing_env"
            : "configured",
        message: "api_key_env" in provider ? provider.api_key_env : "external"
    }));
    return renderHeader({
        repoPath: context.cwd,
        profile: config.default_profile,
        policy: context.policy ?? "company-grade",
        routingStrategy: routingStrategyForProfile(config, config.default_profile),
        budgetSummary: `max $${config.budget.max_run_cost_usd}`,
        configStatus: "loaded",
        providers,
        branch: await branch(context.cwd),
        latestRun,
        dogfood: await readDogfoodState(context.cwd),
        beta: await readBetaState(context.cwd)
    }, context.theme);
}
async function runPrompt(context, prompt, live, stream = false) {
    const config = await loadConfig(context.cwd);
    if (live) {
        console.log(context.theme.yellow("Live mode may spend provider credits."));
        console.log(buildRoutingPlan({
            config,
            profile: config.default_profile,
            runId: "console-preview",
            agents: ["intake", "architect", "implementation", "test", "security", "release_manager"],
            policy: context.policy ?? "company-grade"
        })
            .agents.map((agent) => `${agent.agent}: ${agent.selectedProvider}/${agent.selectedModel}`)
            .join("\n"));
    }
    else {
        console.log("Dry-run mode: no LLM/provider spend occurs.");
    }
    const state = live
        ? await executePhaseTwoLiveWorkflow({
            cwd: context.cwd,
            prompt,
            profile: config.default_profile,
            config,
            stream,
            policy: context.policy ?? "company-grade"
        })
        : await executePhaseOneWorkflow({
            cwd: context.cwd,
            prompt,
            profile: config.default_profile,
            config,
            policy: context.policy
        });
    await history(context.cwd, {
        createdAt: new Date().toISOString(),
        command: prompt,
        runId: state.runId,
        mode: live ? "live" : "dry-run",
        status: "success"
    });
    return `Run ${state.runId} completed with status ${state.status}`;
}
async function statusText(context, runId) {
    const store = new RunStore(context.cwd);
    const id = runId ?? (await store.latestRunId());
    if (!id)
        return "No runs found.";
    return renderRunSummary(await store.readState(id), context.theme);
}
export async function watchRunSnapshots(context, runId, options = {}) {
    const store = new RunStore(context.cwd);
    const id = runId ?? (await store.latestRunId());
    if (!id)
        return ["No runs found."];
    const snapshots = [];
    const iterations = options.iterations ?? Number.POSITIVE_INFINITY;
    const intervalMs = options.intervalMs ?? 2000;
    let stopped = false;
    const stop = () => {
        stopped = true;
    };
    process.once("SIGINT", stop);
    while (!stopped && snapshots.length < iterations) {
        snapshots.push(renderRunSummary(await store.readState(id), context.theme));
        if (snapshots.length < iterations) {
            await new Promise((resolve) => setTimeout(resolve, intervalMs));
        }
    }
    process.off("SIGINT", stop);
    return snapshots;
}
async function watchRun(context, runId) {
    console.log("Watching run state. Press Ctrl+C to stop.");
    const snapshots = await watchRunSnapshots(context, runId);
    return [...snapshots, "Watch stopped."].join("\n");
}
export async function executeConsoleCommand(command, context) {
    switch (command.type) {
        case "help":
            return renderHelp();
        case "exit":
            return "__EXIT__";
        case "status":
            return command.watch ? watchRun(context, command.runId) : statusText(context, command.runId);
        case "run":
            return runPrompt(context, command.prompt, command.live, command.stream);
        case "plain":
            return runPrompt(context, command.prompt, context.mode === "live", context.stream);
        case "mode":
            if (!command.mode)
                return `Current mode: ${context.mode}`;
            context.mode = command.mode;
            return command.mode === "live"
                ? "Mode set to live. Live mode may spend provider credits."
                : "Mode set to dry-run. No LLM/provider spend occurs.";
        case "stream":
            if (command.enabled === undefined)
                return `Streaming mode: ${context.stream ? "on" : "off"}`;
            context.stream = command.enabled;
            return `Streaming mode ${context.stream ? "on" : "off"}.`;
        case "policies":
            return (await listPolicyProfileNames(context.cwd)).join("\n");
        case "policy":
            if (!command.name)
                return `Current policy: ${context.policy ?? "company-grade"}`;
            await loadPolicyProfile(context.cwd, command.name);
            context.policy = command.name;
            return `Policy set to ${context.policy}.`;
        case "route": {
            const config = await loadConfig(context.cwd);
            if (command.agent) {
                const route = routeAgent(config, config.default_profile, command.agent);
                return `${route.agent}: ${route.selected.provider}/${route.selected.model}\n${route.selected.reason}`;
            }
            return buildRoutingPlan({
                config,
                profile: config.default_profile,
                runId: "console-preview",
                agents: ["intake", "architect", "implementation", "test", "security", "release_manager"],
                policy: context.policy ?? "company-grade"
            })
                .agents.map((agent) => `${agent.agent}: ${agent.selectedProvider}/${agent.selectedModel}`)
                .join("\n");
        }
        case "workspace":
            return JSON.stringify(await buildReviewWorkspace(context.cwd, command.runId, true), null, 2);
        case "review":
            return command.diff
                ? readPatchDiffs(new RunStore(context.cwd), command.runId)
                : renderReviewSummary(formatReview(await reviewRun(context.cwd, command.runId)));
        case "diff":
            return readPatchDiffs(new RunStore(context.cwd), command.runId);
        case "approve":
            return `${await approveRun(context.cwd, command.runId)}\nApproval alone does not apply patches.`;
        case "apply":
            if (command.confirm !== `APPLY ${command.runId}`) {
                return `Apply requires exact confirmation: /apply ${command.runId} --confirm "APPLY ${command.runId}"`;
            }
            return JSON.stringify(await applyRun(context.cwd, command.runId, { confirm: command.confirm }), null, 2);
        case "rollback":
            if (command.confirm !== `ROLLBACK ${command.runId}`) {
                return `Rollback requires exact confirmation: /rollback ${command.runId} --confirm "ROLLBACK ${command.runId}"`;
            }
            return JSON.stringify(await rollbackRun(context.cwd, command.runId, { confirm: command.confirm }), null, 2);
        case "providers": {
            const config = await loadConfig(context.cwd);
            if (command.doctor) {
                return JSON.stringify(await diagnoseProviders({
                    config,
                    registry: createProviderRegistry(config),
                    includeModels: false
                }), null, 2);
            }
            return Object.entries(config.providers)
                .map(([name, provider]) => `${name}\t${provider.type}`)
                .join("\n");
        }
        case "models": {
            const config = await loadConfig(context.cwd);
            const registry = createProviderRegistry(config);
            const rows = [];
            for (const [name, provider] of registry) {
                try {
                    const models = await provider.listModels();
                    rows.push(...models.map((model) => `${model.provider}\t${model.id}`));
                }
                catch (error) {
                    rows.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
            return rows.join("\n") || "No models found.";
        }
        case "verify":
            if (command.confirm !== `VERIFY ${command.runId}`)
                return `Verify requires exact confirmation: /verify ${command.runId} --confirm "VERIFY ${command.runId}"`;
            return JSON.stringify(await verifyRun(context.cwd, command.runId, { confirm: command.confirm }), null, 2);
        case "scan":
            return JSON.stringify(command.external
                ? await scanRunExternal(context.cwd, command.runId, command.confirm)
                : await scanRunBuiltin(context.cwd, command.runId), null, 2);
        case "repair":
            return JSON.stringify(await repairRun(context.cwd, command.runId, {
                live: command.live,
                dryRun: command.dryRun,
                confirm: command.confirm
            }), null, 2);
        case "cost":
            return JSON.stringify(await estimateRunCost(context.cwd, command.runId), null, 2);
        case "ledger":
            return JSON.stringify(command.verify
                ? await verifyLedger(context.cwd, command.runId)
                : await writeLedgerManifest(context.cwd, command.runId), null, 2);
        case "handoff":
            return JSON.stringify(command.verify
                ? await verifyHandoffBundle(context.cwd, command.runId)
                : await createHandoffBundle(context.cwd, command.runId), null, 2);
        case "pr-body":
            return (await generatePrDescription(context.cwd, command.runId)).body;
        case "checklist":
            return generateReviewerChecklist(await buildHandoffSummary(context.cwd, command.runId));
        case "exceptions":
            return JSON.stringify(await readPolicyExceptions(context.cwd, command.runId), null, 2);
        case "approvals":
            return JSON.stringify(command.verify
                ? await verifyApprovalNotes(context.cwd, command.runId)
                : await readApprovalNotes(context.cwd, command.runId), null, 2);
        case "github":
            if (command.command === "doctor") {
                return JSON.stringify(await githubDoctor(context.cwd), null, 2);
            }
            if (command.mode && command.mode !== "summary") {
                const expected = command.mode === "update"
                    ? `UPDATE PR ${command.runId}`
                    : command.mode === "comment"
                        ? `COMMENT PR ${command.runId}`
                        : `SYNC PR ${command.runId}`;
                if (command.confirm !== expected) {
                    return `GitHub PR ${command.mode} requires exact confirmation: ${expected}`;
                }
                return JSON.stringify(await updateGithubPr(context.cwd, command.runId ?? "", {
                    pr: command.pr ?? "",
                    mode: command.mode,
                    confirm: command.confirm
                }), null, 2);
            }
            return JSON.stringify(await githubPr(context.cwd, command.runId ?? ""), null, 2);
        case "github-release":
            if (command.createDraft && command.confirm !== `CREATE RELEASE DRAFT ${command.runId}`) {
                return `GitHub release draft creation requires exact confirmation: /github release ${command.runId} --create-draft --confirm "CREATE RELEASE DRAFT ${command.runId}"`;
            }
            if (command.updateDraft && command.confirm !== `UPDATE RELEASE DRAFT ${command.runId}`) {
                return `GitHub release draft update requires exact confirmation: /github release ${command.runId} --update-draft --tag <tag> --confirm "UPDATE RELEASE DRAFT ${command.runId}"`;
            }
            return JSON.stringify(await githubReleaseDraft(context.cwd, command.runId, {
                checkRemoteTag: command.checkRemoteTag,
                createDraft: command.createDraft,
                updateDraft: command.updateDraft,
                tag: command.tag,
                confirm: command.confirm
            }), null, 2);
        case "readiness":
            return JSON.stringify(await evaluateReadiness(context.cwd, command.runId), null, 2);
        case "branch":
            if (command.create && command.confirm !== `CREATE BRANCH ${command.runId}`) {
                return `Branch creation requires exact confirmation: /branch ${command.runId} --create --confirm "CREATE BRANCH ${command.runId}"`;
            }
            return JSON.stringify(await branchRun(context.cwd, command.runId, {
                create: command.create,
                confirm: command.confirm
            }), null, 2);
        case "commit-message":
            return (await generateCommitMessage(context.cwd, command.runId)).subject;
        case "commit":
            if (command.create && command.confirm !== `COMMIT ${command.runId}`) {
                return `Commit requires exact confirmation: /commit ${command.runId} --create --confirm "COMMIT ${command.runId}"`;
            }
            return JSON.stringify(await commitRun(context.cwd, command.runId, {
                create: command.create,
                confirm: command.confirm
            }), null, 2);
        case "lifecycle":
            return JSON.stringify(await buildLifecycle(context.cwd, command.runId), null, 2);
        case "feedback": {
            if (command.github) {
                if (command.confirm !== `INGEST FEEDBACK ${command.runId}`) {
                    return `GitHub feedback ingestion requires exact confirmation: /feedback ${command.runId} --github --pr <pr> --confirm "INGEST FEEDBACK ${command.runId}"`;
                }
                return JSON.stringify(await ingestGithubFeedback(context.cwd, command.runId, command.pr ?? "", command.confirm), null, 2);
            }
            if (command.file) {
                return JSON.stringify(await ingestLocalFeedback(context.cwd, command.runId, command.file), null, 2);
            }
            const store = new RunStore(context.cwd);
            const path = join(store.runPath(command.runId), "reviewer-feedback.json");
            return pathExists(path)
                ? JSON.stringify(await readJson(path), null, 2)
                : "No reviewer feedback has been ingested.";
        }
        case "merge-readiness":
            if (command.github && command.confirm !== `CHECK PR ${command.runId}`) {
                return `GitHub merge-readiness check requires exact confirmation: /merge-check ${command.runId} --github --pr <pr> --confirm "CHECK PR ${command.runId}"`;
            }
            return JSON.stringify(await evaluateMergeReadiness(context.cwd, command.runId, {
                github: command.github,
                pr: command.pr,
                confirm: command.confirm
            }), null, 2);
        case "release":
            return JSON.stringify(command.verify
                ? await verifyReleaseIntegrity(context.cwd, command.runId)
                : await generateReleasePacket(context.cwd, command.runId, {
                    channel: command.channel,
                    strict: command.strict
                }), null, 2);
        case "changelog":
            if (command.write && command.confirm !== `WRITE CHANGELOG ${command.runId}`) {
                return `Changelog write requires exact confirmation: /changelog ${command.runId} --write --confirm "WRITE CHANGELOG ${command.runId}"`;
            }
            return JSON.stringify(command.write
                ? await writeChangelog(context.cwd, command.runId, { confirm: command.confirm })
                : await generateChangelogEntry(context.cwd, command.runId), null, 2);
        case "version":
            if (command.apply && command.confirm !== `APPLY VERSION ${command.runId}`) {
                return `Version apply requires exact confirmation: /version ${command.runId} --apply --confirm "APPLY VERSION ${command.runId}"`;
            }
            return JSON.stringify(command.apply
                ? await applyVersionPlan(context.cwd, command.runId, { confirm: command.confirm })
                : await planVersion(context.cwd, command.runId, {
                    bump: command.bump,
                    preid: command.preid,
                    version: command.version,
                    confirmMajor: command.confirmMajor
                }), null, 2);
        case "release-branch":
            if (command.create && command.confirm !== `CREATE RELEASE BRANCH ${command.runId}`) {
                return `Release branch creation requires exact confirmation: /release-branch ${command.runId} --create --confirm "CREATE RELEASE BRANCH ${command.runId}"`;
            }
            return JSON.stringify(await releaseBranchRun(context.cwd, command.runId, {
                create: command.create,
                confirm: command.confirm,
                allowDirty: command.allowDirty,
                channel: command.channel
            }), null, 2);
        case "tag":
            if (command.create && command.confirm !== `CREATE TAG ${command.runId}`) {
                return `Tag creation requires exact confirmation: /tag ${command.runId} --create --confirm "CREATE TAG ${command.runId}"`;
            }
            if (command.deleteLocal && command.confirm !== `DELETE TAG ${command.runId}`) {
                return `Local tag deletion requires exact confirmation: /tag ${command.runId} --delete-local --confirm "DELETE TAG ${command.runId}"`;
            }
            return JSON.stringify(await tagRun(context.cwd, command.runId, {
                create: command.create,
                deleteLocal: command.deleteLocal,
                confirm: command.confirm,
                allowDirty: command.allowDirty
            }), null, 2);
        case "ci":
            if (command.github && command.confirm !== `INGEST CI ${command.runId}`) {
                return `GitHub CI ingestion requires exact confirmation: /ci ${command.runId} --github --confirm "INGEST CI ${command.runId}"`;
            }
            return JSON.stringify(command.github
                ? await ingestGithubCi(context.cwd, command.runId, command.confirm)
                : command.file
                    ? await ingestCiFile(context.cwd, command.runId, command.file)
                    : await showOrCreateLocalCiStatus(context.cwd, command.runId), null, 2);
        case "deployment-readiness":
            return JSON.stringify(await evaluateDeploymentReadiness(context.cwd, command.runId, {
                channel: command.channel
            }), null, 2);
        case "release-approval":
            if ((command.decision || command.reviewer || command.note) &&
                command.confirm !== `ADD RELEASE APPROVAL ${command.runId}`) {
                return `Release approval requires exact confirmation: /release-approval ${command.runId} --decision approved --reviewer "Name" --note "Note" --confirm "ADD RELEASE APPROVAL ${command.runId}"`;
            }
            return JSON.stringify(await addReleaseApproval(context.cwd, command.runId, {
                decision: command.decision,
                reviewer: command.reviewer,
                note: command.note,
                confirm: command.confirm
            }), null, 2);
        case "release-readiness":
            return JSON.stringify(await evaluateReleaseReadiness(context.cwd, command.runId, {
                channel: command.channel
            }), null, 2);
        case "provenance":
            if (command.keyCommand === "status") {
                return JSON.stringify(await keyStatus(context.cwd), null, 2);
            }
            if (command.keyCommand === "init") {
                if (command.confirm !== (command.rotate ? "ROTATE PROVENANCE KEY" : "CREATE PROVENANCE KEY")) {
                    return `Provenance key init requires exact confirmation: /provenance key init --confirm "CREATE PROVENANCE KEY"`;
                }
                return JSON.stringify(await initProvenanceKey(context.cwd, {
                    confirm: command.confirm,
                    rotate: command.rotate
                }), null, 2);
            }
            if (command.keyCommand === "export-public") {
                return JSON.stringify(await exportPublicKey(context.cwd), null, 2);
            }
            if (!command.runId)
                return "Usage: /provenance <run-id>";
            if (command.sign && command.confirm !== `SIGN PROVENANCE ${command.runId}`) {
                return `Provenance signing requires exact confirmation: /provenance ${command.runId} --sign --confirm "SIGN PROVENANCE ${command.runId}"`;
            }
            return JSON.stringify(command.verify
                ? await verifyProvenance(context.cwd, command.runId)
                : command.sign
                    ? await signProvenance(context.cwd, command.runId, { confirm: command.confirm })
                    : await generateProvenanceStatement(context.cwd, command.runId), null, 2);
        case "checksums":
            return JSON.stringify(command.verify
                ? await verifyChecksums(context.cwd, command.runId)
                : await createChecksums(context.cwd, command.runId), null, 2);
        case "evidence":
            if (command.sign && command.confirm !== `SIGN EVIDENCE ${command.runId}`) {
                return `Evidence signing requires exact confirmation: /evidence ${command.runId} --sign --confirm "SIGN EVIDENCE ${command.runId}"`;
            }
            return JSON.stringify(command.verify
                ? await verifyEvidenceBundle(context.cwd, command.runId)
                : await createEvidenceBundle(context.cwd, command.runId, {
                    sign: command.sign,
                    confirm: command.confirm
                }), null, 2);
        case "remote-targets":
            if (command.command === "list") {
                return JSON.stringify(await listRemoteTargets(context.cwd), null, 2);
            }
            if (command.command === "doctor") {
                if (command.ping && command.confirm !== "PING REMOTE TARGETS") {
                    return 'Remote target ping requires exact confirmation: /remote-targets doctor --ping --confirm "PING REMOTE TARGETS"';
                }
                return JSON.stringify(await doctorRemoteTargets(context.cwd, {
                    ping: command.ping,
                    confirm: command.confirm
                }), null, 2);
            }
            if (command.command === "add") {
                if (!command.name || !command.url)
                    return "Usage: /remote-targets add generic-http --name <name> --url <url>";
                if (command.confirm !== `ADD REMOTE TARGET ${command.name}`) {
                    return `Remote target add requires exact confirmation: /remote-targets add generic-http --name ${command.name} --url ${command.url} --confirm "ADD REMOTE TARGET ${command.name}"`;
                }
                return JSON.stringify(await addRemoteTarget(context.cwd, {
                    name: command.name,
                    url: command.url,
                    tokenEnv: command.tokenEnv,
                    confirm: command.confirm
                }), null, 2);
            }
            if (!command.name)
                return "Usage: /remote-targets disable <name>";
            if (command.command === "disable") {
                if (command.confirm !== `DISABLE REMOTE TARGET ${command.name}`) {
                    return `Remote target disable requires exact confirmation: /remote-targets disable ${command.name} --confirm "DISABLE REMOTE TARGET ${command.name}"`;
                }
                return JSON.stringify(await disableRemoteTarget(context.cwd, command.name, command.confirm), null, 2);
            }
            if (command.confirm !== `REMOVE REMOTE TARGET ${command.name}`) {
                return `Remote target remove requires exact confirmation: /remote-targets remove ${command.name} --confirm "REMOVE REMOTE TARGET ${command.name}"`;
            }
            return JSON.stringify(await removeRemoteTarget(context.cwd, command.name, command.confirm), null, 2);
        case "attestation":
            if (command.command === "export") {
                return JSON.stringify(await createAttestationExport(context.cwd, command.runId), null, 2);
            }
            if (command.command === "receipt") {
                return JSON.stringify(await readRemoteSubmissionReceipt(context.cwd, command.runId), null, 2);
            }
            if (!command.dryRun &&
                command.confirm !== `SUBMIT ATTESTATION ${command.runId} TO ${command.target}`) {
                return `Remote attestation submission requires exact confirmation: /attestation submit ${command.runId} --target ${command.target ?? "<name>"} --confirm "SUBMIT ATTESTATION ${command.runId} TO ${command.target ?? "<name>"}"`;
            }
            return JSON.stringify(await submitAttestation(context.cwd, command.runId, {
                target: command.target,
                confirm: command.confirm,
                dryRun: command.dryRun
            }), null, 2);
        case "transparency":
            if (command.command === "verify") {
                return JSON.stringify(await verifyTransparencyLog(context.cwd, command.runId), null, 2);
            }
            if (!command.runId)
                return "Usage: /transparency <run-id>";
            if (command.command === "append") {
                if (command.confirm !== `APPEND TRANSPARENCY ${command.runId}`) {
                    return `Transparency append requires exact confirmation: /transparency append ${command.runId} --confirm "APPEND TRANSPARENCY ${command.runId}"`;
                }
                return JSON.stringify(await appendTransparencyEntry(context.cwd, command.runId, command.confirm), null, 2);
            }
            return JSON.stringify(await generateTransparencyEntry(context.cwd, command.runId), null, 2);
        case "registry-metadata":
            return JSON.stringify(await generateRegistryMetadata(context.cwd, command.runId, {
                image: command.image,
                tag: command.tag
            }), null, 2);
        case "org":
            if (command.command === "status")
                return JSON.stringify(await orgStatus(context.cwd), null, 2);
            if (command.command === "reviewers")
                return JSON.stringify(await listOrgReviewers(context.cwd), null, 2);
            if (command.command === "audit")
                return JSON.stringify(await orgAuditSummary(context.cwd, command.verify), null, 2);
            if (command.command === "init") {
                const expected = command.force
                    ? "FORCE INIT ORGANIZATION"
                    : command.createKey
                        ? "INIT ORGANIZATION WITH KEY"
                        : "INIT ORGANIZATION";
                if (command.confirm !== expected) {
                    return `Organization init requires exact confirmation: /org init --confirm "${expected}"`;
                }
                return JSON.stringify(await initOrganization(context.cwd, {
                    confirm: command.confirm,
                    createKey: command.createKey,
                    force: command.force,
                    noEnable: command.noEnable
                }), null, 2);
            }
            if (command.keyCommand === "status")
                return JSON.stringify(await orgKeyStatus(context.cwd), null, 2);
            if (command.keyCommand === "export-public")
                return JSON.stringify(await exportOrgPublicKey(context.cwd), null, 2);
            if (command.keyCommand === "init") {
                const expected = command.rotate ? "ROTATE ORG KEY" : "CREATE ORG KEY";
                if (command.confirm !== expected) {
                    return `Org key init requires exact confirmation: /org key init --confirm "${expected}"`;
                }
                return JSON.stringify(await initOrgKey(context.cwd, { confirm: command.confirm, rotate: command.rotate }), null, 2);
            }
            return "Usage: /org status";
        case "org-policy":
            if (command.command === "verify")
                return JSON.stringify(await verifyOrgPolicyBundle(context.cwd), null, 2);
            if (command.command === "show")
                return JSON.stringify(await showOrgPolicyBundle(context.cwd), null, 2);
            if (command.sign && command.confirm !== "SIGN ORG POLICY") {
                return 'Org policy signing requires exact confirmation: /org-policy bundle --sign --confirm "SIGN ORG POLICY"';
            }
            return JSON.stringify(await createOrgPolicyBundle(context.cwd, {
                sign: command.sign,
                confirm: command.confirm
            }), null, 2);
        case "org-approvals":
            if (command.add && command.confirm !== `ADD ORG APPROVAL ${command.runId}`) {
                return `Org approval requires exact confirmation: /org-approvals ${command.runId} --add --reviewer <reviewer-id> --role <role> --decision approved --note "note" --confirm "ADD ORG APPROVAL ${command.runId}"`;
            }
            return JSON.stringify(command.verify
                ? await verifyApprovalMatrix(context.cwd, command.runId)
                : command.add
                    ? await addOrgApproval(context.cwd, command.runId, {
                        reviewer: command.reviewer ?? "",
                        role: command.role ?? "",
                        decision: command.decision ?? "approved",
                        note: command.note ?? "",
                        confirm: command.confirm,
                        externalReviewer: command.externalReviewer
                    })
                    : await getApprovalMatrix(context.cwd, command.runId), null, 2);
        case "receipt-refresh":
            if (command.verifyRemote && command.confirm !== `VERIFY REMOTE RECEIPT ${command.runId}`) {
                return `Remote receipt verification requires exact confirmation: /receipt-refresh ${command.runId} --verify-remote --confirm "VERIFY REMOTE RECEIPT ${command.runId}"`;
            }
            return JSON.stringify(await refreshReceipt(context.cwd, command.runId, {
                dryRun: command.dryRun,
                verifyRemote: command.verifyRemote,
                confirm: command.confirm
            }), null, 2);
        case "retention":
            if (command.mark && command.confirm !== `MARK RETENTION ${command.runId}`) {
                return `Retention marking requires exact confirmation: /retention ${command.runId} --mark --confirm "MARK RETENTION ${command.runId}"`;
            }
            return JSON.stringify(await createRetentionPlan(context.cwd, command.runId, {
                policy: command.policy,
                mark: command.mark,
                purgePreview: command.purgePreview,
                confirm: command.confirm
            }), null, 2);
        case "evidence-export":
            return JSON.stringify(command.verify
                ? await verifyEvidenceExport(context.cwd, command.runId)
                : await createEvidenceExport(context.cwd, command.runId, {
                    mode: command.mode
                }), null, 2);
        case "org-report":
            return JSON.stringify(await createOrgAuditReport(context.cwd, command.runId), null, 2);
        case "audit-schemas":
            if (command.command === "list") {
                return JSON.stringify(await listAuditSchemas(context.cwd), null, 2);
            }
            if (command.command === "show") {
                if (!command.name)
                    return "Usage: /audit-schemas show <name>";
                return JSON.stringify(auditSchemaSummary(await loadAuditSchema(context.cwd, command.name)), null, 2);
            }
            if (command.command === "validate") {
                return JSON.stringify(await validateAuditSchemas(context.cwd, command.name), null, 2);
            }
            return JSON.stringify(await installDefaultAuditSchemas(context.cwd, {
                force: command.force,
                confirm: command.confirm
            }), null, 2);
        case "audit-map":
            return JSON.stringify(await generateAuditEvidenceMap(context.cwd, command.runId, { schema: command.schema }), null, 2);
        case "audit-coverage":
            return JSON.stringify(await generateAuditCoverage(context.cwd, command.runId, { schema: command.schema }), null, 2);
        case "audit-gaps":
            return JSON.stringify(await generateAuditGaps(context.cwd, command.runId, { schema: command.schema }), null, 2);
        case "audit-export":
            if (command.sign && command.confirm !== `SIGN AUDIT EXPORT ${command.runId}`) {
                return `Audit export signing requires exact confirmation: /audit-export ${command.runId} --sign --confirm "SIGN AUDIT EXPORT ${command.runId}"`;
            }
            return JSON.stringify(command.verify
                ? await verifyAuditExport(context.cwd, command.runId)
                : await createAuditExport(context.cwd, command.runId, {
                    schema: command.schema,
                    sign: command.sign,
                    confirm: command.confirm
                }), null, 2);
        case "compliance-bundle":
            if (command.sign && command.confirm !== `SIGN COMPLIANCE BUNDLE ${command.runId}`) {
                return `Compliance bundle signing requires exact confirmation: /compliance-bundle ${command.runId} --sign --confirm "SIGN COMPLIANCE BUNDLE ${command.runId}"`;
            }
            return JSON.stringify(command.verify
                ? await verifyComplianceBundle(context.cwd, command.runId)
                : await createComplianceBundle(context.cwd, command.runId, {
                    schema: command.schema,
                    minimal: command.minimal,
                    sign: command.sign,
                    confirm: command.confirm
                }), null, 2);
        case "reviewer-directory":
            if (command.command === "list") {
                return JSON.stringify((await loadConfig(context.cwd)).organization.reviewers, null, 2);
            }
            if (!command.file)
                return "Usage: /reviewer-directory import --file <path>";
            if (command.command === "validate") {
                return JSON.stringify(await readReviewerDirectoryFile(context.cwd, command.file), null, 2);
            }
            if (command.apply && command.confirm !== "IMPORT REVIEWERS") {
                return 'Reviewer import requires exact confirmation: /reviewer-directory import --file <path> --apply --confirm "IMPORT REVIEWERS"';
            }
            return JSON.stringify(command.apply
                ? await applyReviewerImport(context.cwd, command.file, {
                    confirm: command.confirm,
                    allowRawEmail: command.allowRawEmail,
                    rawEmailConfirm: command.rawEmailConfirm
                })
                : await previewReviewerImport(context.cwd, command.file, {
                    allowRawEmail: command.allowRawEmail,
                    confirm: command.rawEmailConfirm
                }), null, 2);
        case "auditor-handoff":
            return JSON.stringify(command.verify
                ? await verifyAuditorHandoff(context.cwd, command.runId)
                : await createAuditorHandoff(context.cwd, command.runId, {
                    schema: command.schema,
                    minimal: command.minimal
                }), null, 2);
        case "evidence-inventory":
            if (command.all) {
                return JSON.stringify(await summarizeAllInventories(context.cwd), null, 2);
            }
            if (!command.runId)
                return "Usage: /evidence-inventory <run-id> | --all";
            return JSON.stringify(await generateEvidenceInventory(context.cwd, command.runId, { deep: command.deep }), null, 2);
        case "evidence-lifecycle":
            if (command.all) {
                return JSON.stringify(await createEvidenceLifecycleIndex(context.cwd), null, 2);
            }
            if (!command.runId)
                return "Usage: /evidence-lifecycle <run-id> | --all";
            return JSON.stringify(await createEvidenceLifecycleReport(context.cwd, command.runId), null, 2);
        case "retention-enforce":
            return JSON.stringify(await previewRetentionEnforcement(context.cwd, command.runId, {
                policy: command.policy
            }), null, 2);
        case "evidence-archive":
            if ((command.create || command.sign) &&
                command.confirm !== `ARCHIVE EVIDENCE ${command.runId}`) {
                return `Evidence archive creation requires exact confirmation: /evidence-archive ${command.runId} --create --confirm "ARCHIVE EVIDENCE ${command.runId}"`;
            }
            return JSON.stringify(command.verify
                ? await verifyEvidenceArchive(context.cwd, command.runId)
                : command.create || command.sign
                    ? await createEvidenceArchive(context.cwd, command.runId, {
                        mode: command.mode,
                        create: command.create,
                        sign: command.sign,
                        confirm: command.confirm
                    })
                    : await previewEvidenceArchive(context.cwd, command.runId, {
                        mode: command.mode
                    }), null, 2);
        case "retention-ledger":
            if (command.record) {
                if (!command.runId)
                    return "Retention ledger manual record requires a run id.";
                if (command.confirm !== `RECORD RETENTION EVENT ${command.runId}`) {
                    return `Retention ledger record requires exact confirmation: /retention-ledger ${command.runId} --record --event <event> --summary "summary" --confirm "RECORD RETENTION EVENT ${command.runId}"`;
                }
                return JSON.stringify(await recordManualRetentionEvent(context.cwd, command.runId, {
                    event: command.event,
                    summary: command.summary ?? "",
                    confirm: command.confirm
                }), null, 2);
            }
            return JSON.stringify(command.verify
                ? await verifyRetentionLedger(context.cwd, command.runId)
                : await retentionLedgerSummary(context.cwd, command.runId), null, 2);
        case "legal-hold":
            if (command.enable && command.confirm !== `ENABLE LEGAL HOLD ${command.runId}`) {
                return `Legal hold enable requires exact confirmation: /legal-hold ${command.runId} --enable --reason "reason" --by "name" --confirm "ENABLE LEGAL HOLD ${command.runId}"`;
            }
            if (command.release && command.confirm !== `RELEASE LEGAL HOLD ${command.runId}`) {
                return `Legal hold release requires exact confirmation: /legal-hold ${command.runId} --release --reason "reason" --by "name" --confirm "RELEASE LEGAL HOLD ${command.runId}"`;
            }
            return JSON.stringify(command.enable
                ? await enableLegalHold(context.cwd, command.runId, command)
                : command.release
                    ? await releaseLegalHold(context.cwd, command.runId, command)
                    : await legalHoldStatus(context.cwd, command.runId), null, 2);
        case "evidence-compact":
            if (command.bundle && command.confirm !== `CREATE COMPACT EVIDENCE ${command.runId}`) {
                return `Compact evidence bundle requires exact confirmation: /evidence-compact ${command.runId} --bundle --confirm "CREATE COMPACT EVIDENCE ${command.runId}"`;
            }
            return JSON.stringify(command.verify
                ? await verifyCompactEvidenceBundle(context.cwd, command.runId)
                : command.bundle
                    ? await createCompactEvidenceBundle(context.cwd, command.runId, {
                        confirm: command.confirm
                    })
                    : await createCompactionReport(context.cwd, command.runId), null, 2);
        case "evidence-report":
            return JSON.stringify(await createEvidenceReport(context.cwd, {
                deep: command.deep,
                policy: command.policy
            }), null, 2);
        case "disposal-eligibility":
            return JSON.stringify(command.all
                ? await createDisposalReport(context.cwd)
                : command.runId
                    ? await evaluateDisposalEligibility(context.cwd, command.runId, {
                        policy: command.policy
                    })
                    : { error: "Usage: /disposal-eligibility <run-id> | /disposal-eligibility --all" }, null, 2);
        case "disposal-candidates":
            return JSON.stringify(await buildDisposalCandidates(context.cwd, command.runId), null, 2);
        case "disposal-plan":
            return JSON.stringify(await createDisposalPlan(context.cwd, command.runId, {
                forcePreview: command.forcePreview
            }), null, 2);
        case "disposal-attestation":
            if (command.sign && command.confirm !== `SIGN DISPOSAL ATTESTATION ${command.runId}`) {
                return `Disposal attestation signing requires exact confirmation: /disposal-attestation ${command.runId} --sign --confirm "SIGN DISPOSAL ATTESTATION ${command.runId}"`;
            }
            return JSON.stringify(await createDisposalAttestation(context.cwd, command.runId, {
                sign: command.sign,
                confirm: command.confirm
            }), null, 2);
        case "disposal-approvals":
            if (command.add && command.confirm !== `ADD DISPOSAL APPROVAL ${command.runId}`) {
                return `Disposal approval requires exact confirmation: /disposal-approvals ${command.runId} --add ... --confirm "ADD DISPOSAL APPROVAL ${command.runId}"`;
            }
            return JSON.stringify(command.add
                ? await addDisposalApproval(context.cwd, command.runId, command)
                : command.verify
                    ? await verifyDisposalApprovals(context.cwd, command.runId)
                    : await getDisposalApprovals(context.cwd, command.runId), null, 2);
        case "disposal-precheck":
            return JSON.stringify(await runDisposalPrecheck(context.cwd, command.runId), null, 2);
        case "disposal-execute":
            if (command.dryRun)
                return JSON.stringify(await dryRunDisposal(context.cwd, command.runId), null, 2);
            if (command.confirm !== `DELETE EVIDENCE ${command.runId}`) {
                return `Disposal execution requires exact confirmation: /disposal-execute ${command.runId} --confirm "DELETE EVIDENCE ${command.runId}"`;
            }
            return JSON.stringify(await executeDisposal(context.cwd, command.runId, { confirm: command.confirm }), null, 2);
        case "disposal-report":
            return JSON.stringify(await createDisposalReport(context.cwd, { deep: command.deep }), null, 2);
        case "dogfood":
            if (command.command === "plan") {
                return JSON.stringify(await createDogfoodPlan(context.cwd, { writeFixtures: command.writeFixtures }), null, 2);
            }
            if (command.command === "fixtures") {
                if (command.clean && command.confirm !== "CLEAN DOGFOOD FIXTURES") {
                    return 'Dogfood fixture cleanup requires exact confirmation: /dogfood fixtures --clean --confirm "CLEAN DOGFOOD FIXTURES"';
                }
                return JSON.stringify(command.clean
                    ? await cleanDogfoodFixtures(context.cwd, command.confirm)
                    : await createDogfoodFixtures(context.cwd), null, 2);
            }
            if (command.command === "run") {
                if (command.applyFixturePatches && command.confirm !== "APPLY DOGFOOD FIXTURE PATCHES") {
                    return 'Applying dogfood fixture patches requires exact confirmation: /dogfood run --apply-fixture-patches --confirm "APPLY DOGFOOD FIXTURE PATCHES"';
                }
                return JSON.stringify(await runDogfood(context.cwd, {
                    fixture: command.fixture,
                    applyFixturePatches: command.applyFixturePatches,
                    confirm: command.confirm
                }), null, 2);
            }
            return JSON.stringify((await latestDogfoodReport(context.cwd)) ?? { error: "No report" }, null, 2);
        case "live-smoke":
            if (command.rc && command.confirm && command.confirm !== "RUN LIVE RC SMOKE") {
                return 'Live RC smoke requires exact confirmation: /live-smoke --rc --confirm "RUN LIVE RC SMOKE"';
            }
            if (command.confirm && command.confirm !== "RUN LIVE SMOKE") {
                if (!command.rc)
                    return 'Live smoke requires exact confirmation: /live-smoke --provider <provider> --model <model> --confirm "RUN LIVE SMOKE"';
            }
            return JSON.stringify(command.rc && command.confirm
                ? await (await import("../dogfood/live-smoke.js")).runLiveRcSmoke(context.cwd, command)
                : command.confirm
                    ? await runLiveSmoke(context.cwd, command)
                    : await previewLiveSmoke(context.cwd, { profile: command.profile }), null, 2);
        case "scanner-check":
            if (command.runSafe && command.confirm !== "RUN SAFE SCANNER CHECK") {
                return 'Safe scanner check requires exact confirmation: /scanner-check --run-safe --confirm "RUN SAFE SCANNER CHECK"';
            }
            return JSON.stringify(await scannerReadiness(context.cwd, {
                runSafe: command.runSafe,
                confirm: command.confirm,
                strict: command.strict,
                installGuide: command.installGuide
            }), null, 2);
        case "security-redteam":
            return JSON.stringify(await runSecurityRedteam(context.cwd), null, 2);
        case "package-check":
            return JSON.stringify(await runPackageCheck(context.cwd), null, 2);
        case "package-install-check":
            return JSON.stringify(await runPackageInstallCheck(context.cwd), null, 2);
        case "docs-check":
            return JSON.stringify(await runDocsCheck(context.cwd, { strict: command.strict }), null, 2);
        case "perf-check":
            return JSON.stringify(await runPerfCheck(context.cwd), null, 2);
        case "beta-check":
            return JSON.stringify(await runBetaCheck(context.cwd, { strict: command.strict }), null, 2);
        case "beta-backlog":
            return JSON.stringify(await createBetaBacklog(context.cwd), null, 2);
        case "beta-warnings":
            return JSON.stringify(command.command
                ? await acceptBetaWarning(context.cwd, command.warningId ?? "", {
                    by: command.by,
                    reason: command.reason,
                    confirm: command.confirm,
                    strict: command.strict,
                    resolve: command.command === "resolve"
                })
                : await collectBetaWarnings(context.cwd), null, 2);
        case "dogfood-apply-smoke":
            return JSON.stringify(await runDogfoodApplySmoke(context.cwd), null, 2);
        case "beta-rc":
            return JSON.stringify(await createBetaRcReport(context.cwd, {
                channel: command.channel,
                strict: command.strict
            }), null, 2);
        case "beta-trial":
            return JSON.stringify(command.command === "create"
                ? await createBetaTrialPack(context.cwd, command.target)
                : command.command === "list"
                    ? await listBetaTrials(context.cwd)
                    : await showBetaTrial(context.cwd, command.trialId ?? ""), null, 2);
        case "doctor":
            return startupHeader(context);
        case "clear":
            console.clear();
            return startupHeader(context);
        case "unknown":
            return command.message;
    }
}
export async function runConsole(cwd = process.cwd(), options = {}) {
    const context = {
        cwd,
        mode: "dry-run",
        stream: false,
        policy: "company-grade",
        theme: createTheme()
    };
    console.log(await startupHeader(context));
    console.log(renderInputFrame(context.theme));
    if (options.inputLines || !process.stdin.isTTY) {
        const lines = options.inputLines ??
            (await new Promise((resolve) => {
                let data = "";
                process.stdin.setEncoding("utf8");
                process.stdin.on("data", (chunk) => {
                    data += String(chunk);
                });
                process.stdin.on("end", () => resolve(data));
            })).split(/\r?\n/);
        for (const line of lines) {
            if (!line.trim())
                continue;
            const result = await executeConsoleCommand(parseConsoleCommand(line), context);
            if (result === "__EXIT__")
                break;
            console.log(renderCommandResult(result, context.theme));
        }
        return;
    }
    const rl = createConsoleReadline();
    try {
        for (;;) {
            const line = await rl.question("> ");
            try {
                const result = await executeConsoleCommand(parseConsoleCommand(line), context);
                if (result === "__EXIT__")
                    break;
                console.log(renderCommandResult(result, context.theme));
            }
            catch (error) {
                console.log(renderError(error, context.theme));
            }
            console.log(renderInputFrame(context.theme));
        }
    }
    finally {
        rl.close();
    }
}
//# sourceMappingURL=console.js.map