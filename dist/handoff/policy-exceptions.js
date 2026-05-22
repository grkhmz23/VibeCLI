import { join } from "node:path";
import { pathExists, readJson } from "../utils/fs.js";
import { RunStore } from "../orchestrator/run-store.js";
export async function readPolicyExceptions(cwd, runId) {
    const path = join(new RunStore(cwd).runPath(runId), "policy-exceptions.json");
    if (!pathExists(path))
        return { runId, createdAt: new Date().toISOString(), exceptions: [] };
    return readJson(path);
}
export function renderPolicyExceptions(value) {
    return `# Policy Exceptions

${value.exceptions.length ? value.exceptions.map((item) => `- ${item.id}: ${item.status} ${item.severity} ${item.policy} - ${item.reason}`).join("\n") : "No policy exceptions recorded."}
`;
}
export async function writePolicyExceptions(cwd, value) {
    const store = new RunStore(cwd);
    await store.writeArtifact(value.runId, "policy-exceptions.json", value);
    await store.writeTextArtifact(value.runId, "handoff/POLICY_EXCEPTIONS.md", renderPolicyExceptions(value));
}
//# sourceMappingURL=policy-exceptions.js.map