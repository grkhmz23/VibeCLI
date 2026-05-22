import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { verifyApprovalNotes } from "../approvals/notes.js";
import { verifyHandoffBundle } from "../handoff/bundle.js";
import { verifyLedger } from "../ledger/verify.js";
import { sha256File } from "../ledger/hash.js";
import { RunStore } from "../orchestrator/run-store.js";
import { pathExists, readJson } from "../utils/fs.js";
import { verifyReleaseIntegrity } from "../release/integrity.js";
import type { ReleaseSummary } from "../release/types.js";
import type { CiStatus } from "../release/types.js";
import type { DeploymentReadiness } from "../release/deployment-readiness.js";
import type { ReleaseReadiness } from "../release/release-readiness.js";

const execFileAsync = promisify(execFile);

export type ProvenanceCollected = {
  ledgerVerified: boolean;
  releasePacketVerified: boolean;
  handoffVerified: boolean;
  releaseSummary?: ReleaseSummary;
  ci?: CiStatus;
  deployment?: DeploymentReadiness;
  releaseReadiness?: ReleaseReadiness;
  releaseApprovalPresent: boolean;
  materials: Array<{ uri: string; sha256: string }>;
  subject: Array<{ name: string; sha256: string }>;
  gitBranch: string | null;
  gitCommit: string | null;
  warnings: string[];
};

async function git(args: string[], cwd: string): Promise<string | null> {
  return execFileAsync("git", args, { cwd })
    .then(({ stdout }) => stdout.trim() || null)
    .catch(() => null);
}

async function optionalJson<T>(path: string): Promise<T | undefined> {
  return pathExists(path) ? readJson<T>(path).catch(() => undefined) : undefined;
}

export async function collectProvenanceInputs(
  cwd: string,
  runId: string
): Promise<ProvenanceCollected> {
  const store = new RunStore(cwd);
  const runPath = store.runPath(runId);
  const warnings: string[] = [];
  const ledger = await verifyLedger(cwd, runId).catch(() => undefined);
  if (!ledger?.ok) warnings.push("Ledger verification failed or ledger is missing.");
  const release = await verifyReleaseIntegrity(cwd, runId).catch(() => undefined);
  if (!release?.ok)
    warnings.push("Release packet verification failed or release packet is missing.");
  const handoff = await verifyHandoffBundle(cwd, runId).catch(() => undefined);
  const approvals = await verifyApprovalNotes(cwd, runId).catch(() => undefined);
  const releaseSummary = await optionalJson<ReleaseSummary>(
    join(runPath, "release", "RELEASE_SUMMARY.json")
  );
  const ci = await optionalJson<CiStatus>(join(runPath, "release", "ci-status.json"));
  const deployment = await optionalJson<DeploymentReadiness>(
    join(runPath, "release", "deployment-readiness.json")
  );
  const releaseReadiness = await optionalJson<ReleaseReadiness>(
    join(runPath, "release", "release-readiness.json")
  );
  const safeFiles = [
    "release/RELEASE_SUMMARY.json",
    "release/RELEASE_MANIFEST.json",
    "release/RELEASE_PACKET.md",
    "release/RELEASE_READINESS.md",
    "release/DEPLOYMENT_READINESS.md",
    "release/CI_STATUS.md",
    "handoff/HANDOFF_SUMMARY.json",
    "git/repository-lifecycle.json",
    "ledger-manifest.json"
  ];
  const materials = [];
  for (const file of safeFiles) {
    const fullPath = join(runPath, file);
    if (pathExists(fullPath))
      materials.push({
        uri: `vibecli://${runId}/${file}`,
        sha256: (await sha256File(fullPath)).sha256
      });
  }
  const subject = releaseSummary
    ? [
        {
          name: `release/${releaseSummary.version.planned ?? runId}`,
          sha256: (await sha256File(join(runPath, "release", "RELEASE_SUMMARY.json"))).sha256
        }
      ]
    : [{ name: runId, sha256: (await sha256File(join(runPath, "state.json"))).sha256 }];
  return {
    ledgerVerified: Boolean(ledger?.ok),
    releasePacketVerified: Boolean(release?.ok),
    handoffVerified: Boolean(handoff?.ok),
    releaseSummary,
    ci,
    deployment,
    releaseReadiness,
    releaseApprovalPresent: Boolean(
      approvals?.notes.some((note) => note.ok && note.id.includes("release"))
    ),
    materials,
    subject,
    gitBranch: await git(["branch", "--show-current"], cwd),
    gitCommit: await git(["rev-parse", "HEAD"], cwd),
    warnings
  };
}

export async function packageVersion(cwd: string): Promise<string | null> {
  const path = join(cwd, "package.json");
  if (!pathExists(path)) return null;
  const pkg = JSON.parse(await readFile(path, "utf8")) as { version?: unknown };
  return typeof pkg.version === "string" ? pkg.version : null;
}
