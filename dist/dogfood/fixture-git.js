import { execFile } from "node:child_process";
import { promisify } from "node:util";
const execFileAsync = promisify(execFile);
export async function initFixtureGit(cwd) {
    try {
        await execFileAsync("git", ["init"], { cwd });
        await execFileAsync("git", ["config", "user.email", "dogfood@example.invalid"], { cwd });
        await execFileAsync("git", ["config", "user.name", "VibeCLI Dogfood"], { cwd });
        await execFileAsync("git", ["add", "."], { cwd });
        await execFileAsync("git", ["commit", "-m", "Initial dogfood fixture"], { cwd });
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=fixture-git.js.map