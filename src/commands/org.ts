import type { Command } from "commander";
import { exportOrgPublicKey, initOrgKey, orgKeyStatus } from "../org/keyring.js";
import { initOrganization, listOrgReviewers, orgAuditSummary, orgStatus } from "../org/status.js";

export function registerOrgCommand(program: Command): void {
  const command = program.command("org").description("Manage local organization workflow");
  command
    .command("status")
    .option("--json", "print JSON")
    .action(async (options: { json?: boolean }) => {
      const status = await orgStatus(process.cwd());
      console.log(options.json ? JSON.stringify(status, null, 2) : JSON.stringify(status, null, 2));
    });
  command
    .command("init")
    .option("--confirm <confirm>", "exact confirmation")
    .option("--no-enable", "create directories without enabling organization workflow")
    .option("--force", "force reinitialization")
    .option("--create-key", "also create organization signing key")
    .action(
      async (options: {
        confirm?: string;
        enable?: boolean;
        force?: boolean;
        createKey?: boolean;
      }) => {
        console.log(
          JSON.stringify(
            await initOrganization(process.cwd(), {
              confirm: options.confirm,
              noEnable: options.enable === false,
              force: options.force,
              createKey: options.createKey
            }),
            null,
            2
          )
        );
      }
    );
  command
    .command("reviewers")
    .option("--json", "print JSON")
    .action(async (options: { json?: boolean }) => {
      const reviewers = await listOrgReviewers(process.cwd());
      console.log(
        options.json
          ? JSON.stringify(reviewers, null, 2)
          : reviewers.map((reviewer) => `${reviewer.id}\t${reviewer.roles.join(",")}`).join("\n")
      );
    });
  command
    .command("audit")
    .option("--verify", "verify audit chain")
    .option("--json", "print JSON")
    .action(async (options: { verify?: boolean; json?: boolean }) => {
      const result = await orgAuditSummary(process.cwd(), options.verify);
      console.log(options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2));
    });
  const key = command.command("key").description("Manage organization signing key");
  key
    .command("status")
    .option("--json", "print JSON")
    .action(async (options: { json?: boolean }) => {
      const status = await orgKeyStatus(process.cwd());
      console.log(options.json ? JSON.stringify(status, null, 2) : JSON.stringify(status, null, 2));
    });
  key
    .command("init")
    .option("--confirm <confirm>", "exact confirmation")
    .option("--rotate", "rotate existing key")
    .action(async (options: { confirm?: string; rotate?: boolean }) => {
      console.log(
        JSON.stringify(
          await initOrgKey(process.cwd(), {
            confirm: options.confirm,
            rotate: options.rotate
          }),
          null,
          2
        )
      );
    });
  key
    .command("export-public")
    .option("--json", "print JSON")
    .action(async () => {
      console.log(JSON.stringify(await exportOrgPublicKey(process.cwd()), null, 2));
    });
}
