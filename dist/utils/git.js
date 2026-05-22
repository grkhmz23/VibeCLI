import { execFile } from "node:child_process";
import { promisify } from "node:util";
const execFileAsync = promisify(execFile);
export async function hasGit() {
    try {
        await execFileAsync("git", ["--version"]);
        return true;
    }
    catch {
        return false;
    }
}
export async function isGitRepo(cwd) {
    try {
        const { stdout } = await execFileAsync("git", ["rev-parse", "--is-inside-work-tree"], { cwd });
        return stdout.trim() === "true";
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=git.js.map