import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { loadConfig } from "../config/config.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { RunStore } from "../orchestrator/run-store.js";
import { pathExists } from "../utils/fs.js";
import { redactReleaseText } from "./redaction.js";
import { updateReleaseState } from "./state.js";
const semver = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
export function isSemver(value) {
    return semver.test(value);
}
function compareSemver(a, b) {
    const left = semver.exec(a);
    const right = semver.exec(b);
    if (!left || !right)
        throw new Error("Cannot compare invalid semver");
    for (const index of [1, 2, 3]) {
        const diff = Number(left[index]) - Number(right[index]);
        if (diff !== 0)
            return diff;
    }
    return 0;
}
function bumpVersion(current, bump, preid) {
    const match = semver.exec(current);
    if (!match)
        throw new Error(`Invalid semver version: ${current}`);
    const major = Number(match[1]);
    const minor = Number(match[2]);
    const patch = Number(match[3]);
    if (bump === "major")
        return `${major + 1}.0.0`;
    if (bump === "minor")
        return `${major}.${minor + 1}.0`;
    if (bump === "patch")
        return `${major}.${minor}.${patch + 1}`;
    if (bump === "prerelease")
        return `${major}.${minor}.${patch + 1}-${preid ?? "beta"}.0`;
    return current;
}
function inferBump(prompt) {
    const value = prompt.toLowerCase();
    if (/\bbreaking\b|major/.test(value))
        return "major";
    if (/\bsecurity\b|\bfix\b|bug/.test(value))
        return "patch";
    if (/\badd\b|\bfeature\b|\bnew\b/.test(value))
        return "minor";
    return "patch";
}
async function detectedVersionFiles(cwd) {
    const files = [];
    const packagePath = join(cwd, "package.json");
    if (pathExists(packagePath)) {
        const pkg = JSON.parse(await readFile(packagePath, "utf8"));
        if (typeof pkg.version === "string")
            files.push({ path: "package.json", currentVersion: pkg.version });
    }
    for (const path of ["pyproject.toml", "Cargo.toml"]) {
        const fullPath = join(cwd, path);
        if (!pathExists(fullPath))
            continue;
        const match = /^\s*version\s*=\s*"([^"]+)"/m.exec(await readFile(fullPath, "utf8"));
        if (match?.[1])
            files.push({ path, currentVersion: match[1] });
    }
    return files;
}
export async function planVersion(cwd, runId, options = {}) {
    const store = new RunStore(cwd);
    const state = await store.readState(runId);
    const config = await loadConfig(cwd);
    const files = await detectedVersionFiles(cwd);
    const warnings = [];
    const currentVersion = files[0]?.currentVersion ?? null;
    let bump = options.bump ?? inferBump(state.prompt);
    if (options.version && currentVersion && options.version === currentVersion)
        bump = "none";
    if (bump === "major" && options.confirmMajor !== `PLAN MAJOR ${runId}`) {
        throw new Error(`Major version planning requires exact confirmation: PLAN MAJOR ${runId}`);
    }
    if (options.preid && !config.release.versioning.prerelease_identifiers.includes(options.preid)) {
        throw new Error(`Prerelease identifier ${options.preid} is not allowed`);
    }
    if (files.length === 0)
        warnings.push("No package.json, pyproject.toml, or Cargo.toml version found.");
    for (const file of files) {
        if (!isSemver(file.currentVersion))
            throw new Error(`${file.path} version is not semver: ${file.currentVersion}`);
    }
    const plannedVersion = options.version ??
        (currentVersion ? bumpVersion(currentVersion, bump, options.preid ?? null) : null);
    if (plannedVersion && !isSemver(plannedVersion))
        throw new Error(`Invalid semver version: ${plannedVersion}`);
    if (currentVersion &&
        plannedVersion &&
        compareSemver(plannedVersion, currentVersion) < 0 &&
        !options.allowDowngrade) {
        throw new Error("Version downgrade requires --allow-downgrade");
    }
    const plan = {
        runId,
        createdAt: new Date().toISOString(),
        currentVersion,
        plannedVersion,
        bump,
        prereleaseIdentifier: options.preid ?? null,
        files: files.map((file) => ({
            path: file.path,
            currentVersion: file.currentVersion,
            plannedVersion: plannedVersion ?? file.currentVersion
        })),
        reason: redactReleaseText(`Planned ${bump} version bump from run prompt: ${state.prompt}`),
        warnings
    };
    await store.writeArtifact(runId, "release/version-plan.json", plan);
    await store.writeTextArtifact(runId, "release/VERSION_PLAN.md", renderVersionPlan(plan));
    await updateReleaseState(store, runId, (release) => {
        release.version = {
            status: "planned",
            currentVersion: plan.currentVersion ?? undefined,
            plannedVersion: plan.plannedVersion ?? undefined
        };
    });
    await writeLedgerManifest(cwd, runId);
    return plan;
}
export function renderVersionPlan(plan) {
    return `# Version Plan

Run id: ${plan.runId}

Current version: ${plan.currentVersion ?? "unknown"}

Planned version: ${plan.plannedVersion ?? "unknown"}

Bump: ${plan.bump}

Files:
${plan.files.map((file) => `- ${file.path}: ${file.currentVersion} -> ${file.plannedVersion}`).join("\n") || "- none"}

Warnings:
${plan.warnings.map((warning) => `- ${warning}`).join("\n") || "- none"}
`;
}
//# sourceMappingURL=version.js.map