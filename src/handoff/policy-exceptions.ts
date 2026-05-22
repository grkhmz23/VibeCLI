import { join } from "node:path";
import { pathExists, readJson } from "../utils/fs.js";
import { RunStore } from "../orchestrator/run-store.js";

export type PolicyException = {
  id: string;
  policy: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "requested" | "approved" | "rejected";
  reason: string;
  risk: string;
  mitigation: string;
  requestedBy: string | null;
  approvedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PolicyExceptionsFile = {
  runId: string;
  createdAt: string;
  exceptions: PolicyException[];
};

export async function readPolicyExceptions(
  cwd: string,
  runId: string
): Promise<PolicyExceptionsFile> {
  const path = join(new RunStore(cwd).runPath(runId), "policy-exceptions.json");
  if (!pathExists(path)) return { runId, createdAt: new Date().toISOString(), exceptions: [] };
  return readJson<PolicyExceptionsFile>(path);
}

export function renderPolicyExceptions(value: PolicyExceptionsFile): string {
  return `# Policy Exceptions

${value.exceptions.length ? value.exceptions.map((item) => `- ${item.id}: ${item.status} ${item.severity} ${item.policy} - ${item.reason}`).join("\n") : "No policy exceptions recorded."}
`;
}

export async function writePolicyExceptions(
  cwd: string,
  value: PolicyExceptionsFile
): Promise<void> {
  const store = new RunStore(cwd);
  await store.writeArtifact(value.runId, "policy-exceptions.json", value);
  await store.writeTextArtifact(
    value.runId,
    "handoff/POLICY_EXCEPTIONS.md",
    renderPolicyExceptions(value)
  );
}
