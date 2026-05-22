import type { Command } from "commander";
import { releaseBranchRun } from "../release/release-branch.js";

export function registerReleaseBranchCommand(program: Command): void {
  program
    .command("release-branch")
    .argument("<run-id>", "run id")
    .option("--create", "create local release branch")
    .option("--confirm <confirm>", "exact confirmation")
    .option("--allow-dirty", "allow dirty worktree")
    .option("--allow-blocked", "allow blocked release packet")
    .option("--channel <channel>", "target channel")
    .description("Preview or create a local release branch")
    .action(
      async (
        runId: string,
        options: {
          create?: boolean;
          confirm?: string;
          allowDirty?: boolean;
          allowBlocked?: boolean;
          channel?: string;
        }
      ) => {
        console.log(
          JSON.stringify(
            await releaseBranchRun(process.cwd(), runId, {
              create: options.create,
              confirm: options.confirm,
              allowDirty: options.allowDirty,
              allowBlocked: options.allowBlocked,
              channel: options.channel
            }),
            null,
            2
          )
        );
      }
    );
}
