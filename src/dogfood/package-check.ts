import { execFile } from "node:child_process";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { pathExists, readJson, writeJson } from "../utils/fs.js";
import { updateDogfoodState } from "./config.js";
import { redactDogfoodText } from "./redaction.js";

const execFileAsync = promisify(execFile);

export type PackageCheckReport = {
  createdAt: string;
  checks: Array<{
    name: string;
    status: "passed" | "warning" | "failed" | "skipped";
    message: string;
  }>;
  summary: { passed: number; warnings: number; failed: number; skipped: number };
  blockers: string[];
  warnings: string[];
};

export async function runPackageCheck(cwd: string): Promise<PackageCheckReport> {
  const checks: PackageCheckReport["checks"] = [];
  const pkg = await readJson<{ name?: string; version?: string; bin?: Record<string, string> }>(
    join(cwd, "package.json")
  );
  checks.push({
    name: "package name",
    status: pkg.name ? "passed" : "failed",
    message: pkg.name ?? "missing"
  });
  checks.push({
    name: "package version",
    status: pkg.version ? "passed" : "failed",
    message: pkg.version ?? "missing"
  });
  checks.push({
    name: "bin points to CLI",
    status: pkg.bin?.vibe ? "passed" : "failed",
    message: pkg.bin?.vibe ?? "missing"
  });
  checks.push({
    name: "README exists",
    status: pathExists(join(cwd, "README.md")) ? "passed" : "failed",
    message: "README.md"
  });
  checks.push({
    name: "SECURITY exists",
    status: pathExists(join(cwd, "SECURITY.md")) ? "passed" : "failed",
    message: "SECURITY.md"
  });
  checks.push({
    name: "LICENSE status",
    status: pathExists(join(cwd, "LICENSE")) ? "passed" : "warning",
    message: pathExists(join(cwd, "LICENSE")) ? "LICENSE exists" : "LICENSE not found"
  });
  checks.push({
    name: "dist build exists",
    status: pathExists(join(cwd, "dist", "index.js")) ? "passed" : "warning",
    message: "Run pnpm build before publishing checks."
  });
  try {
    const { stdout } = await execFileAsync("npm", ["pack", "--dry-run"], { cwd, timeout: 30_000 });
    const out = redactDogfoodText(stdout, 20_000);
    checks.push({
      name: "npm pack dry-run",
      status: "passed",
      message: "npm pack --dry-run passed"
    });
    checks.push({
      name: "package excludes secrets",
      status:
        out.includes(".env") || out.includes(".private.pem") || out.includes(".vibecli/keys")
          ? "failed"
          : "passed",
      message: "checked npm pack dry-run listing"
    });
  } catch (error) {
    checks.push({
      name: "npm pack dry-run",
      status: "failed",
      message: error instanceof Error ? error.message : String(error)
    });
  }
  try {
    const dest = await mkdtemp(join(tmpdir(), "vibecli-pack-"));
    await execFileAsync("npm", ["pack", "--pack-destination", dest], { cwd, timeout: 30_000 });
    checks.push({ name: "npm pack tarball", status: "passed", message: "tarball created in temp" });
  } catch (error) {
    checks.push({
      name: "npm pack tarball",
      status: "warning",
      message: error instanceof Error ? error.message : String(error)
    });
  }
  try {
    await execFileAsync("node", [join(cwd, "dist", "index.js"), "--help"], {
      cwd,
      timeout: 10_000
    });
    checks.push({ name: "packed CLI smoke", status: "passed", message: "dist CLI help rendered" });
  } catch (error) {
    checks.push({
      name: "packed CLI smoke",
      status: "warning",
      message: error instanceof Error ? error.message : String(error)
    });
  }
  const report: PackageCheckReport = {
    createdAt: new Date().toISOString(),
    checks,
    summary: {
      passed: checks.filter((check) => check.status === "passed").length,
      warnings: checks.filter((check) => check.status === "warning").length,
      failed: checks.filter((check) => check.status === "failed").length,
      skipped: checks.filter((check) => check.status === "skipped").length
    },
    blockers: checks
      .filter((check) => check.status === "failed")
      .map((check) => `${check.name}: ${check.message}`),
    warnings: checks
      .filter((check) => check.status === "warning")
      .map((check) => `${check.name}: ${check.message}`)
  };
  const path = join(cwd, ".vibecli", "dogfood", "reports", "PACKAGE_CHECK.json");
  await writeJson(path, report);
  await import("node:fs/promises").then((fs) =>
    fs.writeFile(
      join(cwd, ".vibecli", "dogfood", "reports", "PACKAGE_CHECK.md"),
      `# Package Check\n\nPassed: ${report.summary.passed}\nWarnings: ${report.summary.warnings}\nFailed: ${report.summary.failed}\n\nNo package was published.\n`,
      "utf8"
    )
  );
  await updateDogfoodState(cwd, { latestReports: { packageCheck: path } });
  return report;
}
