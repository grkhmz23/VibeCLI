import { join } from "node:path";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { RunStore } from "../orchestrator/run-store.js";
import { pathExists, readJson } from "../utils/fs.js";
import { generateAuditEvidenceMap } from "./evidence-mapper.js";
import { updateAuditState } from "./state.js";
export async function generateAuditGaps(cwd, runId, options = {}) {
    const store = new RunStore(cwd);
    const mapPath = join(store.runPath(runId), "audit", "AUDIT_EVIDENCE_MAP.json");
    const map = pathExists(mapPath)
        ? await readJson(mapPath)
        : await generateAuditEvidenceMap(cwd, runId, options);
    const gaps = map.controls
        .filter((control) => control.status === "missing" || control.status === "partial")
        .map((control) => ({
        priority: priorityFor(control.severity, control.required, control.status),
        controlId: control.id,
        category: control.category,
        severity: control.severity,
        title: control.title,
        whyItMatters: "Missing release evidence weakens local audit support and reviewer confidence.",
        recommendedEvidence: control.gaps,
        recommendedVibeCommands: safeCommandsFor(control.category)
    }))
        .sort((left, right) => left.priority.localeCompare(right.priority));
    const summary = {
        p0: gaps.filter((gap) => gap.priority === "p0").length,
        p1: gaps.filter((gap) => gap.priority === "p1").length,
        p2: gaps.filter((gap) => gap.priority === "p2").length,
        p3: gaps.filter((gap) => gap.priority === "p3").length
    };
    const report = {
        runId,
        createdAt: new Date().toISOString(),
        schema: map.schema.name,
        gaps,
        summary,
        disclaimer: map.disclaimer
    };
    await store.writeArtifact(runId, "audit/AUDIT_GAPS.json", report);
    await store.writeTextArtifact(runId, "audit/AUDIT_GAPS.md", renderGaps(report));
    await updateAuditState(store, runId, (audit) => {
        audit.gaps = { status: "generated", p0: summary.p0, p1: summary.p1 };
    });
    await writeLedgerManifest(cwd, runId);
    return report;
}
function priorityFor(severity, required, status) {
    if (required && severity === "critical" && status === "missing")
        return "p0";
    if (required && severity === "high" && status === "missing")
        return "p1";
    if (required && (severity === "medium" || status === "partial"))
        return "p2";
    return "p3";
}
function safeCommandsFor(category) {
    const common = ["vibe ledger <run-id> --verify"];
    const map = {
        testing: ['vibe verify <run-id> --confirm "VERIFY <run-id>"'],
        security: ["vibe scan <run-id>"],
        secrets: ["vibe scan <run-id>"],
        "ci-cd": ["vibe ci <run-id>"],
        "release-governance": ["vibe release-readiness <run-id>"],
        provenance: ['vibe provenance <run-id> --sign --confirm "SIGN PROVENANCE <run-id>"'],
        "organization-approval": ["vibe org-approvals <run-id> --quorum"],
        retention: ["vibe retention <run-id>"]
    };
    return [...(map[category] ?? ["vibe audit-map <run-id>"]), ...common];
}
function renderGaps(report) {
    return `# Audit Gaps

Schema: ${report.schema}

${report.disclaimer}

Summary: P0 ${report.summary.p0}, P1 ${report.summary.p1}, P2 ${report.summary.p2}, P3 ${report.summary.p3}

${report.gaps
        .map((gap) => `- ${gap.priority.toUpperCase()} ${gap.controlId}: ${gap.title}\n  Commands: ${gap.recommendedVibeCommands.join("; ")}`)
        .join("\n")}
`;
}
//# sourceMappingURL=gaps.js.map