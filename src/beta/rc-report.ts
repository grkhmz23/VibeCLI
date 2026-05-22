import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { loadConfig } from "../config/config.js";
import { pathExists, readJson, writeJson } from "../utils/fs.js";
import { readDogfoodState } from "../dogfood/config.js";
import { updateBetaState } from "./config.js";
import { collectBetaWarnings } from "./warnings.js";
import type { BetaChannel } from "./types.js";

type Gate = {
  name: string;
  category:
    | "build"
    | "tests"
    | "dogfood"
    | "security"
    | "package"
    | "docs"
    | "performance"
    | "providers"
    | "scanners"
    | "ux";
  status: "passed" | "warning" | "failed" | "not_run" | "accepted_warning";
  blocking: boolean;
  evidencePath: string | null;
  message: string;
};

export type BetaRcReport = {
  createdAt: string;
  channel: BetaChannel;
  verdict: "beta_rc_ready" | "ready_with_accepted_warnings" | "blocked";
  gates: Gate[];
  acceptedWarnings: Array<{
    id: string;
    source: string;
    acceptedBy: string;
    acceptanceReason: string;
  }>;
  blockers: string[];
  warnings: string[];
  manualValidationRequired: string[];
  nextActions: string[];
};

export async function createBetaRcReport(
  cwd: string,
  options: { channel?: BetaChannel; strict?: boolean } = {}
): Promise<BetaRcReport> {
  const config = await loadConfig(cwd);
  const beta = config.beta;
  const dogfoodState = await readDogfoodState(cwd);
  const warningsReport = await collectBetaWarnings(cwd);
  const channel = options.channel ?? beta.default_channel;
  const strict = Boolean(options.strict);
  const gates: Gate[] = [];
  const dogfoodReports = join(cwd, ".vibecli", "dogfood", "reports");
  const betaReports = join(cwd, ".vibecli", "beta", "reports");
  addPresenceGate(
    gates,
    "dogfood run",
    "dogfood",
    dogfoodState.latestReports.dogfood,
    beta.gates.require_dogfood_pass || strict
  );
  await addJsonStatusGate(
    gates,
    "dogfood apply smoke",
    "dogfood",
    join(betaReports, "DOGFOOD_APPLY_SMOKE.json"),
    "status",
    beta.gates.require_dogfood_patch_apply_smoke || strict
  );
  await addSecurityGate(
    gates,
    join(dogfoodReports, "SECURITY_REDTEAM.json"),
    beta.gates.require_security_redteam_pass || strict
  );
  await addPackageGate(
    gates,
    join(dogfoodReports, "PACKAGE_CHECK.json"),
    beta.gates.require_package_check_pass || strict
  );
  await addJsonStatusGate(
    gates,
    "package install check",
    "package",
    join(betaReports, "PACKAGE_INSTALL_CHECK.json"),
    "status",
    Boolean(beta.package.require_temp_install) || strict
  );
  await addDocsGate(
    gates,
    join(dogfoodReports, "DOCS_CHECK.json"),
    beta.gates.require_docs_check_pass || strict
  );
  await addJsonStatusGate(
    gates,
    "docs strict check",
    "docs",
    join(betaReports, "DOCS_STRICT_CHECK.json"),
    "status",
    Boolean(beta.docs.strict_command_coverage) || strict
  );
  addPresenceGate(
    gates,
    "performance check",
    "performance",
    join(dogfoodReports, "PERF_CHECK.json"),
    beta.gates.require_perf_check_pass || strict
  );
  await addBacklogGate(
    gates,
    join(dogfoodReports, "BETA_BACKLOG.json"),
    beta.gates.require_beta_backlog_no_blockers || strict
  );
  await addScannerGate(
    gates,
    join(betaReports, "SCANNER_GATE.json"),
    beta.gates.require_external_scanners_installed || strict
  );
  addPresenceGate(
    gates,
    "live RC smoke",
    "providers",
    join(betaReports, "LIVE_RC_SMOKE.json"),
    beta.gates.require_live_provider_smoke
  );
  for (const warning of warningsReport.warnings) {
    if (warning.status === "accepted") {
      gates.push({
        name: `accepted warning ${warning.id}`,
        category: categoryToGate(warning.category),
        status: "accepted_warning",
        blocking: false,
        evidencePath: join(cwd, ".vibecli", "beta", "reports", "BETA_WARNINGS.json"),
        message: warning.message
      });
    }
  }
  const blockers = gates
    .filter((gate) => gate.blocking && (gate.status === "failed" || gate.status === "not_run"))
    .map((gate) => `${gate.name}: ${gate.message}`);
  const openWarnings = warningsReport.warnings.filter((warning) => warning.status === "open");
  if (strict) {
    blockers.push(
      ...openWarnings.map((warning) => `open warning ${warning.id}: ${warning.message}`)
    );
  }
  const acceptedWarnings = warningsReport.warnings
    .filter((warning) => warning.status === "accepted")
    .map((warning) => ({
      id: warning.id,
      source: warning.source,
      acceptedBy: warning.acceptedBy ?? "unknown",
      acceptanceReason: warning.acceptanceReason ?? ""
    }));
  const report: BetaRcReport = {
    createdAt: new Date().toISOString(),
    channel,
    verdict: blockers.length
      ? "blocked"
      : acceptedWarnings.length
        ? "ready_with_accepted_warnings"
        : "beta_rc_ready",
    gates,
    acceptedWarnings,
    blockers,
    warnings: openWarnings.map((warning) => `${warning.id}: ${warning.message}`),
    manualValidationRequired: [
      "Run the beta trial guide with a real user before widening access.",
      "Validate optional live provider smoke only with exact confirmation and available credits."
    ],
    nextActions: blockers.length
      ? [
          "Resolve blockers or explicitly accept eligible warnings, then rerun vibe beta-rc --strict."
        ]
      : ["Review BETA_RC_CHECKLIST.md before private beta distribution."]
  };
  const rcDir = join(cwd, beta.rc_dir);
  const jsonPath = join(rcDir, "BETA_RC_REPORT.json");
  await writeJson(jsonPath, report);
  await writeFile(
    join(rcDir, "BETA_RC_REPORT.md"),
    `# Beta Release Candidate Report\n\nVerdict: ${report.verdict}\nChannel: ${report.channel}\nBlockers: ${report.blockers.length}\nWarnings: ${report.warnings.length}\n\nThis is a beta release-candidate gate, not a production-readiness claim.\n`,
    "utf8"
  );
  await writeFile(
    join(rcDir, "BETA_RC_CHECKLIST.md"),
    `# Beta RC Checklist\n\n- [ ] Confirm no publish/deploy/push/release/upload command was run.\n- [ ] Review accepted warnings.\n- [ ] Run beta trial pack with target testers.\n- [ ] Confirm live provider smoke is optional and exact-confirmed.\n`,
    "utf8"
  );
  await updateBetaState(cwd, {
    latestBetaVerdict: report.verdict,
    latestRcReport: jsonPath,
    latestDogfoodRunId: dogfoodState.latestDogfoodRunId,
    latestReports: { betaRc: jsonPath },
    blockers: report.blockers.length,
    warnings: report.warnings.length,
    acceptedWarnings: acceptedWarnings.length
  });
  return report;
}

function addPresenceGate(
  gates: Gate[],
  name: string,
  category: Gate["category"],
  path: string | null,
  blocking: boolean
): void {
  const present = Boolean(path && pathExists(path));
  gates.push({
    name,
    category,
    status: present ? "passed" : "not_run",
    blocking,
    evidencePath: present ? path : null,
    message: present ? "report present" : "report missing"
  });
}

async function addJsonStatusGate(
  gates: Gate[],
  name: string,
  category: Gate["category"],
  path: string,
  key: string,
  blocking: boolean
): Promise<void> {
  if (!pathExists(path)) return addPresenceGate(gates, name, category, path, blocking);
  const report = await readJson<Record<string, unknown>>(path);
  const value = report[key];
  gates.push({
    name,
    category,
    status: value === "passed" ? "passed" : value === "warning" ? "warning" : "failed",
    blocking,
    evidencePath: path,
    message: `status=${String(value)}`
  });
}

async function addSecurityGate(gates: Gate[], path: string, blocking: boolean): Promise<void> {
  if (!pathExists(path))
    return addPresenceGate(gates, "security red-team", "security", path, blocking);
  const report = await readJson<{ summary: { criticalFailed: number; highFailed: number } }>(path);
  const failed = report.summary.criticalFailed + report.summary.highFailed;
  gates.push({
    name: "security red-team",
    category: "security",
    status: failed ? "failed" : "passed",
    blocking,
    evidencePath: path,
    message: failed ? `${failed} high/critical failures` : "no high/critical failures"
  });
}

async function addPackageGate(gates: Gate[], path: string, blocking: boolean): Promise<void> {
  if (!pathExists(path)) return addPresenceGate(gates, "package check", "package", path, blocking);
  const report = await readJson<{ summary: { failed: number; warnings?: number } }>(path);
  gates.push({
    name: "package check",
    category: "package",
    status: report.summary.failed ? "failed" : report.summary.warnings ? "warning" : "passed",
    blocking,
    evidencePath: path,
    message: `${report.summary.failed} failures`
  });
}

async function addDocsGate(gates: Gate[], path: string, blocking: boolean): Promise<void> {
  if (!pathExists(path)) return addPresenceGate(gates, "docs check", "docs", path, blocking);
  const report = await readJson<{ blockers: string[]; warnings: string[] }>(path);
  gates.push({
    name: "docs check",
    category: "docs",
    status: report.blockers.length ? "failed" : report.warnings.length ? "warning" : "passed",
    blocking,
    evidencePath: path,
    message: `${report.blockers.length} blockers, ${report.warnings.length} warnings`
  });
}

async function addBacklogGate(gates: Gate[], path: string, blocking: boolean): Promise<void> {
  if (!pathExists(path)) return addPresenceGate(gates, "beta backlog", "ux", path, blocking);
  const report = await readJson<{ summary: { blockingBeta: number } }>(path);
  gates.push({
    name: "beta backlog",
    category: "ux",
    status: report.summary.blockingBeta ? "failed" : "passed",
    blocking,
    evidencePath: path,
    message: `${report.summary.blockingBeta} blocking items`
  });
}

async function addScannerGate(gates: Gate[], path: string, blocking: boolean): Promise<void> {
  if (!pathExists(path)) return addPresenceGate(gates, "scanner gate", "scanners", path, blocking);
  const report = await readJson<{ status: "passed" | "warning" | "failed"; blockers: string[] }>(
    path
  );
  gates.push({
    name: "scanner gate",
    category: "scanners",
    status: report.status,
    blocking,
    evidencePath: path,
    message: `${report.blockers.length} blockers`
  });
}

function categoryToGate(category: string): Gate["category"] {
  if (category === "docs") return "docs";
  if (category === "scanner") return "scanners";
  if (category === "live-provider") return "providers";
  if (category === "package") return "package";
  if (category === "security") return "security";
  if (category === "performance") return "performance";
  if (category === "dogfood") return "dogfood";
  return "ux";
}
