import { join } from "node:path";
import { agentRoleIds, agentRoles, workflowAgentRoleIds } from "../agents/roles.js";
import { buildAgentMessages, executeJsonAgent } from "../agents/executor.js";
import { requiredSecurityPolicy } from "../config/defaults.js";
import { buildRunContext } from "../context/context-builder.js";
import { createFinalReport, createPhaseTwoFinalReport, createPlanArtifact } from "./artifacts.js";
import { createProviderRegistry } from "../providers/registry.js";
import { writeBudgetReport } from "../cost/guard.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { loadPolicyProfile } from "../policies/profile-loader.js";
import { buildRoutingPlan, routeAgent } from "../routing/router.js";
import { routingStrategyForProfile } from "../routing/policy.js";
import { collectCommandRecommendations } from "../tools/command-policy.js";
import { writePatchArtifacts } from "./patches.js";
import { RunStore } from "./run-store.js";
function now() {
    return new Date().toISOString();
}
export function createRunId(date = new Date()) {
    const stamp = date
        .toISOString()
        .replace(/[-:.TZ]/g, "")
        .slice(0, 14);
    const suffix = Math.random().toString(36).slice(2, 8);
    return `run-${stamp}-${suffix}`;
}
export function createInitialState(args) {
    const timestamp = now();
    const agents = agentRoleIds.reduce((accumulator, id) => ({
        ...accumulator,
        [id]: { id, status: "queued", artifacts: [] }
    }), {});
    const gates = agentRoleIds.reduce((accumulator, id) => ({
        ...accumulator,
        [id]: { agent: id, status: "not_started", condition: agentRoles[id].gateCondition }
    }), {});
    return {
        runId: args.runId,
        prompt: args.prompt,
        repoPath: args.repoPath,
        status: "created",
        createdAt: timestamp,
        updatedAt: timestamp,
        agents,
        gates,
        artifactsPath: args.artifactsPath,
        events: [],
        approval: { status: "not_required" },
        apply: { status: "not_started", filesChanged: [] },
        verification: { status: "not_started", failedCommands: [] },
        scanners: {
            builtinStatus: "not_started",
            externalStatus: "not_started",
            criticalFindings: 0,
            highFindings: 0
        },
        repair: { status: "not_started", cyclesUsed: 0 },
        release: {
            packet: { status: "not_started" },
            changelog: { status: "not_started" },
            version: { status: "not_started" },
            releaseBranch: { status: "not_started" },
            tag: { status: "not_started" },
            ci: { status: "not_started" },
            deploymentReadiness: { verdict: "not_started" },
            releaseReadiness: { verdict: "not_started" }
        },
        provenance: {
            key: { status: "unknown" },
            statement: { status: "not_started" },
            signature: { status: "not_started" },
            checksums: { status: "not_started" },
            evidence: { status: "not_started" },
            githubReleaseDraft: { status: "not_started" }
        },
        remoteAttestation: {
            export: { status: "not_started" },
            transparency: { status: "not_started" },
            submission: { status: "not_started" },
            registryMetadata: { status: "not_started" }
        },
        organization: {
            enabled: false,
            policyBundle: { status: "not_started" },
            approvals: { status: "not_started" },
            receiptRefresh: { status: "not_started" },
            retention: { status: "not_started" },
            evidenceExport: { status: "not_started" },
            audit: { status: "not_started" },
            report: { status: "not_started" }
        },
        audit: {
            schema: { status: "not_started" },
            map: { status: "not_started" },
            coverage: { status: "not_started" },
            gaps: { status: "not_started" },
            export: { status: "not_started" },
            complianceBundle: { status: "not_started" },
            reviewerDirectory: { status: "not_started" },
            auditorHandoff: { status: "not_started" }
        },
        evidenceLifecycle: {
            inventory: { status: "not_started" },
            retentionEnforcement: { status: "not_started", purgeImplemented: false },
            archive: { status: "not_started" },
            retentionLedger: { status: "not_started" },
            legalHold: { status: "not_started" },
            compaction: { status: "not_started" },
            report: { status: "not_started" }
        },
        evidenceDisposal: {
            eligibility: { status: "not_started" },
            candidates: { status: "not_started" },
            plan: { status: "not_started" },
            attestation: { status: "not_started" },
            approvals: { status: "not_started" },
            precheck: { status: "not_started" },
            execution: { status: "not_started" },
            ledger: { status: "not_started" }
        },
        phase: 1,
        mode: "dry-run"
    };
}
function event(agent, type, message) {
    return { timestamp: now(), agent, type, message };
}
function deterministicAgentArtifact(agent, state) {
    return {
        runId: state.runId,
        agent,
        phase: 1,
        dryRun: true,
        role: agentRoles[agent],
        result: `Deterministic ${agent} artifact produced for orchestration validation.`
    };
}
export async function executePhaseOneWorkflow(args) {
    const store = new RunStore(args.cwd);
    const runId = args.runId ?? createRunId();
    const runPath = await store.createRunDirectory(runId);
    const state = createInitialState({
        runId,
        prompt: args.prompt,
        repoPath: args.cwd,
        artifactsPath: join(".vibecli", "runs", runId)
    });
    state.phase = 6;
    state.mode = "dry-run";
    state.policy = args.policy ?? "company-grade";
    if (args.config)
        state.routingStrategy = routingStrategyForProfile(args.config, args.profile);
    await store.writeInput(runId, {
        prompt: args.prompt,
        profile: args.profile,
        policy: state.policy,
        createdAt: state.createdAt
    });
    await store.writeArtifact(runId, "plan.json", createPlanArtifact(state));
    await store.writeSecurityBaseline(runId);
    await store.writeTextArtifact(runId, "agent-events.jsonl", "");
    const repoContext = await buildRunContext(args.cwd);
    await store.writeArtifact(runId, "repo-context.json", repoContext);
    if (args.config) {
        const routingPlan = buildRoutingPlan({
            config: args.config,
            profile: args.profile,
            runId,
            agents: [...workflowAgentRoleIds],
            policy: state.policy
        });
        await store.writeArtifact(runId, "routing-plan.json", routingPlan);
        const budgetReport = await writeBudgetReport({
            cwd: args.cwd,
            runId,
            config: args.config,
            overrideMaxRunCostUsd: args.maxCostUsd
        });
        state.budget = {
            status: budgetReport.status,
            maxRunCostUsd: budgetReport.policy.maxRunCostUsd
        };
    }
    state.status = "running";
    state.updatedAt = now();
    await store.writeState(state);
    for (const agent of workflowAgentRoleIds) {
        const started = event(agent, "agent_started", `${agent} started`);
        state.events.push(started);
        await store.appendEvent(runId, started);
        state.currentAgent = agent;
        state.agents[agent].status = "running";
        state.agents[agent].startedAt = started.timestamp;
        state.gates[agent].status = "running";
        state.updatedAt = now();
        await store.writeState(state);
        const artifactName = agentRoles[agent].requiredArtifacts[0] ?? `${agent}.json`;
        const artifactPath = join("agents", agent, artifactName);
        const dryRunArtifact = deterministicAgentArtifact(agent, state);
        await store.writeArtifact(runId, artifactPath, dryRunArtifact);
        await store.writeArtifact(runId, `agent-outputs/${agent}.json`, dryRunArtifact);
        state.agents[agent].status = "passed";
        state.agents[agent].completedAt = now();
        state.agents[agent].artifacts.push(artifactPath);
        state.agents[agent].summary =
            `${agentRoles[agent].displayName} completed Phase 1 dry-run work.`;
        state.gates[agent].status = "passed";
        state.gates[agent].message =
            agent === "security"
                ? `${Object.keys(requiredSecurityPolicy).length} baseline checks acknowledged.`
                : agentRoles[agent].gateCondition;
        state.updatedAt = now();
        const passed = event(agent, "agent_passed", `${agent} passed gate`);
        state.events.push(passed);
        await store.appendEvent(runId, passed);
        await store.writeState(state);
    }
    state.status = "completed";
    state.currentAgent = "release_manager";
    state.updatedAt = now();
    await writePatchArtifacts({ store, runId, createdAt: now(), outputs: {} });
    await store.writeArtifact(runId, "command-review.json", { recommended: [] });
    await store.writeArtifact(runId, "model-usage.json", { runId, entries: [] });
    await store.writeTextArtifact(runId, "final-report.md", createPhaseTwoFinalReport({
        state,
        profile: args.profile,
        mode: "dry-run",
        repoContext,
        patchCount: 0,
        commandCount: 0,
        securityVerdict: "pass",
        modelUsageSummary: "0 model responses recorded"
    }));
    await store.writeState(state);
    const ledger = await writeLedgerManifest(args.cwd, runId);
    state.ledger = { status: "valid", manifestHash: ledger.manifestHash };
    await store.writeState(state);
    await writeLedgerManifest(args.cwd, runId);
    void createFinalReport;
    void runPath;
    return state;
}
function usageEntry(response) {
    return {
        agent: response.role,
        provider: response.provider,
        model: response.model,
        promptTokens: response.usage?.promptTokens ?? null,
        completionTokens: response.usage?.completionTokens ?? null,
        totalTokens: response.usage?.totalTokens ?? null
    };
}
function providerEnvErrors(config, profile) {
    const agentConfig = config.profiles[profile]?.agents;
    if (!agentConfig)
        return [`Profile ${profile} is not configured`];
    const providerNames = new Set(workflowAgentRoleIds
        .filter((agent) => agent !== "repo_scanner")
        .map((agent) => routeAgent(config, profile, agent).selected.provider));
    const errors = [];
    for (const providerName of providerNames) {
        const provider = config.providers[providerName];
        if (!provider) {
            errors.push(`Provider ${providerName} is not configured`);
        }
        else if ("api_key_env" in provider && !process.env[provider.api_key_env]) {
            errors.push(`Provider ${providerName} is missing env var ${provider.api_key_env}`);
        }
        else if (provider.type === "external-opencode") {
            errors.push("external-opencode runAgent is not enabled in Phase 2; use model listing only.");
        }
    }
    return errors;
}
export async function executePhaseTwoLiveWorkflow(args) {
    const envErrors = providerEnvErrors(args.config, args.profile);
    if (envErrors.length > 0) {
        throw new Error(envErrors.join("; "));
    }
    const store = new RunStore(args.cwd);
    const registry = createProviderRegistry(args.config);
    const runId = args.runId ?? createRunId();
    await store.createRunDirectory(runId);
    const state = createInitialState({
        runId,
        prompt: args.prompt,
        repoPath: args.cwd,
        artifactsPath: join(".vibecli", "runs", runId)
    });
    state.phase = 6;
    state.mode = "live";
    state.policy = args.policy ?? "company-grade";
    state.routingStrategy = routingStrategyForProfile(args.config, args.profile);
    state.status = "running";
    state.updatedAt = now();
    await store.writeTextArtifact(runId, "agent-events.jsonl", "");
    await store.writeInput(runId, {
        prompt: args.prompt,
        profile: args.profile,
        policy: state.policy,
        phase: 2,
        mode: "live",
        createdAt: state.createdAt
    });
    await store.writeArtifact(runId, "plan.json", createPlanArtifact(state));
    await store.writeSecurityBaseline(runId);
    await store.writeState(state);
    await loadPolicyProfile(args.cwd, state.policy).catch(() => undefined);
    const repoContext = await buildRunContext(args.cwd);
    await store.writeArtifact(runId, "repo-context.json", repoContext);
    const outputs = {};
    const usageEntries = [];
    const liveAgents = workflowAgentRoleIds.filter((id) => id !== "repo_scanner");
    const routingPlan = buildRoutingPlan({
        config: args.config,
        profile: args.profile,
        runId,
        agents: liveAgents,
        policy: state.policy
    });
    await store.writeArtifact(runId, "routing-plan.json", routingPlan);
    const initialBudget = await writeBudgetReport({
        cwd: args.cwd,
        runId,
        config: args.config,
        overrideMaxRunCostUsd: args.maxCostUsd
    });
    state.budget = {
        status: initialBudget.status,
        maxRunCostUsd: initialBudget.policy.maxRunCostUsd
    };
    const scannerOutput = {
        summary: `Local scanner detected ${repoContext.detectedFrameworks.join(", ")} with ${repoContext.sourceFilesCount} source files.`,
        detected_stack: repoContext.detectedFrameworks,
        package_manager: repoContext.packageManager,
        test_commands: Object.entries(repoContext.packageScripts)
            .filter(([name]) => name.includes("test"))
            .map(([name]) => `${repoContext.packageManager} ${name}`),
        build_commands: Object.entries(repoContext.packageScripts)
            .filter(([name]) => name.includes("build"))
            .map(([name]) => `${repoContext.packageManager} ${name}`),
        lint_commands: Object.entries(repoContext.packageScripts)
            .filter(([name]) => name.includes("lint"))
            .map(([name]) => `${repoContext.packageManager} ${name}`),
        important_files: repoContext.importantConfigFiles,
        risk_notes: repoContext.hasEnvExample ? [] : ["No .env.example file detected."]
    };
    outputs.repo_scanner = scannerOutput;
    await store.writeArtifact(runId, "agent-outputs/repo_scanner.json", scannerOutput);
    state.agents.repo_scanner.status = "passed";
    state.agents.repo_scanner.artifacts.push("agent-outputs/repo_scanner.json");
    state.agents.repo_scanner.summary = "Local deterministic repo context collected.";
    state.gates.repo_scanner.status = "passed";
    state.gates.repo_scanner.message = "Repository context artifact is available.";
    for (const agent of liveAgents) {
        const started = event(agent, "agent_started", `${agent} started`);
        state.currentAgent = agent;
        state.events.push(started);
        state.agents[agent].status = "running";
        state.agents[agent].startedAt = started.timestamp;
        state.gates[agent].status = "running";
        state.updatedAt = now();
        await store.appendEvent(runId, started);
        await store.writeState(state);
        const route = routeAgent(args.config, args.profile, agent);
        const provider = registry.get(route.selected.provider);
        if (!provider)
            throw new Error(`Provider ${route.selected.provider} is not configured`);
        const result = await executeJsonAgent({
            provider,
            providerName: route.selected.provider,
            model: route.selected.model,
            role: agent,
            stream: Boolean(args.stream),
            onStreamEvent: async (streamEvent) => {
                await store.appendEvent(runId, {
                    timestamp: now(),
                    agent,
                    type: `stream_${streamEvent.type}`,
                    message: streamEvent.type === "delta"
                        ? streamEvent.content
                        : streamEvent.type === "error"
                            ? streamEvent.message
                            : streamEvent.type
                });
            },
            messages: buildAgentMessages({
                role: agent,
                prompt: args.prompt,
                repoContext,
                priorOutputs: outputs
            })
        });
        if (result.response)
            usageEntries.push(usageEntry(result.response));
        const budgetReport = await writeBudgetReport({
            cwd: args.cwd,
            runId,
            config: args.config,
            usage: usageEntries,
            overrideMaxRunCostUsd: args.maxCostUsd
        });
        state.budget = {
            status: budgetReport.status,
            maxRunCostUsd: budgetReport.policy.maxRunCostUsd
        };
        if (budgetReport.status === "exceeded" || budgetReport.status === "blocked") {
            state.status = "failed";
            state.updatedAt = now();
            await store.writeState(state);
            await writeLedgerManifest(args.cwd, runId);
            return state;
        }
        if (result.ok) {
            outputs[agent] = result.output;
            await store.writeArtifact(runId, `agent-outputs/${agent}.json`, result.output);
            state.agents[agent].status = "passed";
            state.agents[agent].artifacts.push(`agent-outputs/${agent}.json`);
            state.agents[agent].summary = `${agentRoles[agent].displayName} returned valid JSON.`;
            state.gates[agent].status = "passed";
            state.gates[agent].message = agentRoles[agent].gateCondition;
            const passed = event(agent, "agent_passed", `${agent} passed gate`);
            state.events.push(passed);
            await store.appendEvent(runId, passed);
        }
        else {
            await store.writeTextArtifact(runId, `agent-outputs/${agent}.invalid.txt`, result.raw);
            await store.writeArtifact(runId, `agent-outputs/${agent}.validation-error.json`, result.validation);
            state.agents[agent].status = "failed";
            state.agents[agent].artifacts.push(`agent-outputs/${agent}.invalid.txt`);
            state.agents[agent].summary = "Agent returned invalid JSON after schema correction retry.";
            state.gates[agent].status = "failed";
            state.gates[agent].message = "Invalid JSON agent output.";
            state.status = "failed";
            state.updatedAt = now();
            await store.writeArtifact(runId, "model-usage.json", { runId, entries: usageEntries });
            await store.writeState(state);
            return state;
        }
        state.agents[agent].completedAt = now();
        state.updatedAt = now();
        await store.writeState(state);
    }
    const patchManifest = await writePatchArtifacts({
        store,
        runId,
        createdAt: now(),
        outputs
    });
    const commandReview = { recommended: collectCommandRecommendations(outputs) };
    await store.writeArtifact(runId, "command-review.json", commandReview);
    await store.writeArtifact(runId, "model-usage.json", { runId, entries: usageEntries });
    state.approval =
        patchManifest.patches.length > 0 ? { status: "pending" } : { status: "not_required" };
    state.status = patchManifest.patches.length > 0 ? "completed_with_pending_approval" : "completed";
    state.currentAgent = "release_manager";
    state.updatedAt = now();
    const securityOutput = outputs.security;
    const securityVerdict = typeof securityOutput === "object" && securityOutput !== null && "verdict" in securityOutput
        ? String(securityOutput.verdict)
        : "unknown";
    await store.writeTextArtifact(runId, "final-report.md", createPhaseTwoFinalReport({
        state,
        profile: args.profile,
        mode: "live",
        repoContext,
        patchCount: patchManifest.patches.length,
        commandCount: commandReview.recommended.length,
        securityVerdict,
        modelUsageSummary: `${usageEntries.length} model responses recorded`
    }));
    await store.writeState(state);
    const ledger = await writeLedgerManifest(args.cwd, runId);
    state.ledger = { status: "valid", manifestHash: ledger.manifestHash };
    await store.writeState(state);
    await writeLedgerManifest(args.cwd, runId);
    return state;
}
//# sourceMappingURL=workflow.js.map