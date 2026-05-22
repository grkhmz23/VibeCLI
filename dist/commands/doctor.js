import { configPath, loadConfig } from "../config/config.js";
import { validateTeamConfig } from "../config/validator.js";
import { pathExists } from "../utils/fs.js";
import { hasGit, isGitRepo } from "../utils/git.js";
function printCheck(check) {
    console.log(`${check.ok ? "PASS" : "FAIL"} ${check.name}: ${check.message}`);
}
export function registerDoctorCommand(program) {
    program
        .command("doctor")
        .description("Check local VibeCLI environment")
        .action(async () => {
        const cwd = process.cwd();
        const checks = [];
        const major = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10);
        checks.push({
            name: "node",
            ok: major >= 20,
            critical: true,
            message: `Node ${process.versions.node}${major >= 20 ? "" : " (requires >=20)"}`
        });
        const git = await hasGit();
        checks.push({
            name: "git",
            ok: git,
            critical: true,
            message: git ? "git is available" : "git not found"
        });
        const repo = await isGitRepo(cwd);
        checks.push({
            name: "git repo",
            ok: repo,
            critical: false,
            message: repo ? "current directory is a git repo" : "current directory is not a git repo"
        });
        checks.push({
            name: "config",
            ok: pathExists(configPath),
            critical: false,
            message: pathExists(configPath) ? `${configPath} exists` : `${configPath} missing`
        });
        if (pathExists(configPath)) {
            const config = await loadConfig(cwd);
            const validation = await validateTeamConfig(cwd, config);
            checks.push({
                name: "config validation",
                ok: validation.ok,
                critical: false,
                message: validation.ok ? "team config checks passed" : validation.errors.join("; ")
            });
            for (const [name, provider] of Object.entries(config.providers)) {
                if ("api_key_env" in provider) {
                    checks.push({
                        name: `provider ${name}`,
                        ok: Boolean(process.env[provider.api_key_env]),
                        critical: false,
                        message: process.env[provider.api_key_env]
                            ? `${provider.api_key_env} is set`
                            : `${provider.api_key_env} is not set`
                    });
                }
            }
        }
        checks.forEach(printCheck);
        if (checks.some((check) => check.critical && !check.ok))
            process.exitCode = 1;
    });
}
//# sourceMappingURL=doctor.js.map