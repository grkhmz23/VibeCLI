import { join } from "node:path";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { RunStore } from "../orchestrator/run-store.js";
import { pathExists, readJson } from "../utils/fs.js";
import { generateAuditEvidenceMap } from "./evidence-mapper.js";
import { updateAuditState } from "./state.js";
import type { AuditCoverageReport, AuditEvidenceMap } from "./types.js";

export async function generateAuditCoverage(
  cwd: string,
  runId: string,
  options: { schema?: string } = {}
): Promise<AuditCoverageReport> {
  const store = new RunStore(cwd);
  const mapPath = join(store.runPath(runId), "audit", "AUDIT_EVIDENCE_MAP.json");
  const map = pathExists(mapPath)
    ? await readJson<AuditEvidenceMap>(mapPath)
    : await generateAuditEvidenceMap(cwd, runId, options);
  const required = map.controls.filter((control) => control.required);
  const requiredSatisfied = required.filter((control) => control.status === "satisfied").length;
  const categories = [...new Set(map.controls.map((control) => control.category))].sort();
  const report: AuditCoverageReport = {
    runId,
    createdAt: new Date().toISOString(),
    schema: map.schema.name,
    coverage: {
      percentSatisfied: percent(requiredSatisfied, required.length),
      requiredSatisfied,
      requiredTotal: required.length,
      criticalMissing: map.summary.criticalMissing,
      highMissing: map.summary.highMissing
    },
    byCategory: categories.map((category) => {
      const controls = map.controls.filter((control) => control.category === category);
      const satisfied = controls.filter((control) => control.status === "satisfied").length;
      return {
        category,
        total: controls.length,
        satisfied,
        partial: controls.filter((control) => control.status === "partial").length,
        missing: controls.filter((control) => control.status === "missing").length,
        percentSatisfied: percent(satisfied, controls.length)
      };
    }),
    blockingGaps: map.controls
      .filter(
        (control) =>
          control.required &&
          control.status !== "satisfied" &&
          ["critical", "high"].includes(control.severity)
      )
      .map((control) => ({
        controlId: control.id,
        severity: control.severity,
        title: control.title,
        gaps: control.gaps,
        recommendations: control.recommendations
      })),
    nextActions: [
      "Review missing required evidence.",
      "Run vibe audit-gaps <run-id> for prioritized actions."
    ],
    disclaimer: map.disclaimer
  };
  await store.writeArtifact(runId, "audit/AUDIT_COVERAGE.json", report);
  await store.writeTextArtifact(runId, "audit/AUDIT_COVERAGE.md", renderCoverage(report));
  await updateAuditState(store, runId, (audit) => {
    audit.coverage = {
      status: "generated",
      percentSatisfied: report.coverage.percentSatisfied,
      criticalMissing: report.coverage.criticalMissing,
      highMissing: report.coverage.highMissing
    };
  });
  await writeLedgerManifest(cwd, runId);
  return report;
}

function percent(count: number, total: number): number {
  return total === 0 ? 0 : Math.round((count / total) * 10000) / 100;
}

function renderCoverage(report: AuditCoverageReport): string {
  return `# Audit Coverage

Schema: ${report.schema}

${report.disclaimer}

Required coverage: ${report.coverage.percentSatisfied}%
Critical missing: ${report.coverage.criticalMissing}
High missing: ${report.coverage.highMissing}

Blocking gaps:
${report.blockingGaps.map((gap) => `- ${gap.controlId}: ${gap.title}`).join("\n") || "- none"}
`;
}
