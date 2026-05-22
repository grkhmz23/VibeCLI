import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { loadConfig } from "../config/config.js";
import { RunStore } from "../orchestrator/run-store.js";
import { verifyLedger } from "../ledger/verify.js";
import { buildReviewWorkspace } from "../orchestrator/workspace.js";
import { pathExists, writeJson } from "../utils/fs.js";
import { updateDogfoodState } from "./config.js";

export type PerfCheckReport = {
  createdAt: string;
  checks: Array<{
    name: string;
    durationMs: number;
    status: "passed" | "warning" | "failed";
    thresholdMs: number | null;
    message: string;
  }>;
  artifactSizes: Array<{ path: string; sizeBytes: number; warning: boolean }>;
  summary: { warnings: number; failures: number };
};

async function measure(
  name: string,
  thresholdMs: number | null,
  fn: () => Promise<unknown>
): Promise<PerfCheckReport["checks"][number]> {
  const started = Date.now();
  try {
    await fn();
    const durationMs = Date.now() - started;
    return {
      name,
      durationMs,
      thresholdMs,
      status: thresholdMs && durationMs > thresholdMs ? "warning" : "passed",
      message: thresholdMs && durationMs > thresholdMs ? "above threshold" : "ok"
    };
  } catch (error) {
    return {
      name,
      durationMs: Date.now() - started,
      thresholdMs,
      status: "failed",
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function runPerfCheck(cwd: string): Promise<PerfCheckReport> {
  const store = new RunStore(cwd);
  const latestRunId = await store.latestRunId();
  const checks = [
    await measure("config load", 500, () => loadConfig(cwd)),
    await measure("status latest", 1000, async () =>
      latestRunId ? store.readState(latestRunId) : undefined
    ),
    await measure("route preview", 1000, () => loadConfig(cwd)),
    await measure("latest ledger verify", 1500, async () =>
      latestRunId ? verifyLedger(cwd, latestRunId) : undefined
    ),
    await measure("workspace generation", 2000, async () =>
      latestRunId ? buildReviewWorkspace(cwd, latestRunId, false) : undefined
    )
  ];
  const artifactSizes = await largestRunDirs(cwd);
  const report: PerfCheckReport = {
    createdAt: new Date().toISOString(),
    checks,
    artifactSizes,
    summary: {
      warnings:
        checks.filter((check) => check.status === "warning").length +
        artifactSizes.filter((item) => item.warning).length,
      failures: checks.filter((check) => check.status === "failed").length
    }
  };
  const path = join(cwd, ".vibecli", "dogfood", "reports", "PERF_CHECK.json");
  await writeJson(path, report);
  await import("node:fs/promises").then((fs) =>
    fs.writeFile(
      join(cwd, ".vibecli", "dogfood", "reports", "PERF_CHECK.md"),
      `# Performance Check\n\nWarnings: ${report.summary.warnings}\nFailures: ${report.summary.failures}\n`,
      "utf8"
    )
  );
  await updateDogfoodState(cwd, { latestReports: { perfCheck: path } });
  return report;
}

async function dirSize(path: string): Promise<number> {
  const entries = await readdir(path, { withFileTypes: true }).catch(() => []);
  let total = 0;
  for (const entry of entries) {
    const item = join(path, entry.name);
    if (entry.isDirectory()) total += await dirSize(item);
    else total += (await stat(item)).size;
  }
  return total;
}

async function largestRunDirs(cwd: string): Promise<PerfCheckReport["artifactSizes"]> {
  const runsDir = join(cwd, ".vibecli", "runs");
  if (!pathExists(runsDir)) return [];
  const entries = await readdir(runsDir, { withFileTypes: true });
  const sizes = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const sizeBytes = await dirSize(join(runsDir, entry.name));
        return { path: `.vibecli/runs/${entry.name}`, sizeBytes, warning: sizeBytes > 10_000_000 };
      })
  );
  return sizes.sort((a, b) => b.sizeBytes - a.sizeBytes).slice(0, 10);
}
