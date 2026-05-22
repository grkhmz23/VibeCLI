import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { verifyLedger } from "../ledger/verify.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { readPolicyExceptions } from "../handoff/policy-exceptions.js";
import { RunStore } from "../orchestrator/run-store.js";
import { pathExists } from "../utils/fs.js";
import { readCiStatus } from "./ci.js";
import { updateReleaseState } from "./state.js";

export type DeploymentReadiness = {
  runId: string;
  createdAt: string;
  verdict: "ready_to_deploy" | "ready_with_warnings" | "blocked" | "not_ready";
  blockingReasons: string[];
  warnings: string[];
  passed: string[];
  manualChecks: string[];
  nextActions: string[];
};

async function fileContainsEnvRefs(cwd: string, files: string[]): Promise<boolean> {
  for (const file of files) {
    const fullPath = join(cwd, file);
    if (!pathExists(fullPath)) continue;
    const content = await readFile(fullPath, "utf8").catch(() => "");
    if (/process\.env\.|import\.meta\.env|\$\{[A-Z0-9_]+}/.test(content)) return true;
  }
  return false;
}

export async function evaluateDeploymentReadiness(
  cwd: string,
  runId: string,
  options: { channel?: string } = {}
): Promise<DeploymentReadiness> {
  const channel = options.channel ?? "internal";
  const store = new RunStore(cwd);
  const state = await store.readState(runId);
  const ledger = await verifyLedger(cwd, runId).catch(() => undefined);
  const ci = await readCiStatus(cwd, runId);
  const exceptions = await readPolicyExceptions(cwd, runId).catch(() => ({
    runId,
    createdAt: new Date().toISOString(),
    exceptions: []
  }));
  const blockingReasons: string[] = [];
  const warnings: string[] = ["No deploy command was executed."];
  const passed: string[] = [];
  if (ledger?.ok) passed.push("ledger pass");
  else if (channel === "production") blockingReasons.push("Production requires ledger pass.");
  else warnings.push("Ledger is missing or failed.");
  if (state.apply.status === "applied") passed.push("source applied");
  else warnings.push("Source changes have not been applied.");
  if (state.verification?.status === "passed") passed.push("verification passed");
  else if (channel === "production")
    blockingReasons.push("Production requires passed verification.");
  else warnings.push("Verification is not passed.");
  if (state.scanners && state.scanners.criticalFindings + state.scanners.highFindings === 0) {
    passed.push("no high/critical scanner findings");
  } else if (channel === "production") {
    blockingReasons.push("Production requires no high/critical scanner findings.");
  } else {
    warnings.push("Scanner high/critical status is unknown or failing.");
  }
  if (ci?.status === "passed") passed.push("CI passed");
  else if (channel === "production") blockingReasons.push("Production requires passed CI.");
  else warnings.push("CI is not passed or was not ingested.");
  if (
    state.apply.status === "applied" &&
    !pathExists(join(store.runPath(runId), "rollback", "pre-apply-metadata.json"))
  ) {
    blockingReasons.push("Rollback plan is missing after applied changes.");
  }
  if (await fileContainsEnvRefs(cwd, state.apply.filesChanged)) {
    if (pathExists(join(cwd, ".env.example"))) passed.push(".env.example exists for env refs");
    else warnings.push("Environment references changed but .env.example is missing.");
  }
  const unresolved = exceptions.exceptions.filter(
    (item) =>
      (item.severity === "critical" || item.severity === "high") && item.status !== "approved"
  );
  if (unresolved.length) blockingReasons.push("Unresolved high/critical policy exceptions exist.");
  const verdict =
    blockingReasons.length > 0
      ? "blocked"
      : warnings.length > 0
        ? "ready_with_warnings"
        : state.apply.status === "applied"
          ? "ready_to_deploy"
          : "not_ready";
  const result: DeploymentReadiness = {
    runId,
    createdAt: new Date().toISOString(),
    verdict,
    blockingReasons,
    warnings,
    passed,
    manualChecks: [
      "Manual QA checklist completed",
      "Database migration notes reviewed when schema changed",
      "Auth/authz, CORS, JWT/session, logging, observability, and cost/rate-limit notes reviewed when relevant"
    ],
    nextActions: [`vibe release-readiness ${runId} --channel ${channel}`]
  };
  await store.writeArtifact(runId, "release/deployment-readiness.json", result);
  await store.writeTextArtifact(
    runId,
    "release/DEPLOYMENT_READINESS.md",
    renderDeploymentReadiness(result)
  );
  await updateReleaseState(store, runId, (release) => {
    release.deploymentReadiness = { verdict: result.verdict };
  });
  await writeLedgerManifest(cwd, runId);
  return result;
}

export function renderDeploymentReadiness(value: DeploymentReadiness): string {
  return `# Deployment Readiness

Verdict: ${value.verdict}

Blocking reasons:
${value.blockingReasons.map((reason) => `- ${reason}`).join("\n") || "- none"}

Warnings:
${value.warnings.map((warning) => `- ${warning}`).join("\n") || "- none"}

Passed:
${value.passed.map((item) => `- ${item}`).join("\n") || "- none"}

Manual checks:
${value.manualChecks.map((item) => `- ${item}`).join("\n")}

No deployment command was executed.
`;
}
