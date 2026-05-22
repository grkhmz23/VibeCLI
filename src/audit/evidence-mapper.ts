import { writeLedgerManifest } from "../ledger/manifest.js";
import { RunStore } from "../orchestrator/run-store.js";
import { loadAuditConfig } from "./config.js";
import { evaluateControl } from "./control-evaluator.js";
import { collectAuditEvidence } from "./evidence-sources.js";
import { loadAuditSchema } from "./schema-loader.js";
import { updateAuditState } from "./state.js";
import type { AuditEvidenceMap, AuditEvidenceRef, AuditEvidenceSourceName } from "./types.js";

export async function generateAuditEvidenceMap(
  cwd: string,
  runId: string,
  options: { schema?: string } = {}
): Promise<AuditEvidenceMap> {
  const config = await loadAuditConfig(cwd);
  const schema = await loadAuditSchema(cwd, options.schema ?? config.default_schema);
  const evidenceBySource = new Map<string, AuditEvidenceRef[]>();
  const sources = [
    ...new Set(schema.controls.flatMap((control) => control.evidenceSources))
  ] as AuditEvidenceSourceName[];
  for (const source of sources) {
    evidenceBySource.set(source, await collectAuditEvidence(cwd, runId, source));
  }
  const controls = schema.controls.map((control) => evaluateControl(control, evidenceBySource));
  const summary = {
    totalControls: controls.length,
    satisfied: controls.filter((control) => control.status === "satisfied").length,
    partial: controls.filter((control) => control.status === "partial").length,
    missing: controls.filter((control) => control.status === "missing").length,
    notApplicable: controls.filter((control) => control.status === "not_applicable").length,
    unknown: controls.filter((control) => control.status === "unknown").length,
    criticalMissing: controls.filter(
      (control) => control.status === "missing" && control.severity === "critical"
    ).length,
    highMissing: controls.filter(
      (control) => control.status === "missing" && control.severity === "high"
    ).length
  };
  const map: AuditEvidenceMap = {
    runId,
    createdAt: new Date().toISOString(),
    schema: { name: schema.name, title: schema.title, version: schema.version },
    disclaimer: schema.disclaimer,
    controls,
    summary,
    warnings: ["Audit mapping is read-only support evidence and does not certify compliance."]
  };
  const store = new RunStore(cwd);
  await store.writeArtifact(runId, "audit/AUDIT_EVIDENCE_MAP.json", map);
  await store.writeTextArtifact(runId, "audit/AUDIT_EVIDENCE_MAP.md", renderAuditMap(map));
  await updateAuditState(store, runId, (audit) => {
    audit.schema = { status: "validated", activeSchema: schema.name };
    audit.map = { status: "generated", generatedAt: map.createdAt };
  });
  await writeLedgerManifest(cwd, runId);
  return map;
}

function renderAuditMap(map: AuditEvidenceMap): string {
  return `# Audit Evidence Map

Schema: ${map.schema.name}

${map.disclaimer}

Summary:
- Total controls: ${map.summary.totalControls}
- Satisfied: ${map.summary.satisfied}
- Partial: ${map.summary.partial}
- Missing: ${map.summary.missing}
- Critical missing: ${map.summary.criticalMissing}
- High missing: ${map.summary.highMissing}

Controls:
${map.controls
  .map(
    (control) =>
      `- ${control.id} (${control.severity}, ${control.status}): ${control.title}${
        control.gaps.length ? `\n  Gaps: ${control.gaps.join("; ")}` : ""
      }`
  )
  .join("\n")}
`;
}
