import { execFile } from "node:child_process";
import { classifyCommand } from "./command-policy.js";

export type ShellResult = {
  command: string;
  status: "success" | "failed" | "skipped";
  exitCode: number | null;
  stdout: string;
  stderr: string;
  reason: string;
};

export function redactSecrets(output: string): string {
  return output
    .replace(
      /(OPENAI_API_KEY|ANTHROPIC_API_KEY|OPENROUTER_API_KEY|API_KEY|SECRET|TOKEN|PASSWORD)=\S+/g,
      "$1=[REDACTED]"
    )
    .replace(/\b[A-Za-z0-9+/=_-]{48,}\b/g, "[REDACTED]");
}

function execAllowed(
  binary: string,
  args: string[],
  cwd: string,
  timeoutMs: number
): Promise<ShellResult> {
  const command = [binary, ...args].join(" ");
  return new Promise((resolve) => {
    execFile(binary, args, { cwd, timeout: timeoutMs }, (error, stdout, stderr) => {
      const exitCode =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof error.code === "number"
          ? error.code
          : error
            ? 1
            : 0;
      resolve({
        command,
        status: exitCode === 0 ? "success" : "failed",
        exitCode,
        stdout: redactSecrets(stdout),
        stderr: redactSecrets(stderr),
        reason: exitCode === 0 ? "Command completed" : "Command failed"
      });
    });
  });
}

export async function executeAllowedCommand(command: string, cwd: string): Promise<string> {
  const classification = classifyCommand(command);
  if (classification.classification !== "allowed") {
    throw new Error(`Command is not allowed for automatic execution: ${command}`);
  }
  const [binary, ...args] = command.split(" ");
  if (!binary) throw new Error("Command cannot be empty");
  const result = await execAllowed(binary, args, cwd, 60_000);
  return `${result.stdout}${result.stderr}`;
}

export async function executeAllowedCommandDetailed(
  command: string,
  cwd: string,
  timeoutMs = 60_000
): Promise<ShellResult> {
  const classification = classifyCommand(command);
  if (classification.classification !== "allowed") {
    return {
      command,
      status: "skipped",
      exitCode: null,
      stdout: "",
      stderr: "",
      reason: `Skipped ${classification.classification} command: ${classification.reason}`
    };
  }
  const [binary, ...args] = command.trim().split(/\s+/);
  if (!binary) {
    return {
      command,
      status: "skipped",
      exitCode: null,
      stdout: "",
      stderr: "",
      reason: "Command is empty"
    };
  }
  return execAllowed(binary, args, cwd, timeoutMs);
}
