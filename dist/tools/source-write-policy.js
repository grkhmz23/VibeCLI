import { isAbsolute, resolve } from "node:path";
const lockfiles = new Set([
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "bun.lockb",
    "bun.lock"
]);
const protectedPatterns = [
    /^\.git(\/|$)/,
    /^node_modules(\/|$)/,
    /^\.vibecli\/config\.yaml$/,
    /^\.vibecli\/policies(\/|$)/,
    /^\.env($|\.)/,
    /(^|\/)id_rsa$/,
    /(^|\/)id_ed25519$/,
    /(^|\/).*\.pem$/,
    /(^|\/).*\.key$/,
    /(^|\/)secrets\.[^/]+$/,
    /(^|\/).*\.p12$/,
    /(^|\/).*\.pfx$/
];
const osSystemPrefixes = ["/etc/", "/var/", "/usr/", "/bin/", "/sbin/", "/System/", "/Library/"];
export function normalizeRepoPath(path) {
    return path.replaceAll("\\", "/").replace(/^\.\/+/, "");
}
export function validateSourcePath(path, options) {
    if (isAbsolute(path) || /^[A-Za-z]:[\\/]/.test(path)) {
        throw new Error(`Source path must be relative: ${path}`);
    }
    if (osSystemPrefixes.some((prefix) => path.startsWith(prefix))) {
        throw new Error(`Source path targets an OS/system location: ${path}`);
    }
    const normalized = normalizeRepoPath(path);
    if (normalized.split("/").includes("..")) {
        throw new Error(`Source path must not contain traversal: ${path}`);
    }
    const absolute = resolve(options.repoRoot, normalized);
    const root = resolve(options.repoRoot);
    if (absolute !== root && !absolute.startsWith(`${root}/`)) {
        throw new Error(`Source path resolves outside repo root: ${path}`);
    }
    if (protectedPatterns.some((pattern) => pattern.test(normalized))) {
        throw new Error(`Source path is protected: ${path}`);
    }
    if (!options.allowLockfiles && lockfiles.has(normalized)) {
        throw new Error(`Lockfile patching is blocked unless --allow-lockfiles is passed: ${path}`);
    }
    return normalized;
}
function hasUnsafeEnvAssignment(content) {
    const assignmentPattern = /\b(OPENAI_API_KEY|ANTHROPIC_API_KEY|OPENROUTER_API_KEY|JWT_SECRET|DATABASE_URL|API_KEY|SECRET|TOKEN|PASSWORD)\s*=\s*["']?([^\s"']+)/g;
    for (const match of content.matchAll(assignmentPattern)) {
        const name = match[1] ?? "";
        const value = match[2] ?? "";
        const safeReferences = new Set([name, `$${name}`, `\${${name}}`]);
        if (safeReferences.has(value))
            continue;
        if (value.length >= 12)
            return true;
    }
    return false;
}
export function validatePatchContent(content) {
    if (/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(content)) {
        throw new Error("Patch content appears to contain a private key");
    }
    if (hasUnsafeEnvAssignment(content)) {
        throw new Error("Patch content appears to contain a raw secret assignment");
    }
    if (/\b[a-z]+:\/\/[^:\s/]+:[^@\s/]+@[^ \n]+/i.test(content)) {
        throw new Error("Patch content appears to contain a credentialed URL");
    }
    if (/\b[A-Za-z0-9+/=_-]{48,}\b/.test(content)) {
        throw new Error("Patch content contains a high-entropy secret-looking value");
    }
}
export function isProtectedPath(path) {
    const normalized = normalizeRepoPath(path);
    return protectedPatterns.some((pattern) => pattern.test(normalized));
}
//# sourceMappingURL=source-write-policy.js.map