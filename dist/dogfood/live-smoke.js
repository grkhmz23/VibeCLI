import { join } from "node:path";
import { loadConfig } from "../config/config.js";
import { createProviderRegistry } from "../providers/registry.js";
import { buildRoutingPlan } from "../routing/router.js";
import { writeJson } from "../utils/fs.js";
import { updateDogfoodState } from "./config.js";
import { updateBetaState } from "../beta/config.js";
export async function previewLiveSmoke(cwd, options = {}) {
    const config = await loadConfig(cwd);
    const profile = options.profile ?? config.default_profile;
    const routes = buildRoutingPlan({
        config,
        profile,
        runId: "live-smoke-preview",
        agents: ["intake", "architect", "implementation", "test", "security", "release_manager"],
        policy: profile
    }).agents.map((agent) => ({
        agent: agent.agent,
        provider: agent.selectedProvider,
        model: agent.selectedModel
    }));
    const missingEnv = Object.entries(config.providers)
        .filter(([, provider]) => "api_key_env" in provider && !process.env[provider.api_key_env])
        .map(([, provider]) => ("api_key_env" in provider ? provider.api_key_env : "external"));
    return { providerCalls: false, profile, routes, missingEnv };
}
export async function runLiveSmoke(cwd, options) {
    if (options.confirm !== "RUN LIVE SMOKE") {
        throw new Error('Live provider smoke requires exact confirmation: "RUN LIVE SMOKE"');
    }
    const config = await loadConfig(cwd);
    const providerName = options.provider ?? Object.keys(config.providers)[0] ?? "";
    const providerConfig = config.providers[providerName];
    if (!providerConfig)
        throw new Error(`Provider ${providerName} is not configured`);
    if ("api_key_env" in providerConfig && !process.env[providerConfig.api_key_env]) {
        const result = liveResult(providerName, options.model ?? null, "failed", [
            `${providerConfig.api_key_env} is not set`
        ]);
        await writeLiveSmoke(cwd, result);
        return result;
    }
    const registry = createProviderRegistry(config);
    const provider = registry.get(providerName);
    if (!provider)
        throw new Error(`Provider ${providerName} is not registered`);
    if (!provider.runAgent)
        throw new Error(`Provider ${providerName} does not support live agent calls`);
    const model = options.model ?? "default";
    try {
        const response = await provider.runAgent({
            providerName,
            model,
            agentRole: "intake",
            messages: [
                { role: "user", content: 'Return JSON only: {"ok": true, "message": "live smoke"}' }
            ],
            temperature: 0,
            maxTokens: 64,
            responseFormat: "json"
        });
        JSON.parse(response.content);
        const result = {
            createdAt: new Date().toISOString(),
            provider: providerName,
            model,
            status: "passed",
            usage: {
                promptTokens: response.usage?.promptTokens ?? null,
                completionTokens: response.usage?.completionTokens ?? null,
                totalTokens: response.usage?.totalTokens ?? null
            },
            warnings: ["Live smoke may spend provider credits."],
            errors: []
        };
        await writeLiveSmoke(cwd, result);
        return result;
    }
    catch (error) {
        const result = liveResult(providerName, model, "failed", [
            error instanceof Error ? error.message : String(error)
        ]);
        await writeLiveSmoke(cwd, result);
        return result;
    }
}
export async function runLiveRcSmoke(cwd, options) {
    if (options.confirm !== "RUN LIVE RC SMOKE") {
        throw new Error('Live RC smoke requires exact confirmation: "RUN LIVE RC SMOKE"');
    }
    const config = await loadConfig(cwd);
    const profile = options.profile ?? config.default_profile;
    const routes = buildRoutingPlan({
        config,
        profile,
        runId: "live-rc-smoke",
        agents: ["intake"],
        policy: profile
    }).agents;
    const providers = [];
    for (const route of routes.slice(0, Math.min(1, config.budget.max_live_agents_per_run ?? 1))) {
        const providerConfig = config.providers[route.selectedProvider];
        if (providerConfig &&
            "api_key_env" in providerConfig &&
            !process.env[providerConfig.api_key_env]) {
            providers.push({
                provider: route.selectedProvider,
                model: route.selectedModel,
                status: "skipped",
                usage: { promptTokens: null, completionTokens: null, totalTokens: null },
                warnings: [`${providerConfig.api_key_env} is not set`],
                errors: []
            });
            continue;
        }
        const one = await runLiveSmoke(cwd, {
            provider: route.selectedProvider,
            model: route.selectedModel,
            confirm: "RUN LIVE SMOKE"
        });
        providers.push({
            provider: one.provider ?? route.selectedProvider,
            model: one.model,
            status: one.status,
            usage: one.usage,
            warnings: one.warnings,
            errors: one.errors
        });
    }
    const failures = providers.filter((provider) => provider.status === "failed");
    const passed = providers.some((provider) => provider.status === "passed");
    const result = {
        createdAt: new Date().toISOString(),
        status: failures.length ? "failed" : passed ? "passed" : "skipped",
        profile,
        providers,
        totalUsage: {
            totalTokens: providers.reduce((sum, provider) => {
                if (sum === null && provider.usage.totalTokens === null)
                    return null;
                return (sum ?? 0) + (provider.usage.totalTokens ?? 0);
            }, null)
        },
        warnings: ["Live RC smoke may spend provider credits and never modifies source."],
        errors: failures.flatMap((provider) => provider.errors)
    };
    const dir = join(cwd, ".vibecli", "beta", "reports");
    const jsonPath = join(dir, "LIVE_RC_SMOKE.json");
    await writeJson(jsonPath, result);
    await import("node:fs/promises").then((fs) => fs.writeFile(join(dir, "LIVE_RC_SMOKE.md"), `# Live RC Smoke\n\nStatus: ${result.status}\nProfile: ${profile}\nProviders: ${providers.length}\n`, "utf8"));
    await updateBetaState(cwd, { latestReports: { liveSmoke: jsonPath } });
    return result;
}
function liveResult(provider, model, status, errors) {
    return {
        createdAt: new Date().toISOString(),
        provider,
        model,
        status,
        usage: { promptTokens: null, completionTokens: null, totalTokens: null },
        warnings: [],
        errors
    };
}
async function writeLiveSmoke(cwd, result) {
    const dir = join(cwd, ".vibecli", "dogfood", "reports", "live-smoke");
    const jsonPath = join(dir, "LIVE_SMOKE.json");
    await writeJson(jsonPath, result);
    await import("node:fs/promises").then((fs) => fs.writeFile(join(dir, "LIVE_SMOKE.md"), `# Live Smoke\n\nStatus: ${result.status}\nProvider: ${result.provider ?? "none"}\nModel: ${result.model ?? "none"}\n`, "utf8"));
    await updateDogfoodState(cwd, { latestReports: { dogfood: jsonPath } });
}
//# sourceMappingURL=live-smoke.js.map