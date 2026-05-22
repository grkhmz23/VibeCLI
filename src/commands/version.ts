import type { Command } from "commander";
import { applyVersionPlan } from "../release/version-apply.js";
import { planVersion } from "../release/version.js";
import type { VersionBump } from "../release/types.js";

function validBump(value: string | undefined): VersionBump | undefined {
  if (!value) return undefined;
  if (["none", "patch", "minor", "major", "prerelease"].includes(value))
    return value as VersionBump;
  throw new Error(`Unsupported version bump: ${value}`);
}

export function registerVersionCommand(program: Command): void {
  program
    .command("version")
    .argument("<run-id>", "run id")
    .option("--bump <bump>", "none, patch, minor, major, or prerelease")
    .option("--preid <identifier>", "prerelease identifier")
    .option("--version <version>", "explicit planned version")
    .option("--allow-downgrade", "allow version downgrade")
    .option("--confirm-major <confirm>", "exact confirmation for major planning")
    .option("--apply", "apply existing version plan")
    .option("--confirm <confirm>", "exact confirmation")
    .option("--json", "print JSON")
    .description("Plan or apply a governed version bump")
    .action(
      async (
        runId: string,
        options: {
          bump?: string;
          preid?: string;
          version?: string;
          allowDowngrade?: boolean;
          confirmMajor?: string;
          apply?: boolean;
          confirm?: string;
          json?: boolean;
        }
      ) => {
        const result = options.apply
          ? await applyVersionPlan(process.cwd(), runId, { confirm: options.confirm })
          : await planVersion(process.cwd(), runId, {
              bump: validBump(options.bump),
              version: options.version,
              preid: options.preid,
              allowDowngrade: options.allowDowngrade,
              confirmMajor: options.confirmMajor
            });
        console.log(
          options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2)
        );
      }
    );
}
