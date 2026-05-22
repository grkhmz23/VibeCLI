import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { writeJson } from "../utils/fs.js";
import { updateDogfoodState } from "./config.js";
import { registeredCommandNames } from "./command-surface.js";

export type DocsCheckReport = {
  createdAt: string;
  checks: Array<{ name: string; status: "passed" | "warning" | "failed"; message: string }>;
  missingCommands: string[];
  missingConfirmations: string[];
  blockers: string[];
  warnings: string[];
};

const confirmationCommands = [
  "RUN LIVE SMOKE",
  "APPLY DOGFOOD FIXTURE PATCHES",
  "RUN SAFE SCANNER CHECK",
  "DELETE EVIDENCE",
  "ARCHIVE EVIDENCE",
  "CREATE PROVENANCE KEY"
];

export async function runDocsCheck(
  cwd: string,
  options: { strict?: boolean } = {}
): Promise<DocsCheckReport> {
  const readme = await readFile(join(cwd, "README.md"), "utf8").catch(() => "");
  const security = await readFile(join(cwd, "SECURITY.md"), "utf8").catch(() => "");
  const docs = `${readme}\n${security}`;
  const commands = registeredCommandNames();
  const missingCommands = commands.filter(
    (command) => !docs.includes(`vibe ${command}`) && !docs.includes(`/${command}`)
  );
  const missingConfirmations = confirmationCommands.filter(
    (confirmation) => !docs.includes(confirmation)
  );
  const forbiddenClaims = [
    /certified compliant/i,
    /SOC 2 certified/i,
    /ISO 27001 certified/i,
    /automatically deploys/i,
    /automatically publishes/i,
    /claims production-ready/i,
    /auto merge/i,
    /remote upload by default/i,
    /live provider calls by default/i
  ];
  const claimFailures = forbiddenClaims
    .filter((pattern) => pattern.test(docs))
    .map((pattern) => String(pattern));
  const checks: DocsCheckReport["checks"] = [
    { name: "README exists", status: readme ? "passed" : "failed", message: "README.md" },
    { name: "SECURITY exists", status: security ? "passed" : "failed", message: "SECURITY.md" },
    {
      name: "command coverage",
      status: missingCommands.length ? (options.strict ? "failed" : "warning") : "passed",
      message: `${missingCommands.length} commands not explicitly documented`
    },
    {
      name: "exact confirmation coverage",
      status: missingConfirmations.length ? (options.strict ? "failed" : "warning") : "passed",
      message: `${missingConfirmations.length} confirmation strings not found`
    },
    {
      name: "forbidden claims",
      status: claimFailures.length ? "failed" : "passed",
      message: claimFailures.join(", ") || "none"
    },
    {
      name: "dry-run/live safety",
      status: readme.includes("dry-run") && readme.includes("live") ? "passed" : "warning",
      message: "README should describe dry-run vs live mode"
    }
  ];
  const report: DocsCheckReport = {
    createdAt: new Date().toISOString(),
    checks,
    missingCommands,
    missingConfirmations,
    blockers: checks
      .filter((check) => check.status === "failed")
      .map((check) => `${check.name}: ${check.message}`),
    warnings: checks
      .filter((check) => check.status === "warning")
      .map((check) => `${check.name}: ${check.message}`)
  };
  const path = join(cwd, ".vibecli", "dogfood", "reports", "DOCS_CHECK.json");
  await writeJson(path, report);
  await import("node:fs/promises").then((fs) =>
    fs.writeFile(
      join(cwd, ".vibecli", "dogfood", "reports", "DOCS_CHECK.md"),
      `# Docs Check\n\nBlockers: ${report.blockers.length}\nWarnings: ${report.warnings.length}\n`,
      "utf8"
    )
  );
  await updateDogfoodState(cwd, { latestReports: { docsCheck: path } });
  if (options.strict) {
    const strictPath = join(cwd, ".vibecli", "beta", "reports", "DOCS_STRICT_CHECK.json");
    await writeJson(strictPath, {
      ...report,
      status: report.blockers.length ? "failed" : "passed"
    });
    await import("node:fs/promises").then((fs) =>
      fs.writeFile(
        join(cwd, ".vibecli", "beta", "reports", "DOCS_STRICT_CHECK.md"),
        `# Docs Strict Check\n\nStatus: ${report.blockers.length ? "failed" : "passed"}\nBlockers: ${report.blockers.length}\nWarnings: ${report.warnings.length}\n`,
        "utf8"
      )
    );
    await import("../beta/config.js").then(({ updateBetaState }) =>
      updateBetaState(cwd, { latestReports: { docsStrictCheck: strictPath } })
    );
  }
  return report;
}
