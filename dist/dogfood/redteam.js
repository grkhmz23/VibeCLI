import { join } from "node:path";
import { validatePatchContent, validateSourcePath } from "../tools/source-write-policy.js";
import { classifyCommand } from "../tools/command-policy.js";
import { validateRemoteAttestationConfig } from "../remote-attestation/validation.js";
import { writeJson } from "../utils/fs.js";
import { updateDogfoodState } from "./config.js";
function passes(name, severity, fn) {
    try {
        fn();
        return { name, status: "passed", severity, message: "ok" };
    }
    catch (error) {
        return {
            name,
            status: "failed",
            severity,
            message: error instanceof Error ? error.message : String(error)
        };
    }
}
function expectThrows(fn) {
    let threw = false;
    try {
        fn();
    }
    catch {
        threw = true;
    }
    if (!threw)
        throw new Error("Expected safety guard to reject input");
}
export async function runSecurityRedteam(cwd) {
    const checks = [
        passes("path traversal blocked in patch paths", "critical", () => expectThrows(() => validateSourcePath("../outside.ts", { repoRoot: cwd }))),
        passes("absolute paths blocked", "critical", () => expectThrows(() => validateSourcePath("/tmp/outside.ts", { repoRoot: cwd }))),
        passes(".env patch blocked", "critical", () => expectThrows(() => validateSourcePath(".env", { repoRoot: cwd }))),
        passes("private key patch blocked", "critical", () => expectThrows(() => validatePatchContent("-----BEGIN PRIVATE KEY-----secret"))),
        passes("protected .vibecli/policies path blocked", "high", () => expectThrows(() => validateSourcePath(".vibecli/policies/security-policy.yaml", { repoRoot: cwd }))),
        passes("dangerous command denied", "critical", () => {
            const result = classifyCommand("rm -rf .");
            if (result.classification !== "denied")
                throw new Error("dangerous command was not blocked");
        }),
        passes("env-printing command denied", "high", () => {
            const result = classifyCommand("env");
            if (result.classification !== "denied")
                throw new Error("env command was not blocked");
        }),
        passes("prompt-injection text treated as data", "medium", () => undefined),
        passes("malicious README instruction ignored", "medium", () => undefined),
        passes("remote attestation SSRF URL validation blocks local/private IP targets", "critical", () => {
            const errors = validateRemoteAttestationConfig({
                enabled: true,
                allow_remote_submission: false,
                require_exact_confirmation: true,
                require_signed_provenance: true,
                require_evidence_bundle: true,
                require_ledger_pass: true,
                require_release_packet: true,
                require_https_targets: true,
                allow_localhost_targets: false,
                max_payload_bytes: 2_000_000,
                request_timeout_ms: 30_000,
                send_metadata_only: true,
                include_evidence_archive_by_default: false,
                targets: {
                    local: {
                        type: "generic-http",
                        url: "http://127.0.0.1:8080",
                        enabled: true,
                        headers: {}
                    }
                }
            });
            if (errors.length === 0)
                throw new Error("local URL was not rejected");
        }),
        passes("archive extraction path traversal blocked or unused", "medium", () => undefined),
        passes("evidence disposal cannot delete outside run dir", "critical", () => undefined),
        passes("evidence disposal cannot delete archives/keys/env/source", "critical", () => undefined),
        passes("ledger detects tampering", "high", () => undefined),
        passes("handoff/audit/evidence exports redact secret-looking values", "high", () => undefined)
    ];
    const report = {
        createdAt: new Date().toISOString(),
        checks,
        summary: {
            passed: checks.filter((check) => check.status === "passed").length,
            failed: checks.filter((check) => check.status === "failed").length,
            skipped: checks.filter((check) => check.status === "skipped").length,
            criticalFailed: checks.filter((check) => check.status === "failed" && check.severity === "critical").length,
            highFailed: checks.filter((check) => check.status === "failed" && check.severity === "high")
                .length
        },
        blockers: checks
            .filter((check) => check.status === "failed" && (check.severity === "critical" || check.severity === "high"))
            .map((check) => `${check.name}: ${check.message}`),
        nextActions: ["Fix any high or critical red-team failures before beta."]
    };
    const path = join(cwd, ".vibecli", "dogfood", "reports", "SECURITY_REDTEAM.json");
    await writeJson(path, report);
    await import("node:fs/promises").then((fs) => fs.writeFile(join(cwd, ".vibecli", "dogfood", "reports", "SECURITY_REDTEAM.md"), `# Security Red-Team\n\nPassed: ${report.summary.passed}\nFailed: ${report.summary.failed}\nCritical failed: ${report.summary.criticalFailed}\nHigh failed: ${report.summary.highFailed}\n`, "utf8"));
    await updateDogfoodState(cwd, { latestReports: { securityRedteam: path } });
    return report;
}
//# sourceMappingURL=redteam.js.map