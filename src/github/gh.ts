import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function runGh(
  args: string[],
  cwd: string
): Promise<{ stdout: string; stderr: string }> {
  return execFileAsync("gh", args, { cwd, timeout: 60_000 });
}

export async function githubDoctor(cwd: string): Promise<{
  ghInstalled: boolean;
  authenticated: boolean;
  remote: string | null;
  branch: string | null;
  messages: string[];
}> {
  const messages: string[] = [];
  const ghInstalled = await runGh(["--version"], cwd)
    .then(() => true)
    .catch(() => false);
  const authenticated = ghInstalled
    ? await runGh(["auth", "status"], cwd)
        .then(() => true)
        .catch(() => false)
    : false;
  const remote = await execFileAsync("git", ["remote", "get-url", "origin"], { cwd })
    .then(({ stdout }) => stdout.trim() || null)
    .catch(() => null);
  const branch = await execFileAsync("git", ["branch", "--show-current"], { cwd })
    .then(({ stdout }) => stdout.trim() || null)
    .catch(() => null);
  if (!ghInstalled) messages.push("gh is not installed or not on PATH.");
  if (ghInstalled && !authenticated) messages.push("gh is installed but not authenticated.");
  if (!remote) messages.push("No origin remote detected.");
  return { ghInstalled, authenticated, remote, branch, messages };
}
