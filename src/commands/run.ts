import type { Command } from "commander";
import { loadConfig } from "../config/config.js";
import { executePhaseOneWorkflow, executePhaseTwoLiveWorkflow } from "../orchestrator/workflow.js";

export function registerRunCommand(program: Command): void {
  program
    .command("run")
    .argument("<prompt>", "delivery prompt")
    .description("Create a VibeCLI orchestration run")
    .option("--live", "call configured providers for live agent execution")
    .option("--stream", "stream live agent events")
    .option("--profile <profile>", "profile name")
    .option("--policy <policy>", "policy profile name")
    .option(
      "--max-cost-usd <amount>",
      "Phase 2 tracking only; exact provider billing is not implemented"
    )
    .option("--execute-safe-commands", "reserved for future safe command execution")
    .action(
      async (
        prompt: string,
        options: {
          live?: boolean;
          stream?: boolean;
          profile?: string;
          policy?: string;
          maxCostUsd?: string;
          executeSafeCommands?: boolean;
        }
      ) => {
        const config = await loadConfig(process.cwd());
        const profile = options.profile ?? config.default_profile;
        const maxCostUsd = options.maxCostUsd ? Number.parseFloat(options.maxCostUsd) : undefined;
        console.log(
          options.live
            ? "Live mode may spend provider credits. Provider/model configuration will be used per Agent."
            : "Dry-run mode: no LLM/provider spend occurs."
        );
        const state = options.live
          ? await executePhaseTwoLiveWorkflow({
              cwd: process.cwd(),
              prompt,
              profile,
              config,
              stream: Boolean(options.stream),
              policy: options.policy,
              maxCostUsd
            })
          : await executePhaseOneWorkflow({
              cwd: process.cwd(),
              prompt,
              profile,
              config,
              policy: options.policy,
              maxCostUsd
            });
        console.log(`Run ${state.runId} completed with status ${state.status}`);
        if (options.executeSafeCommands) {
          console.log(
            "Safe command execution is reserved; no LLM-recommended commands were executed."
          );
        }
        if (options.maxCostUsd) {
          console.log(`Max cost tracking requested: ${options.maxCostUsd} USD`);
        }
      }
    );
}
