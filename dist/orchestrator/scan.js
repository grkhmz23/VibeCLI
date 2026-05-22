import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { runBuiltinScanners } from "../scanners/registry.js";
import { redactSecrets } from "../tools/shell.js";
import { RunStore } from "./run-store.js";
const execFileAsync = promisify(execFile);
export async function scanRunBuiltin(cwd, runId) {
    const store = new RunStore(cwd);
    const state = await store.readState(runId);
    const results = await runBuiltinScanners({
        repoRoot: cwd,
        filesChanged: state.apply?.filesChanged ?? []
    });
    await store.writeArtifact(runId, "scanner-results.json", results);
    state.scanners = {
        builtinStatus: results.some((result) => result.status === "fail")
            ? "failed"
            : results.some((result) => result.status === "warning")
                ? "warning"
                : "passed",
        externalStatus: state.scanners?.externalStatus ?? "not_started",
        criticalFindings: results
            .flatMap((result) => result.findings)
            .filter((finding) => finding.severity === "critical").length,
        highFindings: results
            .flatMap((result) => result.findings)
            .filter((finding) => finding.severity === "high").length
    };
    await store.writeState(state);
    return results;
}
async function scannerAvailable(binary) {
    try {
        await execFileAsync(binary, ["--version"]);
        return true;
    }
    catch {
        return false;
    }
}
export async function scanRunExternal(cwd, runId, confirm) {
    if (confirm !== `SCAN ${runId}`)
        throw new Error(`Refusing external scan without exact confirmation: SCAN ${runId}`);
    const startedAt = new Date().toISOString();
    const scanners = [
        { scanner: "gitleaks", command: ["gitleaks", "detect", "--no-git"] },
        { scanner: "osv-scanner", command: ["osv-scanner", "."] },
        { scanner: "semgrep", command: ["semgrep", "--config", "auto", "."] },
        { scanner: "trivy", command: ["trivy", "fs", "."] }
    ];
    const entries = [];
    for (const scanner of scanners) {
        const start = Date.now();
        const available = await scannerAvailable(scanner.command[0] ?? "");
        if (!available) {
            entries.push({
                scanner: scanner.scanner,
                available: false,
                status: "skipped",
                exitCode: null,
                durationMs: Date.now() - start,
                findings: [],
                summary: "scanner binary not installed"
            });
            continue;
        }
        try {
            const { stdout, stderr } = await execFileAsync(scanner.command[0] ?? "", scanner.command.slice(1), { cwd, timeout: 120_000 });
            entries.push({
                scanner: scanner.scanner,
                available: true,
                status: "pass",
                exitCode: 0,
                durationMs: Date.now() - start,
                findings: [],
                summary: redactSecrets(`${stdout}${stderr}`).slice(0, 1000)
            });
        }
        catch (error) {
            const output = typeof error === "object" && error !== null && "stdout" in error
                ? String(error.stdout)
                : "";
            entries.push({
                scanner: scanner.scanner,
                available: true,
                status: "warning",
                exitCode: typeof error === "object" &&
                    error !== null &&
                    "code" in error &&
                    typeof error.code === "number"
                    ? error.code
                    : 1,
                durationMs: Date.now() - start,
                findings: [
                    {
                        severity: "unknown",
                        file: null,
                        message: redactSecrets(output).slice(0, 300) || "scanner returned non-zero",
                        recommendation: "Review scanner output."
                    }
                ],
                summary: "scanner returned findings or non-zero status"
            });
        }
    }
    const status = entries.some((entry) => entry.status === "fail")
        ? "fail"
        : entries.some((entry) => entry.status === "warning")
            ? "warning"
            : entries.every((entry) => entry.status === "skipped")
                ? "skipped"
                : "pass";
    const result = {
        runId,
        startedAt,
        finishedAt: new Date().toISOString(),
        status,
        scanners: entries
    };
    const store = new RunStore(cwd);
    await store.writeArtifact(runId, "external-scanner-results.json", result);
    const state = await store.readState(runId);
    state.scanners = {
        builtinStatus: state.scanners?.builtinStatus ?? "not_started",
        externalStatus: status === "pass" ? "passed" : status === "fail" ? "failed" : status,
        criticalFindings: state.scanners?.criticalFindings ?? 0,
        highFindings: state.scanners?.highFindings ?? 0
    };
    await store.writeState(state);
    return result;
}
//# sourceMappingURL=scan.js.map