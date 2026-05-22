import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { sha256File } from "../ledger/hash.js";
import { RunStore } from "../orchestrator/run-store.js";
import { redactReleaseText } from "../release/redaction.js";
import { pathExists } from "../utils/fs.js";
const sourcePaths = {
    ledger: ["ledger-manifest.json"],
    "security-policy": ["security-baseline.json"],
    "scanner-results": ["scanner-results.json"],
    "external-scanner-results": ["external-scanner-results.json"],
    "verification-results": ["verification-results.json"],
    "ci-status": ["release/ci-status.json", "release/CI_STATUS.md"],
    "deployment-readiness": ["release/deployment-readiness.json", "release/DEPLOYMENT_READINESS.md"],
    "release-readiness": ["release/release-readiness.json", "release/RELEASE_READINESS.md"],
    provenance: ["provenance/provenance-statement.json", "provenance/provenance-envelope.json"],
    evidence: ["evidence/EVIDENCE_MANIFEST.json"],
    "remote-attestation": [
        "remote-attestation/ATTESTATION_EXPORT.json",
        "remote-attestation/REMOTE_SUBMISSION_RECEIPT.json"
    ],
    transparency: ["remote-attestation/TRANSPARENCY_ENTRY.json"],
    "registry-metadata": ["remote-attestation/REGISTRY_METADATA.json"],
    "organization-policy": [],
    "organization-approval": ["org/APPROVAL_MATRIX.json", "org/MULTI_REVIEWER_APPROVALS.md"],
    retention: ["org/RETENTION_PLAN.json", "org/RETENTION_MARKER.json"],
    "organization-audit": ["org/ORG_AUDIT_REPORT.json"],
    handoff: ["handoff/HANDOFF_SUMMARY.json", "handoff/HANDOFF.md"],
    "release-packet": ["release/RELEASE_PACKET.md", "release/RELEASE_SUMMARY.json"],
    "git-lifecycle": ["git/repository-lifecycle.json"],
    "reviewer-feedback": ["reviewer-feedback.json", "github-feedback.json"],
    "merge-readiness": ["git/merge-readiness.json", "git/MERGE_READINESS.md"]
};
export async function collectAuditEvidence(cwd, runId, source) {
    const store = new RunStore(cwd);
    const runPath = store.runPath(runId);
    const paths = source === "organization-policy"
        ? [join(cwd, ".vibecli/org/policy-bundles/latest/ORG_POLICY_BUNDLE.json")]
        : sourcePaths[source].map((path) => join(runPath, path));
    const evidence = [];
    for (const fullPath of paths) {
        const rel = fullPath.startsWith(runPath)
            ? fullPath.slice(runPath.length + 1).replace(/\\/g, "/")
            : fullPath.slice(cwd.length + 1).replace(/\\/g, "/");
        if (isForbidden(rel) || !pathExists(fullPath))
            continue;
        const hash = await sha256File(fullPath);
        const content = await readFile(fullPath, "utf8").catch(() => "");
        evidence.push({
            source,
            path: rel,
            sha256: hash.sha256,
            summary: summarizeEvidence(rel, content),
            redacted: true
        });
    }
    return evidence;
}
function summarizeEvidence(path, content) {
    const firstLine = redactReleaseText(content, 600)
        .split("\n")
        .find((line) => line.trim());
    return `${path}: ${firstLine?.trim() ?? "artifact present"}`;
}
function isForbidden(path) {
    return (path.includes(".vibecli/keys") ||
        path.includes(".vibecli/org/keys") ||
        path.endsWith(".private.pem") ||
        path.includes(".env") ||
        path.includes("agent-outputs"));
}
//# sourceMappingURL=evidence-sources.js.map