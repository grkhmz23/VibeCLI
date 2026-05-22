import type { Command } from "commander";
import { RunStore } from "../orchestrator/run-store.js";
import { renderRunSummary } from "../terminal/render.js";
import { createTheme } from "../terminal/theme.js";
import { readDogfoodState } from "../dogfood/config.js";
import { readBetaState } from "../beta/config.js";

async function printStatus(runId?: string): Promise<void> {
  const store = new RunStore(process.cwd());
  const id = runId ?? (await store.latestRunId());
  if (!id) {
    console.log("No runs found.");
    return;
  }
  const state = await store.readState(id);
  console.log(renderRunSummary(state, createTheme()));
  const dogfood = await readDogfoodState(process.cwd());
  console.log(
    `Beta: verdict=${dogfood.latestBetaVerdict} dogfood=${dogfood.latestDogfoodRunId ?? "none"}`
  );
  const beta = await readBetaState(process.cwd());
  console.log(
    `Beta RC: verdict=${beta.latestBetaVerdict} blockers=${beta.blockers} warnings=${beta.warnings} accepted=${beta.acceptedWarnings}`
  );
}

async function watchStatus(runId?: string): Promise<void> {
  console.log("Watching run state. Press Ctrl+C to stop.");
  let stopped = false;
  const stop = (): void => {
    stopped = true;
  };
  process.once("SIGINT", stop);
  while (!stopped) {
    await printStatus(runId);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  process.off("SIGINT", stop);
}

export function registerStatusCommand(program: Command): void {
  program
    .command("status")
    .argument("[run-id]", "run id")
    .option("--watch", "watch run status")
    .description("Show latest run summary")
    .action(async (runId: string | undefined, options: { watch?: boolean }) => {
      if (options.watch) {
        await watchStatus(runId);
        return;
      }
      await printStatus(runId);
    });
}
