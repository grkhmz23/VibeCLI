import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { loadConfig } from "../config/config.js";
import { scanRepoContext } from "../context/repo-scanner.js";
import { redactSecrets } from "../tools/shell.js";
import { RunStore } from "./run-store.js";

type VerifyName = "typecheck" | "lint" | "test" | "build";
export type VerificationResults = {
  runId: string;
  startedAt: string;
  finishedAt: string;
  status: "passed" | "failed" | "skipped";
  commands: Array<{
    name: VerifyName;
    command: string;
    status: "passed" | "failed" | "skipped";
    exitCode: number | null;
    durationMs: number;
    stdout: string;
    stderr: string;
    reason: string | null;
  }>;
};

const dangerous = [
  /rm\s+-rf/,
  /\bsudo\b/,
  /curl\b.*\|\s*bash/,
  /wget\b.*\|\s*sh/,
  /\bnpm\s+publish\b/,
  /\bpnpm\s+publish\b/,
  /git\s+push\s+--force/,
  /\b(printenv|env|set)\b/,
  /\becho\b.*(OPENAI_API_KEY|ANTHROPIC_API_KEY|OPENROUTER_API_KEY|SECRET|TOKEN|PASSWORD)/
];

function commandFor(manager: string, name: VerifyName): string {
  if (manager === "npm" && name === "test") return "npm test";
  if (manager === "npm") return `npm run ${name}`;
  if (manager === "yarn") return `yarn ${name}`;
  if (manager === "bun" && name === "test") return "bun test";
  if (manager === "bun") return `bun run ${name}`;
  return `pnpm ${name}`;
}

async function runCommand(
  command: string,
  cwd: string,
  timeoutMs: number
): Promise<{
  exitCode: number;
  stdout: string;
  stderr: string;
}> {
  const [binary, ...args] = command.split(" ");
  return new Promise((resolve) => {
    execFile(binary ?? "", args, { cwd, timeout: timeoutMs }, (error, stdout, stderr) => {
      const exitCode =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof error.code === "number"
          ? error.code
          : error
            ? 1
            : 0;
      resolve({ exitCode, stdout: redactSecrets(stdout), stderr: redactSecrets(stderr) });
    });
  });
}

export async function verifyRun(
  cwd: string,
  runId: string,
  options: {
    confirm?: string;
    names?: VerifyName[];
    timeoutMs?: number;
  }
): Promise<VerificationResults> {
  if (options.confirm !== `VERIFY ${runId}`) {
    throw new Error(`Refusing to verify without exact confirmation: VERIFY ${runId}`);
  }
  const startedAt = new Date().toISOString();
  const context = await scanRepoContext(cwd);
  const names = options.names?.length
    ? options.names
    : (["typecheck", "lint", "test", "build"] as VerifyName[]);
  const pkg = JSON.parse(await readFile(join(cwd, "package.json"), "utf8").catch(() => "{}")) as {
    scripts?: Record<string, string>;
  };
  const commands: VerificationResults["commands"] = [];
  for (const name of names) {
    const script = pkg.scripts?.[name];
    const command = commandFor(context.packageManager, name);
    const start = Date.now();
    if (!script) {
      commands.push({
        name,
        command,
        status: "skipped",
        exitCode: null,
        durationMs: 0,
        stdout: "",
        stderr: "",
        reason: "script missing"
      });
      continue;
    }
    if (dangerous.some((pattern) => pattern.test(script))) {
      commands.push({
        name,
        command,
        status: "skipped",
        exitCode: null,
        durationMs: 0,
        stdout: "",
        stderr: "",
        reason: "script blocked by safety policy"
      });
      continue;
    }
    const result = await runCommand(command, cwd, options.timeoutMs ?? 60_000);
    commands.push({
      name,
      command,
      status: result.exitCode === 0 ? "passed" : "failed",
      exitCode: result.exitCode,
      durationMs: Date.now() - start,
      stdout: result.stdout,
      stderr: result.stderr,
      reason: result.exitCode === 0 ? null : "command failed"
    });
  }
  const status: VerificationResults["status"] = commands.some(
    (command) => command.status === "failed"
  )
    ? "failed"
    : commands.every((command) => command.status === "skipped")
      ? "skipped"
      : "passed";
  const result: VerificationResults = {
    runId,
    startedAt,
    finishedAt: new Date().toISOString(),
    status,
    commands
  };
  const store = new RunStore(cwd);
  await store.writeArtifact(runId, "verification-results.json", result);
  const state = await store.readState(runId);
  state.verification = {
    status,
    verifiedAt: new Date().toISOString(),
    failedCommands: commands
      .filter((command) => command.status === "failed")
      .map((command) => command.name)
  };
  await store.writeState(state);
  void loadConfig;
  return result;
}
