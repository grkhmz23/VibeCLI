import { runPackageInstallCheck } from "../beta/package-install.js";
export function registerPackageInstallCheckCommand(program) {
    program
        .command("package-install-check")
        .option("--json", "print JSON")
        .description("Run local package tarball install readiness checks without publishing")
        .action(async (options) => {
        const result = await runPackageInstallCheck(process.cwd());
        console.log(options.json
            ? JSON.stringify(result, null, 2)
            : `Package install check: ${result.status} (${result.errors.length} errors, ${result.warnings.length} warnings)`);
    });
}
//# sourceMappingURL=package-install-check.js.map