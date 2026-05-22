import type { Command } from "commander";
import {
  createBetaTrialPack,
  listBetaTrials,
  showBetaTrial,
  type BetaTrialTarget
} from "../beta/trial-pack.js";

export function registerBetaTrialCommand(program: Command): void {
  const command = program
    .command("beta-trial")
    .description("Create and inspect local beta trial packs");
  command
    .command("create")
    .option("--target <target>", "solo-developer, startup-team, agency, security-reviewer, custom")
    .option("--json", "print JSON")
    .action(async (options: { target?: BetaTrialTarget; json?: boolean }) => {
      const result = await createBetaTrialPack(process.cwd(), options.target);
      console.log(
        options.json
          ? JSON.stringify(result, null, 2)
          : `Beta trial created: ${result.trialId} (${result.targetUser})`
      );
    });
  command
    .command("list")
    .option("--json", "print JSON")
    .action(async (options: { json?: boolean }) => {
      const result = await listBetaTrials(process.cwd());
      console.log(
        options.json
          ? JSON.stringify(result, null, 2)
          : result.map((item) => item.trialId).join("\n")
      );
    });
  command
    .command("show <trial-id>")
    .option("--json", "print JSON")
    .action(async (trialId: string, options: { json?: boolean }) => {
      const result = await showBetaTrial(process.cwd(), trialId);
      console.log(
        options.json
          ? JSON.stringify(result, null, 2)
          : `Beta trial ${result.trialId}: ${result.targetUser}`
      );
    });
}
