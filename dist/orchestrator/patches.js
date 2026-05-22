import { join } from "node:path";
import { ensureDir } from "../utils/fs.js";
const deniedPathPatterns = [
    /^\.env($|\.)/,
    /^\.git\//,
    /^node_modules\//,
    /^\.vibecli\/config\.yaml$/,
    /^\.vibecli\/policies\//,
    /(^|\/)id_rsa$/,
    /(^|\/)id_ed25519$/,
    /(^|\/).*private.*key/i,
    /(^|\/)pnpm-lock\.yaml$/,
    /(^|\/)package-lock\.json$/,
    /(^|\/)yarn\.lock$/,
    /(^|\/)bun\.lockb?$/
];
export function validatePatchPath(path) {
    if (path.startsWith("/") || /^[A-Za-z]:[\\/]/.test(path)) {
        throw new Error(`Patch path must be relative: ${path}`);
    }
    if (path.split(/[\\/]/).includes("..")) {
        throw new Error(`Patch path must not contain traversal: ${path}`);
    }
    const normalized = path.replaceAll("\\", "/");
    if (deniedPathPatterns.some((pattern) => pattern.test(normalized))) {
        throw new Error(`Patch path is blocked by Phase 2 safety policy: ${path}`);
    }
}
export function collectPatchProposals(outputs) {
    const entries = [];
    for (const agent of ["implementation", "test", "fixer"]) {
        const output = outputs[agent];
        if (typeof output !== "object" || output === null || !("patches" in output))
            continue;
        const patches = output.patches;
        if (!Array.isArray(patches))
            continue;
        for (const patch of patches) {
            entries.push({ agent, patch: patch });
        }
    }
    return entries;
}
export async function writePatchArtifacts(args) {
    await ensureDir(join(args.store.runPath(args.runId), "patches"));
    const manifest = { runId: args.runId, createdAt: args.createdAt, patches: [] };
    const grouped = new Map();
    for (const { agent, patch } of collectPatchProposals(args.outputs)) {
        validatePatchPath(patch.path);
        const artifactPath = `patches/${agent}.patch`;
        grouped.set(agent, [...(grouped.get(agent) ?? []), patch.unified_diff]);
        manifest.patches.push({
            agent,
            path: patch.path,
            operation: patch.operation,
            artifactPath,
            rationale: patch.rationale,
            applied: false
        });
    }
    for (const [agent, diffs] of grouped) {
        await args.store.writeTextArtifact(args.runId, `patches/${agent}.patch`, diffs.join("\n\n"));
    }
    if (!grouped.has("implementation")) {
        await args.store.writeTextArtifact(args.runId, "patches/implementation.patch", "");
    }
    if (!grouped.has("test")) {
        await args.store.writeTextArtifact(args.runId, "patches/test.patch", "");
    }
    await args.store.writeArtifact(args.runId, "patches/manifest.json", manifest);
    return manifest;
}
//# sourceMappingURL=patches.js.map