import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { ensureDir, pathExists, readJson, writeJson } from "../utils/fs.js";
import { RunStore } from "../orchestrator/run-store.js";
import { defaultEvidenceLifecycleState } from "./state.js";
import type { EvidenceInventory, LegalHoldRecord } from "./types.js";

export type EvidenceCrossRunReport = {
  createdAt: string;
  runs: Array<{
    runId: string;
    createdAt: string | null;
    status: string | null;
    retentionPolicy: string | null;
    legalHold: boolean;
    archiveStatus: string;
    compactionStatus: string;
    ledgerStatus: string;
    totalEvidenceBytes: number | null;
    warnings: string[];
  }>;
  summary: {
    totalRuns: number;
    archivedRuns: number;
    legalHoldRuns: number;
    missingInventory: number;
    missingRetentionPlan: number;
    missingArchive: number;
    ledgerInvalid: number;
  };
  nextActions: string[];
};

export async function createEvidenceReport(
  cwd: string,
  options: { deep?: boolean; policy?: string } = {}
): Promise<EvidenceCrossRunReport> {
  const runsDir = join(cwd, ".vibecli", "runs");
  const entries = pathExists(runsDir) ? await readdir(runsDir, { withFileTypes: true }) : [];
  const store = new RunStore(cwd);
  const runs = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const runId = entry.name;
        const state = await store.readState(runId).catch(() => undefined);
        const lifecycle = state?.evidenceLifecycle ?? defaultEvidenceLifecycleState();
        const runPath = store.runPath(runId);
        const inventory = await readOptional<EvidenceInventory>(
          join(runPath, "evidence-lifecycle", "EVIDENCE_INVENTORY.json")
        );
        const legalHold = await readOptional<LegalHoldRecord>(
          join(runPath, "evidence-lifecycle", "LEGAL_HOLD.json")
        );
        const retention = await readOptional<{ policy?: string }>(
          join(runPath, "org", "RETENTION_PLAN.json")
        );
        return {
          runId,
          createdAt: state?.createdAt ?? null,
          status: state?.status ?? null,
          retentionPolicy: retention?.policy ?? state?.organization?.retention.policy ?? null,
          legalHold:
            legalHold?.status === "enabled" ||
            state?.evidenceLifecycle?.legalHold.status === "enabled",
          archiveStatus: lifecycle.archive.status,
          compactionStatus: lifecycle.compaction.status,
          ledgerStatus: state?.ledger?.status ?? "unknown",
          totalEvidenceBytes: options.deep ? (inventory?.summary.totalBytes ?? null) : null,
          warnings: inventory ? [] : ["Missing evidence inventory."]
        };
      })
  );
  const filtered = options.policy
    ? runs.filter((run) => run.retentionPolicy === options.policy)
    : runs;
  const report: EvidenceCrossRunReport = {
    createdAt: new Date().toISOString(),
    runs: filtered,
    summary: {
      totalRuns: filtered.length,
      archivedRuns: filtered.filter(
        (run) => run.archiveStatus === "archived" || run.archiveStatus === "verified"
      ).length,
      legalHoldRuns: filtered.filter((run) => run.legalHold).length,
      missingInventory: filtered.filter((run) =>
        run.warnings.includes("Missing evidence inventory.")
      ).length,
      missingRetentionPlan: filtered.filter((run) => !run.retentionPolicy).length,
      missingArchive: filtered.filter((run) => run.archiveStatus === "not_started").length,
      ledgerInvalid: filtered.filter((run) => run.ledgerStatus === "invalid").length
    },
    nextActions: ["vibe evidence-inventory --all", "vibe retention-ledger --verify"]
  };
  const dir = join(cwd, ".vibecli", "evidence-lifecycle");
  await ensureDir(dir);
  await writeJson(join(dir, "EVIDENCE_REPORT.json"), report);
  await import("node:fs/promises").then((fs) =>
    fs.writeFile(join(dir, "EVIDENCE_REPORT.md"), renderReport(report), "utf8")
  );
  return report;
}

async function readOptional<T>(path: string): Promise<T | undefined> {
  return pathExists(path) ? readJson<T>(path).catch(() => undefined) : undefined;
}

function renderReport(report: EvidenceCrossRunReport): string {
  return `# Evidence Lifecycle Cross-Run Report

Total runs: ${report.summary.totalRuns}
Archived runs: ${report.summary.archivedRuns}
Legal hold runs: ${report.summary.legalHoldRuns}
Missing inventory: ${report.summary.missingInventory}
Missing archive: ${report.summary.missingArchive}

${report.runs.map((run) => `- ${run.runId}: archive=${run.archiveStatus} legalHold=${run.legalHold}`).join("\n") || "- no runs"}

No evidence was deleted, archived, uploaded, or purged by this report.
`;
}
