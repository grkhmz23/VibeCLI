import type { Command } from "commander";
import { tagRun } from "../release/tag.js";

export function registerTagCommand(program: Command): void {
  program
    .command("tag")
    .argument("<run-id>", "run id")
    .option("--create", "create local tag")
    .option("--delete-local", "delete local tag created for this run")
    .option("--confirm <confirm>", "exact confirmation")
    .option("--allow-dirty", "allow dirty worktree")
    .option("--allow-ledger-warning", "allow ledger warning")
    .option("--allow-no-release-packet", "allow missing release packet")
    .option("--allow-existing-preview", "reserved preview option")
    .description("Preview, create, or delete a local release tag")
    .action(
      async (
        runId: string,
        options: {
          create?: boolean;
          deleteLocal?: boolean;
          confirm?: string;
          allowDirty?: boolean;
          allowLedgerWarning?: boolean;
          allowNoReleasePacket?: boolean;
        }
      ) => {
        console.log(
          JSON.stringify(
            await tagRun(process.cwd(), runId, {
              create: options.create,
              deleteLocal: options.deleteLocal,
              confirm: options.confirm,
              allowDirty: options.allowDirty,
              allowLedgerWarning: options.allowLedgerWarning,
              allowNoReleasePacket: options.allowNoReleasePacket
            }),
            null,
            2
          )
        );
      }
    );
}
