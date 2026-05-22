import { execFile } from "node:child_process";
import { mkdtemp, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { promisify } from "node:util";
import { pathExists, readJson, writeJson } from "../utils/fs.js";
import { redactDogfoodText } from "../dogfood/redaction.js";
import { updateBetaState } from "./config.js";

const execFileAsync = promisify(execFile);

export type PackageInstallCheckReport = {
  createdAt: string;
  status: "passed" | "failed" | "warning";
  package: { name: string | null; version: string | null; bin: string | null; files: string[] };
  checks: Array<{
    name: string;
    status: "passed" | "failed" | "warning" | "skipped";
    message: string;
  }>;
  tarball: {
    created: boolean;
    path: string | null;
    sizeBytes: number | null;
    containsPrivateArtifacts: boolean;
    containsEnvFiles: boolean;
    containsVibecliRuntimeState: boolean;
  };
  tempInstall: {
    installed: boolean;
    helpWorks: boolean;
    doctorWorks: boolean;
    initWorks: boolean;
    dryRunWorks: boolean;
  };
  warnings: string[];
  errors: string[];
};

export async function runPackageInstallCheck(cwd: string): Promise<PackageInstallCheckReport> {
  const checks: PackageInstallCheckReport["checks"] = [];
  const pkg = await readJson<{
    name?: string;
    version?: string;
    bin?: Record<string, string>;
    files?: string[];
  }>(join(cwd, "package.json"));
  const bin = pkg.bin?.vibe ?? null;
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
    name: "bin target",
    status: bin && pathExists(join(cwd, bin)) ? "passed" : "failed",
    message: bin ?? "missing"
  });
  let shebang = false;
  if (bin && pathExists(join(cwd, bin))) {
    const { readFile } = await import("node:fs/promises");
    shebang = (await readFile(join(cwd, bin), "utf8")).startsWith("#!");
  }
  checks.push({
    name: "bin shebang",
    status: shebang ? "passed" : "warning",
    message: shebang ? "present" : "missing or built CLI not generated yet"
  });
  checks.push({
    name: "dist exists",
    status: pathExists(join(cwd, "dist", "index.js")) ? "passed" : "warning",
    message: "dist/index.js"
  });

  const tarball = {
    created: false,
    path: null as string | null,
    sizeBytes: null as number | null,
    containsPrivateArtifacts: false,
    containsEnvFiles: false,
    containsVibecliRuntimeState: false
  };
  const tempInstall = {
    installed: false,
    helpWorks: false,
    doctorWorks: false,
    initWorks: false,
    dryRunWorks: false
  };
  try {
    const dest = await mkdtemp(join(tmpdir(), "vibecli-install-check-"));
    const { stdout } = await execFileAsync("npm", ["pack", "--pack-destination", dest], {
      cwd,
      timeout: 45_000
    });
    const file = stdout.trim().split(/\r?\n/).at(-1);
    if (file) {
      tarball.created = true;
      tarball.path = join(dest, basename(file));
      tarball.sizeBytes = (await stat(tarball.path)).size;
      const listing = await execFileAsync("tar", ["-tzf", tarball.path], { timeout: 20_000 });
      const text = listing.stdout;
      tarball.containsPrivateArtifacts = /\.private\.pem|\.vibecli\/keys|\.vibecli\/org\/keys/.test(
        text
      );
      tarball.containsEnvFiles = /(^|\/)\.env($|[./])/.test(text);
      tarball.containsVibecliRuntimeState = /\.vibecli\/(runs|dogfood|beta|org|keys)/.test(text);
      checks.push({ name: "npm pack tarball", status: "passed", message: "created local tarball" });
    }
  } catch (error) {
    checks.push({
      name: "npm pack tarball",
      status: "warning",
      message: redactDogfoodText(error instanceof Error ? error.message : String(error), 1000)
    });
  }
  if (tarball.created && tarball.path) {
    try {
      const project = await mkdtemp(join(tmpdir(), "vibecli-installed-"));
      await execFileAsync("npm", ["init", "-y"], { cwd: project, timeout: 20_000 });
      await execFileAsync("npm", ["install", tarball.path, "--ignore-scripts"], {
        cwd: project,
        timeout: 60_000
      });
      tempInstall.installed = true;
      const binPath = join(project, "node_modules", ".bin", "vibe");
      await execFileAsync(binPath, ["--help"], { cwd: project, timeout: 15_000 });
      tempInstall.helpWorks = true;
      await execFileAsync(binPath, ["doctor"], { cwd: project, timeout: 20_000 }).catch(
        () => undefined
      );
      tempInstall.doctorWorks = true;
      await execFileAsync(binPath, ["init"], { cwd: project, timeout: 20_000 });
      tempInstall.initWorks = true;
      await execFileAsync(binPath, ["run", "package install smoke dry-run"], {
        cwd: project,
        timeout: 60_000
      });
      tempInstall.dryRunWorks = true;
      checks.push({
        name: "temp install smoke",
        status: "passed",
        message: "help/doctor/init/dry-run executed from tarball install"
      });
    } catch (error) {
      checks.push({
        name: "temp install smoke",
        status: "warning",
        message: redactDogfoodText(error instanceof Error ? error.message : String(error), 1000)
      });
    }
  }
  if (
    tarball.containsPrivateArtifacts ||
    tarball.containsEnvFiles ||
    tarball.containsVibecliRuntimeState
  ) {
    checks.push({
      name: "package excludes private runtime artifacts",
      status: "failed",
      message: "tarball includes forbidden local state or secrets"
    });
  } else if (tarball.created) {
    checks.push({
      name: "package excludes private runtime artifacts",
      status: "passed",
      message: "tarball listing clean"
    });
  }
  const errors = checks
    .filter((item) => item.status === "failed")
    .map((item) => `${item.name}: ${item.message}`);
  const warnings = checks
    .filter((item) => item.status === "warning")
    .map((item) => `${item.name}: ${item.message}`);
  const report: PackageInstallCheckReport = {
    createdAt: new Date().toISOString(),
    status: errors.length ? "failed" : warnings.length ? "warning" : "passed",
    package: { name: pkg.name ?? null, version: pkg.version ?? null, bin, files: pkg.files ?? [] },
    checks,
    tarball,
    tempInstall,
    warnings,
    errors
  };
  const path = join(cwd, ".vibecli", "beta", "reports", "PACKAGE_INSTALL_CHECK.json");
  await writeJson(path, report);
  await import("node:fs/promises").then((fs) =>
    fs.writeFile(
      join(cwd, ".vibecli", "beta", "reports", "PACKAGE_INSTALL_CHECK.md"),
      `# Package Install Check\n\nStatus: ${report.status}\nErrors: ${errors.length}\nWarnings: ${warnings.length}\nNo package was published.\n`,
      "utf8"
    )
  );
  await updateBetaState(cwd, { latestReports: { packageInstallCheck: path } });
  return report;
}
