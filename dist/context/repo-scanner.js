import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { pathExists } from "../utils/fs.js";
import { hasGit } from "../utils/git.js";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const execFileAsync = promisify(execFile);
const ignoredDirs = new Set([
    "node_modules",
    ".git",
    ".next",
    "dist",
    "build",
    "coverage",
    "target",
    "vendor",
    ".pnpm-data",
    ".pnpm-cache"
]);
function isSourceFile(path) {
    return /\.(ts|tsx|js|jsx|mjs|cjs|rs|swift)$/.test(path);
}
function isTestFile(path) {
    return /(\.|\/)(test|spec)\.(ts|tsx|js|jsx|mjs|cjs)$/.test(path) || path.includes("__tests__/");
}
function packageManagerFromFiles(files) {
    if (files.has("pnpm-lock.yaml"))
        return "pnpm";
    if (files.has("package-lock.json"))
        return "npm";
    if (files.has("yarn.lock"))
        return "yarn";
    if (files.has("bun.lockb") || files.has("bun.lock"))
        return "bun";
    return "unknown";
}
function importantConfig(path) {
    return (path === "package.json" ||
        path === "tsconfig.json" ||
        /^vite\.config\./.test(path) ||
        /^next\.config\./.test(path) ||
        /^eslint\.config\./.test(path) ||
        path === "Dockerfile" ||
        /^docker-compose\./.test(path) ||
        path === "prisma/schema.prisma" ||
        /drizzle.*config/.test(path) ||
        path.startsWith(".github/workflows/") ||
        path === "render.yaml" ||
        path === "vercel.json" ||
        path === "netlify.toml" ||
        path === "amplify.yml");
}
async function listFiles(root, dir = root) {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        if (entry.isDirectory() && ignoredDirs.has(entry.name))
            continue;
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...(await listFiles(root, fullPath)));
        }
        else if (entry.isFile()) {
            files.push(relative(root, fullPath));
        }
    }
    return files;
}
function detectFrameworks(packageJson, files) {
    const deps = new Set([
        ...Object.keys(packageJson?.dependencies ?? {}),
        ...Object.keys(packageJson?.devDependencies ?? {})
    ]);
    const frameworks = new Set();
    if (deps.has("next"))
        frameworks.add("Next.js");
    if (deps.has("vite"))
        frameworks.add("Vite");
    if (deps.has("react"))
        frameworks.add("React");
    if (deps.has("express"))
        frameworks.add("Express");
    if (deps.has("fastify"))
        frameworks.add("Fastify");
    if (deps.has("@nestjs/core"))
        frameworks.add("NestJS");
    if (deps.has("prisma") || deps.has("@prisma/client") || files.has("prisma/schema.prisma")) {
        frameworks.add("Prisma");
    }
    if ([...deps].some((dep) => dep.includes("drizzle")) ||
        [...files].some((file) => /drizzle.*config/.test(file))) {
        frameworks.add("Drizzle");
    }
    if (deps.has("expo"))
        frameworks.add("Expo");
    if (deps.has("react-native"))
        frameworks.add("React Native");
    if ([...files].some((file) => file.endsWith(".swift")))
        frameworks.add("Swift/iOS");
    if (files.has("Cargo.toml"))
        frameworks.add("Rust");
    if (deps.has("@coral-xyz/anchor") || files.has("Anchor.toml"))
        frameworks.add("Anchor/Solana");
    if (files.has("tsconfig.json"))
        frameworks.add("generic TypeScript");
    if (frameworks.size === 0)
        frameworks.add("unknown");
    return [...frameworks].sort();
}
async function readPackageJson(root) {
    const path = join(root, "package.json");
    if (!pathExists(path))
        return undefined;
    const stats = await stat(path);
    if (stats.size > 200_000)
        return undefined;
    return JSON.parse(await readFile(path, "utf8"));
}
async function gitStatus(root) {
    if (!(await hasGit()))
        return "git unavailable";
    try {
        const { stdout } = await execFileAsync("git", ["status", "--short"], { cwd: root });
        return stdout.trim();
    }
    catch {
        return "not a git repository";
    }
}
export async function scanRepoContext(root) {
    const files = new Set(await listFiles(root));
    const packageJson = await readPackageJson(root);
    const scripts = Object.fromEntries(Object.entries(packageJson?.scripts ?? {}).filter((entry) => typeof entry[1] === "string"));
    return {
        repoRoot: root,
        gitStatus: await gitStatus(root),
        packageManager: packageManagerFromFiles(files),
        packageScripts: scripts,
        dependencySummary: {
            dependencies: Object.keys(packageJson?.dependencies ?? {}).sort(),
            devDependencies: Object.keys(packageJson?.devDependencies ?? {}).sort()
        },
        detectedFrameworks: detectFrameworks(packageJson, files),
        importantConfigFiles: [...files].filter(importantConfig).sort(),
        testFilesCount: [...files].filter(isTestFile).length,
        sourceFilesCount: [...files].filter(isSourceFile).length,
        hasEnvExample: [...files].some((file) => file === ".env.example" || file.endsWith("/.env.example")),
        hasGitignore: files.has(".gitignore"),
        hasReadme: [...files].some((file) => /^readme\.md$/i.test(file)),
        hasSecurityMd: files.has("SECURITY.md")
    };
}
//# sourceMappingURL=repo-scanner.js.map