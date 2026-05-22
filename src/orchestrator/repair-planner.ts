import { agentRoles } from "../agents/roles.js";
import type { VibeConfig } from "../config/schema.js";
import { routeAgent } from "../routing/router.js";
import { RunStore } from "./run-store.js";
import type { RunState } from "./state.js";

export type RepairPlan = {
  runId: string;
  createdAt: string;
  cycle: number;
  failureSources: Array<
    "verification" | "scanner" | "security" | "patch_validation" | "provider_output"
  >;
  selectedFixer: {
    provider: string;
    model: string;
    reason: string;
  };
  fallbackFixers: Array<{ provider: string; model: string; available: boolean; reason: string }>;
  budgetStatus: string;
  strategyNotes: string[];
};

function failureSources(state: RunState): RepairPlan["failureSources"] {
  const sources: RepairPlan["failureSources"] = [];
  if (state.verification?.status === "failed") sources.push("verification");
  if (state.scanners?.builtinStatus === "failed" || state.scanners?.externalStatus === "failed")
    sources.push("scanner");
  if (state.gates.security?.status === "failed") sources.push("security");
  if (state.apply?.status === "failed") sources.push("patch_validation");
  if (Object.values(state.agents).some((agent) => agent.summary?.includes("invalid JSON"))) {
    sources.push("provider_output");
  }
  return sources;
}

export async function buildRepairPlan(args: {
  cwd: string;
  runId: string;
  config: VibeConfig;
  profile: string;
  cycle: number;
  write?: boolean;
}): Promise<RepairPlan> {
  const store = new RunStore(args.cwd);
  const state = await store.readState(args.runId);
  const route = routeAgent(args.config, args.profile, "fixer");
  const sources = failureSources(state);
  const notes = [
    sources.includes("security")
      ? "Security or scanner failure detected; selected Fixer Agent route may prefer stronger/security-capable fallbacks."
      : `Using ${agentRoles.fixer.displayName} routing for repair proposals.`,
    sources.includes("provider_output")
      ? "Previous provider output failed validation; configured fallbacks should be reviewed."
      : "No provider-output failure detected."
  ];
  const plan: RepairPlan = {
    runId: args.runId,
    createdAt: new Date().toISOString(),
    cycle: args.cycle,
    failureSources: sources,
    selectedFixer: {
      provider: route.selected.provider,
      model: route.selected.model,
      reason: route.selected.reason
    },
    fallbackFixers: route.fallbacks.map((fallback) => ({
      provider: fallback.provider,
      model: fallback.model,
      available: fallback.available,
      reason: fallback.reason
    })),
    budgetStatus: state.budget?.status ?? "unknown",
    strategyNotes: notes
  };
  if (args.write !== false) await store.writeArtifact(args.runId, "repair-plan.json", plan);
  return plan;
}
