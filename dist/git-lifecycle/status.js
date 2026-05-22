import { execFile } from "node:child_process";
import { promisify } from "node:util";
const execFileAsync = promisify(execFile);
export async function currentBranch(cwd) {
    return execFileAsync("git", ["branch", "--show-current"], { cwd })
        .then(({ stdout }) => stdout.trim() || null)
        .catch(() => null);
}
export async function isDirty(cwd) {
    return execFileAsync("git", ["status", "--short"], { cwd })
        .then(({ stdout }) => Boolean(stdout.trim()))
        .catch(() => false);
}
export async function branchExists(cwd, branch) {
    return execFileAsync("git", ["rev-parse", "--verify", "--quiet", branch], { cwd })
        .then(() => true)
        .catch(() => false);
}
export async function gitHead(cwd) {
    return execFileAsync("git", ["rev-parse", "HEAD"], { cwd })
        .then(({ stdout }) => stdout.trim())
        .catch(() => null);
}
export async function remoteOrigin(cwd) {
    return execFileAsync("git", ["remote", "get-url", "origin"], { cwd })
        .then(({ stdout }) => stdout.trim() || null)
        .catch(() => null);
}
//# sourceMappingURL=status.js.map