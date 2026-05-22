import { loadConfig } from "../config/config.js";
import { agentRoleIds } from "../agents/roles.js";
import { buildRoutingPlan, routeAgent } from "../routing/router.js";
import { routingStrategyForProfile } from "../routing/policy.js";
function isAgent(value) {
    return agentRoleIds.includes(value);
}
export function registerRouteCommand(program) {
    program
        .command("route")
        .description("Show routing config and selected provider/model routes")
        .option("--agent <agent>", "agent role")
        .option("--profile <name>", "profile name")
        .option("--policy <name>", "policy profile name")
        .option("--json", "print JSON")
        .action(async (options) => {
        const config = await loadConfig(process.cwd());
        const profile = options.profile ?? config.default_profile;
        if (options.agent) {
            if (!isAgent(options.agent))
                throw new Error(`Unknown agent ${options.agent}`);
            const route = routeAgent(config, profile, options.agent);
            if (options.json)
                console.log(JSON.stringify(route, null, 2));
            else {
                console.log(`${route.agent}: ${route.selected.provider}/${route.selected.model}`);
                console.log(`Reason: ${route.selected.reason}`);
                for (const fallback of route.fallbacks) {
                    console.log(`Fallback: ${fallback.provider}/${fallback.model} ${fallback.available ? "available" : "unavailable"} - ${fallback.reason}`);
                }
            }
            return;
        }
        const plan = buildRoutingPlan({
            config,
            profile,
            runId: "route-preview",
            agents: agentRoleIds.filter((agent) => config.profiles[profile]?.agents[agent]),
            policy: options.policy
        });
        if (options.json)
            console.log(JSON.stringify(plan, null, 2));
        else {
            console.log(`Profile: ${profile}`);
            console.log(`Strategy: ${routingStrategyForProfile(config, profile)}`);
            for (const agent of plan.agents) {
                console.log(`${agent.agent}: ${agent.selectedProvider}/${agent.selectedModel}`);
            }
        }
    });
}
//# sourceMappingURL=route.js.map