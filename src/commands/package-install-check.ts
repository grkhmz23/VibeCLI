import type { Command } from "commander";
import { runPackageInstallCheck } from "../beta/package-install.js";

export function registerPackageInstallCheckCommand(program: Command): void {
  program
    .command("package-install-check")
    .option("--json", "print JSON")
    .description("Run local package tarball install readiness checks without publishing")
    .action(async (options: { json?: boolean }) => {
      const result = await runPackageInstallCheck(process.cwd());
      console.log(
        options.json
          ? JSON.stringify(result, null, 2)
          : `Package install check: ${result.status} (${result.errors.length} errors, ${result.warnings.length} warnings)`
      );
    });
}
