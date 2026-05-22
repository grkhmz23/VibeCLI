import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathExists } from "../utils/fs.js";
import { isProtectedPath } from "../tools/source-write-policy.js";
function result(scanner, findings) {
    if (findings.some((finding) => finding.severity === "critical" || finding.severity === "high")) {
        return { scanner, status: "fail", findings };
    }
    if (findings.length > 0)
        return { scanner, status: "warning", findings };
    return { scanner, status: "pass", findings: [] };
}
export function protectedFileTouchScanner(context) {
    return Promise.resolve(result("protected-file-touch", context.filesChanged.filter(isProtectedPath).map((file) => ({
        severity: "critical",
        file,
        message: "Protected file was touched",
        recommendation: "Rollback and inspect the patch manifest."
    }))));
}
export async function secretPatternScanner(context) {
    const findings = [];
    for (const file of context.filesChanged) {
        const fullPath = join(context.repoRoot, file);
        if (!pathExists(fullPath) || isProtectedPath(file))
            continue;
        const content = await readFile(fullPath, "utf8");
        if (/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(content) ||
            /\b[A-Za-z0-9+/=_-]{48,}\b/.test(content)) {
            findings.push({
                severity: "high",
                file,
                message: "Secret-looking content detected after apply",
                recommendation: "Remove the secret and rotate any exposed credential."
            });
        }
    }
    return result("secret-pattern", findings);
}
export async function envExampleScanner(context) {
    let hasEnvReference = false;
    for (const file of context.filesChanged) {
        const fullPath = join(context.repoRoot, file);
        if (!pathExists(fullPath) || isProtectedPath(file))
            continue;
        const content = await readFile(fullPath, "utf8");
        if (/process\.env\.[A-Z0-9_]+|\$\{[A-Z0-9_]+}/.test(content)) {
            hasEnvReference = true;
            break;
        }
    }
    const hasEnvExample = pathExists(join(context.repoRoot, ".env.example"));
    return result("env-example", hasEnvReference && !hasEnvExample
        ? [
            {
                severity: "low",
                file: null,
                message: "Repository has changed files but no .env.example",
                recommendation: "Add .env.example when new environment variables are introduced."
            }
        ]
        : []);
}
export async function packageScriptScanner(context) {
    const packagePath = join(context.repoRoot, "package.json");
    if (!pathExists(packagePath)) {
        return { scanner: "package-script", status: "skipped", findings: [] };
    }
    const pkg = JSON.parse(await readFile(packagePath, "utf8"));
    const scripts = pkg.scripts ?? {};
    return result("package-script", ["test", "build", "lint"].some((name) => scripts[name])
        ? []
        : [
            {
                severity: "low",
                file: "package.json",
                message: "Common test/build/lint scripts are not all present",
                recommendation: "Consider adding scripts that support verification."
            }
        ]);
}
export function testPresenceScanner(context) {
    const changedTests = context.filesChanged.some((file) => /(\.|\/)(test|spec)\./.test(file) || file.includes("__tests__/"));
    return Promise.resolve(result("test-presence", changedTests
        ? []
        : [
            {
                severity: "low",
                file: null,
                message: "No changed test files were detected",
                recommendation: "Review whether tests should be added for this change."
            }
        ]));
}
//# sourceMappingURL=builtin.js.map