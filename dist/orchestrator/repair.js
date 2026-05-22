import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { implementationAgentOutputSchema } from "../agents/contracts.js";
import { buildAgentMessages, executeJsonAgent } from "../agents/executor.js";
import { loadConfig } from "../config/config.js";
import { createProviderRegistry } from "../providers/registry.js";
import { collectCommandRecommendations } from "../tools/command-policy.js";
import { validateUnifiedDiff } from "../patch-engine/validator.js";
import { routeAgent } from "../routing/router.js";
import { readPatchManifest } from "./diff.js";
import { buildRepairPlan } from "./repair-planner.js";
import { RunStore } from "./run-store.js";
async function hasFailedGate(store, runId) {
    const state = await store.readState(runId);
    return (state.verification?.status === "failed" ||
        state.scanners?.builtinStatus === "failed" ||
        state.scanners?.externalStatus === "failed" ||
        state.apply?.status === "failed");
}
export async function repairRun(cwd, runId, options) {
    const store = new RunStore(cwd);
    const config = await loadConfig(cwd);
    const state = await store.readState(runId);
    if (!(await hasFailedGate(store, runId))) {
        state.repair = { status: "not_required", cyclesUsed: state.repair?.cyclesUsed ?? 0 };
        await store.writeState(state);
        return {
            runId,
            status: "not_required",
            cycle: null,
            message: "No failed gate found. Repair is not required."
        };
    }
    const cyclesUsed = state.repair?.cyclesUsed ?? 0;
    if (cyclesUsed >= config.budget.max_repair_cycles_per_gate) {
        state.repair = { status: "max_cycles_reached", cyclesUsed };
        await store.writeState(state);
        return {
            runId,
            status: "max_cycles_reached",
            cycle: null,
            message: "Maximum repair cycles reached."
        };
    }
    if (options.dryRun) {
        return {
            runId,
            status: "proposed",
            cycle: cyclesUsed + 1,
            message: "Repair is eligible. Dry-run did not call provider."
        };
    }
    if (!options.live || options.confirm !== `REPAIR ${runId}`) {
        throw new Error(`Refusing repair without live mode and exact confirmation: REPAIR ${runId}`);
    }
    const profile = config.default_profile;
    const fixerConfig = config.profiles[profile]?.agents.fixer;
    if (!fixerConfig)
        throw new Error("Fixer Agent is not configured");
    const cycle = cyclesUsed + 1;
    const repairPlan = await buildRepairPlan({ cwd, runId, config, profile, cycle });
    const route = routeAgent(config, profile, "fixer");
    const provider = createProviderRegistry(config).get(route.selected.provider);
    if (!provider)
        throw new Error(`Provider ${route.selected.provider} is not configured`);
    const cyclePath = join(store.runPath(runId), "repair-cycles", String(cycle));
    await mkdir(cyclePath, { recursive: true });
    const repairInput = {
        runId,
        prompt: state.prompt,
        verification: await readFile(join(store.runPath(runId), "verification-results.json"), "utf8").catch(() => ""),
        scanners: await readFile(join(store.runPath(runId), "scanner-results.json"), "utf8").catch(() => ""),
        apply: state.apply
    };
    await writeFile(join(cyclePath, "repair-input.json"), JSON.stringify(repairInput, null, 2), "utf8");
    const result = await executeJsonAgent({
        provider,
        providerName: repairPlan.selectedFixer.provider,
        model: repairPlan.selectedFixer.model,
        role: "fixer",
        messages: buildAgentMessages({
            role: "fixer",
            prompt: state.prompt,
            repoContext: repairInput,
            priorOutputs: {}
        })
    });
    if (!result.ok) {
        state.repair = { status: "failed", cyclesUsed, latestCycle: cycle };
        await store.writeState(state);
        return { runId, status: "failed", cycle, message: "Fixer Agent returned invalid output." };
    }
    const fixerOutput = implementationAgentOutputSchema.parse(result.output);
    await writeFile(join(cyclePath, "fixer-output.json"), JSON.stringify(fixerOutput, null, 2), "utf8");
    const diff = fixerOutput.patches.map((patch) => patch.unified_diff).join("\n\n");
    await writeFile(join(cyclePath, "repair.patch"), diff, "utf8");
    const validation = await validateUnifiedDiff({ repoRoot: cwd, diff });
    await writeFile(join(cyclePath, "patch-validation.json"), JSON.stringify({ runId, cycle, ok: validation.every((entry) => entry.ok), patches: validation }, null, 2), "utf8");
    await writeFile(join(cyclePath, "command-review.json"), JSON.stringify({ recommended: collectCommandRecommendations({ fixer: fixerOutput }) }, null, 2), "utf8");
    const manifest = await readPatchManifest(store, runId);
    const entries = fixerOutput.patches.map((patch) => ({
        agent: "fixer",
        path: patch.path,
        operation: patch.operation,
        artifactPath: `repair-cycles/${cycle}/repair.patch`,
        rationale: patch.rationale,
        applied: false,
        repairCycle: cycle
    }));
    manifest.patches.push(...entries);
    await store.writeArtifact(runId, "patches/manifest.json", manifest);
    state.repair = { status: "proposed", cyclesUsed: cycle, latestCycle: cycle };
    await store.writeState(state);
    return {
        runId,
        status: "proposed",
        cycle,
        message: "Fixer Agent proposed repair patches. Review and apply manually."
    };
}
//# sourceMappingURL=repair.js.map