import { execFile } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";
import { loadConfig } from "../config/config.js";
import { verifyLedger } from "../ledger/verify.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { verifyProvenance } from "../provenance/verify.js";
import { RunStore } from "../orchestrator/run-store.js";
import { pathExists, readJson } from "../utils/fs.js";
import { updateProvenanceState } from "../provenance/state.js";
const execFileAsync = promisify(execFile);
async function git(args, cwd) {
    return execFileAsync("git", args, { cwd })
        .then(({ stdout }) => stdout.trim() || null)
        .catch(() => null);
}
async function localTagExists(cwd, tag) {
    return tag ? Boolean(await git(["rev-parse", "-q", "--verify", `refs/tags/${tag}`], cwd)) : false;
}
async function remoteTagExists(cwd, tag) {
    if (!tag)
        return null;
    const output = await git(["ls-remote", "--tags", "origin", `refs/tags/${tag}`], cwd);
    return output === null ? null : output.length > 0;
}
export async function githubReleaseDraft(cwd, runId, options = {}) {
    const config = await loadConfig(cwd);
    const store = new RunStore(cwd);
    const runPath = store.runPath(runId);
    const tagPlan = await readJson(join(runPath, "release", "tag-plan.json")).catch(() => undefined);
    const readiness = await readJson(join(runPath, "release", "release-readiness.json")).catch(() => undefined);
    const tag = options.tag ?? tagPlan?.tag ?? null;
    const notesPath = "release/RELEASE_NOTES.md";
    const result = {
        runId,
        createdAt: new Date().toISOString(),
        mode: "preview",
        tag,
        title: tag ? `Release ${tag}` : `Release ${runId}`,
        notesPath,
        channel: readiness?.channel ?? null,
        releaseReadiness: readiness?.verdict ?? null,
        localTagExists: await localTagExists(cwd, tag),
        remoteTagExists: options.checkRemoteTag ? await remoteTagExists(cwd, tag) : null,
        draftUrl: null,
        warnings: [],
        errors: []
    };
    if (!options.createDraft && !options.updateDraft) {
        await writeDraftArtifacts(store, runId, result);
        return result;
    }
    const expected = options.updateDraft
        ? `UPDATE RELEASE DRAFT ${runId}`
        : `CREATE RELEASE DRAFT ${runId}`;
    if (options.confirm !== expected)
        throw new Error(`GitHub release draft mutation requires exact confirmation: ${expected}`);
    if (!config.provenance.github_release.allow_draft_creation)
        result.errors.push("GitHub release draft creation is disabled by config.");
    if (!pathExists(join(runPath, notesPath)))
        result.errors.push("Release notes are missing.");
    if (!options.allowUnsignedProvenance &&
        !(await verifyProvenance(cwd, runId).catch(() => undefined))?.ok) {
        result.errors.push("Signed provenance verification is required.");
    }
    if (!options.allowLedgerWarning && !(await verifyLedger(cwd, runId).catch(() => undefined))?.ok) {
        result.errors.push("Ledger verification is required.");
    }
    if (!options.allowBlocked && readiness?.verdict === "blocked")
        result.errors.push("Release readiness is blocked.");
    if (!result.localTagExists)
        result.errors.push("Local tag is missing.");
    if (config.provenance.github_release.require_existing_remote_tag) {
        result.remoteTagExists = await remoteTagExists(cwd, tag);
        if (!result.remoteTagExists) {
            result.errors.push("Remote tag is missing. VibeCLI Phase 10 does not push tags. Push the tag manually if policy allows.");
        }
    }
    if (result.errors.length === 0 && tag) {
        const args = options.updateDraft
            ? [
                "release",
                "edit",
                tag,
                "--draft",
                "--title",
                result.title,
                "--notes-file",
                join(runPath, notesPath)
            ]
            : [
                "release",
                "create",
                tag,
                "--draft",
                "--title",
                result.title,
                "--notes-file",
                join(runPath, notesPath)
            ];
        const { stdout } = await execFileAsync("gh", args, { cwd, timeout: 60_000 });
        result.mode = options.updateDraft ? "draft_created" : "draft_created";
        result.draftUrl = stdout.trim() || null;
    }
    else if (result.errors.length > 0) {
        result.mode = "failed";
    }
    await writeDraftArtifacts(store, runId, result);
    await writeLedgerManifest(cwd, runId);
    return result;
}
async function writeDraftArtifacts(store, runId, result) {
    await store.writeArtifact(runId, "github/github-release-draft.json", result);
    await store.writeTextArtifact(runId, "github/GITHUB_RELEASE_DRAFT.md", renderDraft(result));
    await updateProvenanceState(store, runId, (provenance) => {
        provenance.githubReleaseDraft = {
            status: result.mode === "draft_created"
                ? "draft_created"
                : result.mode === "failed"
                    ? "failed"
                    : "previewed",
            url: result.draftUrl ?? undefined
        };
    });
}
function renderDraft(result) {
    return `# GitHub Release Draft Preview

Mode: ${result.mode}

Tag: ${result.tag ?? "unknown"}

Title: ${result.title}

Notes: ${result.notesPath}

Release readiness: ${result.releaseReadiness ?? "unknown"}

Local tag exists: ${result.localTagExists}

Remote tag exists: ${result.remoteTagExists === null ? "not_checked" : result.remoteTagExists}

Exact create command:

\`\`\`bash
vibe github release ${result.runId} --create-draft --confirm "CREATE RELEASE DRAFT ${result.runId}"
\`\`\`

No release is published. No assets are uploaded. No tag or branch is pushed.
`;
}
//# sourceMappingURL=release-draft.js.map