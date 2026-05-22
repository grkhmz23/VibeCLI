import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";
import { writeJson } from "../utils/fs.js";
import { loadConfig } from "../config/config.js";
import { updateBetaState } from "../beta/config.js";
const execFileAsync = promisify(execFile);
const scanners = [
    { name: "gitleaks", command: "gitleaks", args: ["version"] },
    { name: "semgrep", command: "semgrep", args: ["--version"] },
    { name: "osv-scanner", command: "osv-scanner", args: ["--version"] },
    { name: "trivy", command: "trivy", args: ["--version"] },
    { name: "pnpm audit", command: "pnpm", args: ["--version"] },
    { name: "npm audit", command: "npm", args: ["--version"] },
    { name: "yarn npm audit", command: "yarn", args: ["--version"] },
    { name: "bun audit", command: "bun", args: ["--version"] }
];
export async function scannerReadiness(cwd, options = {}) {
    if (options.runSafe && options.confirm !== "RUN SAFE SCANNER CHECK") {
        throw new Error('Safe scanner checks require exact confirmation: "RUN SAFE SCANNER CHECK"');
    }
    const results = await Promise.all(scanners.map(async (scanner) => {
        try {
            const { stdout, stderr } = await execFileAsync(scanner.command, scanner.args, {
                cwd,
                timeout: 3000
            });
            const output = `${stdout}${stderr}`.trim().split(/\r?\n/)[0] ?? "";
            return {
                name: scanner.name,
                available: true,
                version: output || null,
                status: "available",
                notes: [
                    options.runSafe
                        ? "Safe version/help command only."
                        : "Detected by local command availability."
                ]
            };
        }
        catch {
            return {
                name: scanner.name,
                available: false,
                version: null,
                status: "missing",
                notes: ["Scanner command not available locally; non-fatal for dry-run beta checks."]
            };
        }
    }));
    const report = {
        createdAt: new Date().toISOString(),
        scanners: results,
        summary: {
            available: results.filter((item) => item.available).length,
            missing: results.filter((item) => item.status === "missing").length,
            failed: 0
        },
        nextActions: ["Install optional scanners for stronger local validation."]
    };
    await writeScannerReadiness(cwd, report);
    if (options.strict)
        await writeScannerGate(cwd, report);
    if (options.installGuide)
        await writeScannerInstallGuide(cwd);
    return report;
}
async function writeScannerReadiness(cwd, report) {
    const dir = join(cwd, ".vibecli", "dogfood", "reports");
    await writeJson(join(dir, "SCANNER_READINESS.json"), report);
    await import("node:fs/promises").then((fs) => fs.writeFile(join(dir, "SCANNER_READINESS.md"), `# Scanner Readiness\n\nAvailable: ${report.summary.available}\nMissing: ${report.summary.missing}\nFailed: ${report.summary.failed}\n\nNo network-dependent scans were run by default.\n`, "utf8"));
}
async function writeScannerGate(cwd, report) {
    const config = await loadConfig(cwd);
    const required = config.beta.gates.require_external_scanners_installed;
    const blockers = required
        ? report.scanners.filter((scanner) => !scanner.available).map((scanner) => scanner.name)
        : [];
    const gate = {
        createdAt: new Date().toISOString(),
        status: blockers.length ? "failed" : report.summary.missing ? "warning" : "passed",
        required,
        blockers,
        warnings: report.scanners
            .filter((scanner) => !scanner.available)
            .map((scanner) => `${scanner.name} is not installed`),
        installGuidePath: join(cwd, ".vibecli", "beta", "reports", "SCANNER_INSTALL_GUIDE.md")
    };
    const path = join(cwd, ".vibecli", "beta", "reports", "SCANNER_GATE.json");
    await writeJson(path, gate);
    await import("node:fs/promises").then((fs) => fs.writeFile(join(cwd, ".vibecli", "beta", "reports", "SCANNER_GATE.md"), `# Scanner Gate\n\nStatus: ${gate.status}\nRequired: ${required}\nBlockers: ${blockers.length}\n`, "utf8"));
    await updateBetaState(cwd, { latestReports: { scannerCheck: path } });
}
async function writeScannerInstallGuide(cwd) {
    const path = join(cwd, ".vibecli", "beta", "reports", "SCANNER_INSTALL_GUIDE.md");
    const body = `# Scanner Install Guide\n\nThis guide does not install anything.\n\n- gitleaks: install from the official project package for your platform.\n- semgrep: install the CLI locally and run only exact-confirmed scans.\n- osv-scanner: install the official OSV scanner binary.\n- trivy: install the official Trivy binary or package.\n- pnpm audit/npm audit/yarn npm audit/bun audit: use your project package manager when network access is acceptable.\n\nVibeCLI does not run network-heavy scanner actions by default.\n`;
    await import("node:fs/promises").then((fs) => fs.writeFile(path, body, "utf8"));
}
//# sourceMappingURL=scanner-readiness.js.map