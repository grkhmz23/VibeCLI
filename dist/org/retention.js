import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { loadConfig } from "../config/config.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { RunStore } from "../orchestrator/run-store.js";
import { pathExists, readJson } from "../utils/fs.js";
import { appendOrgAuditEvent } from "./audit-log.js";
import { updateOrganizationState } from "./state.js";
const evidenceClasses = [
    "run-ledger",
    "release",
    "handoff",
    "provenance",
    "evidence",
    "remote-attestation",
    "audit",
    "git-lifecycle"
];
export async function createRetentionPlan(cwd, runId, options = {}) {
    if (options.mark && options.confirm !== `MARK RETENTION ${runId}`) {
        throw new Error(`Retention marking requires exact confirmation: MARK RETENTION ${runId}`);
    }
    const config = await loadConfig(cwd);
    const policyName = options.policy ?? config.organization.retention.default_policy;
    const policy = config.organization.retention.policies[policyName];
    if (!policy)
        throw new Error(`Retention policy ${policyName} is not configured.`);
    const createdAt = new Date();
    const retainUntil = policy.retention_days === null
        ? null
        : new Date(createdAt.getTime() + policy.retention_days * 24 * 60 * 60 * 1000).toISOString();
    const store = new RunStore(cwd);
    const runPath = store.runPath(runId);
    const classes = await Promise.all(evidenceClasses.map(async (evidenceClass) => ({
        class: evidenceClass,
        required: ["run-ledger", "release"].includes(evidenceClass),
        paths: await classPaths(runPath, evidenceClass),
        warnings: []
    })));
    const purgePreview = policy.legal_hold
        ? []
        : classes.flatMap((item) => item.paths.map((path) => ({
            path,
            eligibleAfter: retainUntil,
            reason: `Eligible after ${policyName} retention expires.`
        })));
    const plan = {
        runId,
        createdAt: createdAt.toISOString(),
        policy: policyName,
        retentionDays: policy.retention_days,
        legalHold: policy.legal_hold,
        exportMode: policy.export_mode,
        retainUntil,
        evidenceClasses: classes,
        purgePreview,
        warnings: options.purgePreview
            ? ["Purge preview only; Phase 12 does not delete evidence."]
            : [],
        nextActions: [`vibe evidence-export ${runId} --mode ${policy.export_mode}`]
    };
    await store.writeArtifact(runId, "org/RETENTION_PLAN.json", plan);
    await store.writeTextArtifact(runId, "org/RETENTION_PLAN.md", renderRetentionPlan(plan));
    if (options.mark) {
        await store.writeArtifact(runId, "org/RETENTION_MARKER.json", {
            runId,
            markedAt: new Date().toISOString(),
            policy: policyName,
            retainUntil,
            legalHold: policy.legal_hold
        });
        await appendOrgAuditEvent(cwd, {
            eventType: "org.retention.marked",
            actor: null,
            runId,
            summary: `Retention marked with policy ${policyName}.`,
            artifactHashes: [],
            redacted: true
        });
    }
    else {
        await appendOrgAuditEvent(cwd, {
            eventType: "org.retention.planned",
            actor: null,
            runId,
            summary: `Retention plan created with policy ${policyName}.`,
            artifactHashes: [],
            redacted: true
        }).catch(() => undefined);
    }
    await updateOrganizationState(store, runId, (org) => {
        org.retention = {
            status: options.mark ? "marked" : "planned",
            policy: policyName,
            retainUntil,
            legalHold: policy.legal_hold
        };
    });
    await writeLedgerManifest(cwd, runId);
    return plan;
}
export async function readRetentionPlan(cwd, runId) {
    const path = join(new RunStore(cwd).runPath(runId), "org", "RETENTION_PLAN.json");
    return pathExists(path) ? readJson(path) : null;
}
async function classPaths(root, evidenceClass) {
    const mapping = {
        "run-ledger": ["ledger-manifest.json", "state.json"],
        release: ["release"],
        handoff: ["handoff"],
        provenance: ["provenance"],
        evidence: ["evidence"],
        "remote-attestation": ["remote-attestation"],
        audit: ["org"],
        "git-lifecycle": ["git"]
    };
    const result = [];
    for (const item of mapping[evidenceClass] ?? []) {
        const fullPath = join(root, item);
        if (!pathExists(fullPath))
            continue;
        if (item.endsWith(".json"))
            result.push(item);
        else
            result.push(...(await collectRelative(fullPath, item)));
    }
    return result;
}
async function collectRelative(dir, prefix) {
    const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
    const files = [];
    for (const entry of entries) {
        const rel = join(prefix, entry.name).replace(/\\/g, "/");
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory())
            files.push(...(await collectRelative(fullPath, rel)));
        if (entry.isFile())
            files.push(rel);
    }
    return files;
}
function renderRetentionPlan(plan) {
    return `# Retention Plan

Policy: ${plan.policy}
Retention days: ${plan.retentionDays ?? "legal hold"}
Retain until: ${plan.retainUntil ?? "indefinite"}
Export mode: ${plan.exportMode}

Purge preview:
${plan.purgePreview.map((item) => `- ${item.path}: ${item.reason}`).join("\n") || "- none"}

Phase 12 does not delete evidence.
`;
}
//# sourceMappingURL=retention.js.map