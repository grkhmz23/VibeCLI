import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { RunStore } from "../orchestrator/run-store.js";
import { pathExists, readJson } from "../utils/fs.js";
import { redactReleaseJson, redactReleaseText } from "./redaction.js";
import { updateReleaseState } from "./state.js";
import type { CiStatus } from "./types.js";

const execFileAsync = promisify(execFile);

function summarize(
  runId: string,
  source: "github" | "local",
  checks: CiStatus["checks"],
  warnings: string[]
): CiStatus {
  const failed = checks.filter(
    (check) => check.conclusion === "failure" || check.conclusion === "failed"
  ).length;
  const pending = checks.filter((check) =>
    ["queued", "in_progress", "pending"].includes(check.status)
  ).length;
  const passed = checks.filter(
    (check) => check.conclusion === "success" || check.conclusion === "passed"
  ).length;
  return redactReleaseJson({
    runId,
    createdAt: new Date().toISOString(),
    source,
    status: failed > 0 ? "failed" : pending > 0 ? "pending" : passed > 0 ? "passed" : "unknown",
    checks,
    failed,
    pending,
    passed,
    warnings
  });
}

export async function readCiStatus(cwd: string, runId: string): Promise<CiStatus | undefined> {
  const path = join(new RunStore(cwd).runPath(runId), "release", "ci-status.json");
  return pathExists(path) ? readJson<CiStatus>(path) : undefined;
}

export async function showOrCreateLocalCiStatus(cwd: string, runId: string): Promise<CiStatus> {
  const existing = await readCiStatus(cwd, runId);
  if (existing) return existing;
  const status = summarize(runId, "local", [], ["CI status was not ingested."]);
  await writeCiArtifacts(cwd, runId, status);
  return status;
}

export async function ingestGithubCi(
  cwd: string,
  runId: string,
  confirm?: string
): Promise<CiStatus> {
  if (confirm !== `INGEST CI ${runId}`) {
    throw new Error(`GitHub CI ingestion requires exact confirmation: INGEST CI ${runId}`);
  }
  const { stdout } = await execFileAsync(
    "gh",
    [
      "run",
      "list",
      "--limit",
      "20",
      "--json",
      "status,conclusion,name,headBranch,headSha,createdAt,updatedAt,url"
    ],
    { cwd, timeout: 60_000 }
  );
  const raw = JSON.parse(redactReleaseText(stdout, 30_000)) as Array<{
    name?: string;
    status?: string;
    conclusion?: string | null;
    url?: string | null;
  }>;
  const status = summarize(
    runId,
    "github",
    raw.map((item) => ({
      name: item.name ?? "unknown",
      status: item.status ?? "unknown",
      conclusion: item.conclusion ?? null,
      url: item.url ?? null
    })),
    []
  );
  await writeCiArtifacts(cwd, runId, status);
  return status;
}

export async function ingestCiFile(cwd: string, runId: string, file: string): Promise<CiStatus> {
  if (file.includes("..") || file.startsWith("/") || /^[A-Za-z]:[\\/]/.test(file)) {
    throw new Error("CI file path must be relative and inside the repository");
  }
  const fullPath = resolve(cwd, file);
  const root = resolve(cwd);
  if (!fullPath.startsWith(`${root}/`) && fullPath !== root) {
    throw new Error("CI file path resolves outside the repository");
  }
  const content = await readFile(fullPath, "utf8");
  if (content.length > 200_000) throw new Error("CI file is too large");
  const parsed = JSON.parse(redactReleaseText(content, 200_000)) as Partial<CiStatus>;
  const status = summarize(runId, "local", parsed.checks ?? [], parsed.warnings ?? []);
  await writeCiArtifacts(cwd, runId, status);
  return status;
}

async function writeCiArtifacts(cwd: string, runId: string, status: CiStatus): Promise<void> {
  const store = new RunStore(cwd);
  await store.writeArtifact(runId, "release/ci-status.json", status);
  await store.writeTextArtifact(runId, "release/CI_STATUS.md", renderCiStatus(status));
  await updateReleaseState(store, runId, (release) => {
    release.ci = { status: status.status };
  });
  await writeLedgerManifest(cwd, runId);
}

export function renderCiStatus(status: CiStatus): string {
  return `# CI Status

Source: ${status.source}

Status: ${status.status}

Passed: ${status.passed}

Pending: ${status.pending}

Failed: ${status.failed}

Checks:
${status.checks.map((check) => `- ${check.name}: ${check.status}/${check.conclusion ?? "none"}`).join("\n") || "- none"}

Warnings:
${status.warnings.map((warning) => `- ${warning}`).join("\n") || "- none"}
`;
}
