import type { Command } from "commander";
import {
  addRemoteTarget,
  disableRemoteTarget,
  doctorRemoteTargets,
  listRemoteTargets,
  removeRemoteTarget
} from "../remote-attestation/targets.js";

export function registerRemoteTargetsCommand(program: Command): void {
  const command = program
    .command("remote-targets")
    .description("Manage remote attestation targets");
  command
    .command("list")
    .option("--json", "print JSON")
    .action(async (options: { json?: boolean }) => {
      const targets = await listRemoteTargets(process.cwd());
      console.log(
        options.json
          ? JSON.stringify(targets, null, 2)
          : targets
              .map(
                (target) =>
                  `${target.name}\t${target.type}\t${target.host}\tenabled=${target.enabled}\ttoken_env=${target.tokenEnv ?? "none"}`
              )
              .join("\n") || "No remote attestation targets configured."
      );
    });
  command
    .command("doctor")
    .option("--ping", "ping targets with a safe HEAD request")
    .option("--confirm <confirm>", "exact confirmation for ping")
    .option("--json", "print JSON")
    .action(async (options: { ping?: boolean; confirm?: string; json?: boolean }) => {
      const results = await doctorRemoteTargets(process.cwd(), options);
      console.log(
        options.json
          ? JSON.stringify(results, null, 2)
          : results
              .map(
                (result) =>
                  `${result.ok ? "PASS" : "FAIL"} ${result.name}: env=${result.envPresent === null ? "none" : result.envPresent ? "present" : "missing"} ping=${result.pingStatus ?? "not_run"}`
              )
              .join("\n") || "No remote attestation targets configured."
      );
    });
  command
    .command("add")
    .argument("type", "target type")
    .requiredOption("--name <name>", "target name")
    .requiredOption("--url <url>", "target URL")
    .option("--token-env <env>", "token environment variable")
    .option("--replace", "replace existing target")
    .option("--confirm <confirm>", "exact confirmation")
    .action(
      async (
        type: string,
        options: {
          name: string;
          url: string;
          tokenEnv?: string;
          replace?: boolean;
          confirm?: string;
        }
      ) => {
        if (type !== "generic-http")
          throw new Error("Only generic-http targets are supported in Phase 11.");
        const target = await addRemoteTarget(process.cwd(), {
          name: options.name,
          url: options.url,
          tokenEnv: options.tokenEnv,
          replace: options.replace,
          confirm: options.confirm
        });
        console.log(JSON.stringify(target, null, 2));
      }
    );
  command
    .command("disable")
    .argument("<name>", "target name")
    .option("--confirm <confirm>", "exact confirmation")
    .action(async (name: string, options: { confirm?: string }) => {
      console.log(
        JSON.stringify(await disableRemoteTarget(process.cwd(), name, options.confirm), null, 2)
      );
    });
  command
    .command("remove")
    .argument("<name>", "target name")
    .option("--confirm <confirm>", "exact confirmation")
    .action(async (name: string, options: { confirm?: string }) => {
      console.log(
        JSON.stringify(await removeRemoteTarget(process.cwd(), name, options.confirm), null, 2)
      );
    });
}
