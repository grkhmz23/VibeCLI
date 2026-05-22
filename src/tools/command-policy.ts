export type CommandClassification = "allowed" | "requires_approval" | "denied";

export type CommandReviewEntry = {
  agent: string;
  command: string;
  classification: CommandClassification;
  reason: string;
};

const allowed = new Set([
  "git status --short",
  "git branch --show-current",
  "git rev-parse --show-toplevel",
  "node --version",
  "pnpm --version",
  "npm --version",
  "yarn --version",
  "bun --version",
  "ls",
  "pwd"
]);

const requiresApproval = new Set([
  "pnpm install",
  "npm install",
  "yarn install",
  "bun install",
  "pnpm test",
  "npm test",
  "pnpm build",
  "npm run build",
  "pnpm lint",
  "npm run lint"
]);

const deniedPatterns = [
  /\brm\s+-rf\b/,
  /^\s*sudo\b/,
  /\bchmod\s+-R\b/,
  /\bchown\s+-R\b/,
  /\bcurl\b.*\|\s*bash\b/,
  /\bwget\b.*\|\s*sh\b/,
  /\bgit\s+push\s+--force\b/,
  /\bnpm\s+publish\b/,
  /\bpnpm\s+publish\b/,
  /\b(drop|truncate|delete)\s+database\b/i,
  />+\s*\.env(\s|$|\.)/,
  /\b(printenv|env|set)\b/,
  /\b(OPENAI_API_KEY|ANTHROPIC_API_KEY|OPENROUTER_API_KEY|API_KEY|SECRET|TOKEN|PASSWORD)\b/
];

export function classifyCommand(command: string): {
  classification: CommandClassification;
  reason: string;
} {
  const normalized = command.trim().replace(/\s+/g, " ");
  if (deniedPatterns.some((pattern) => pattern.test(normalized))) {
    return { classification: "denied", reason: "Command is blocked by the Phase 2 denylist" };
  }
  if (allowed.has(normalized)) {
    return { classification: "allowed", reason: "Command is on the read-only allowlist" };
  }
  if (requiresApproval.has(normalized)) {
    return {
      classification: "requires_approval",
      reason: "Command changes dependencies or runs project code and requires approval"
    };
  }
  return {
    classification: "requires_approval",
    reason: "Command is not on the read-only allowlist"
  };
}

export function collectCommandRecommendations(
  outputs: Record<string, unknown>
): CommandReviewEntry[] {
  const entries: CommandReviewEntry[] = [];
  for (const [agent, output] of Object.entries(outputs)) {
    if (typeof output !== "object" || output === null || !("commands_recommended" in output))
      continue;
    const commands = output.commands_recommended;
    if (!Array.isArray(commands)) continue;
    for (const command of commands) {
      if (typeof command !== "string") continue;
      entries.push({ agent, command, ...classifyCommand(command) });
    }
  }
  return entries;
}
