import { gzip } from "node:zlib";
import { promisify } from "node:util";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { sha256File } from "../ledger/hash.js";
import { RunStore } from "../orchestrator/run-store.js";
import { pathExists, readJson } from "../utils/fs.js";
import { redactReleaseText } from "../release/redaction.js";
import { signProvenance } from "./envelope.js";
import { verifyProvenance } from "./verify.js";
import { createChecksums } from "./checksums.js";
import { updateProvenanceState } from "./state.js";
const gzipAsync = promisify(gzip);
const evidenceFiles = [
    "release/RELEASE_PACKET.md",
    "release/RELEASE_SUMMARY.json",
    "release/RELEASE_NOTES.md",
    "release/RELEASE_READINESS.md",
    "release/DEPLOYMENT_READINESS.md",
    "release/CI_STATUS.md",
    "handoff/HANDOFF.md",
    "handoff/HANDOFF_SUMMARY.json",
    "handoff/PR_DESCRIPTION.md",
    "handoff/REVIEW_CHECKLIST.md",
    "git/repository-lifecycle.json",
    "git/MERGE_READINESS.md",
    "verification-results.json",
    "scanner-results.json",
    "external-scanner-results.json",
    "ledger-manifest.json",
    "provenance/provenance-statement.json",
    "provenance/provenance-envelope.json",
    "provenance/CHECKSUMS.txt"
];
export async function createEvidenceBundle(cwd, runId, options = {}) {
    if (options.sign) {
        if (options.confirm !== `SIGN EVIDENCE ${runId}`) {
            throw new Error(`Evidence signing requires exact confirmation: SIGN EVIDENCE ${runId}`);
        }
        const verified = await verifyProvenance(cwd, runId).catch(() => undefined);
        if (!verified?.ok)
            await signProvenance(cwd, runId, { confirm: `SIGN PROVENANCE ${runId}` });
    }
    await createChecksums(cwd, runId).catch(() => undefined);
    const store = new RunStore(cwd);
    const runPath = store.runPath(runId);
    const archive = {};
    const files = [];
    for (const file of evidenceFiles) {
        if (file.includes(".vibecli/keys") || file.endsWith(".private.pem") || file.includes(".env"))
            continue;
        const fullPath = join(runPath, file);
        if (!pathExists(fullPath))
            continue;
        const content = sanitizeEvidenceContent(file, await readFile(fullPath, "utf8"));
        archive[file] = content;
        const hash = await sha256File(fullPath);
        files.push({ path: file, ...hash });
    }
    const archivePath = join(runPath, "evidence", `vibecli-evidence-${runId}.tar.gz`);
    await store.writeTextArtifact(runId, "evidence/EVIDENCE_BUNDLE.md", renderEvidence(files, options.sign ?? false));
    await writeFile(archivePath, await gzipAsync(JSON.stringify(archive, null, 2)));
    const archiveHash = await sha256File(archivePath);
    const manifest = {
        runId,
        createdAt: new Date().toISOString(),
        algorithm: "sha256",
        archivePath: `evidence/vibecli-evidence-${runId}.tar.gz`,
        archiveSha256: archiveHash.sha256,
        files,
        signed: Boolean(options.sign),
        provenanceEnvelopePath: pathExists(join(runPath, "provenance", "provenance-envelope.json"))
            ? "provenance/provenance-envelope.json"
            : null
    };
    await store.writeArtifact(runId, "evidence/EVIDENCE_MANIFEST.json", manifest);
    await updateProvenanceState(store, runId, (provenance) => {
        provenance.evidence = {
            status: options.sign ? "signed" : "generated",
            archivePath: manifest.archivePath
        };
    });
    await writeLedgerManifest(cwd, runId);
    return manifest;
}
export async function verifyEvidenceBundle(cwd, runId) {
    const store = new RunStore(cwd);
    const manifest = await readJson(join(store.runPath(runId), "evidence", "EVIDENCE_MANIFEST.json"));
    const archivePath = join(store.runPath(runId), manifest.archivePath);
    const checks = [];
    if (!pathExists(archivePath))
        checks.push({ name: "archive", ok: false, message: "missing" });
    else {
        const hash = await sha256File(archivePath);
        checks.push({
            name: "archive",
            ok: hash.sha256 === manifest.archiveSha256,
            message: hash.sha256 === manifest.archiveSha256 ? "ok" : "hash mismatch"
        });
    }
    if (manifest.provenanceEnvelopePath) {
        const provenance = await verifyProvenance(cwd, runId).catch(() => undefined);
        checks.push({
            name: "provenance",
            ok: provenance?.ok ?? false,
            message: provenance?.ok ? "ok" : "provenance verification failed"
        });
    }
    const ok = checks.every((check) => check.ok);
    await updateProvenanceState(store, runId, (provenance) => {
        provenance.evidence = {
            status: ok ? "verified" : "invalid",
            archivePath: manifest.archivePath
        };
    });
    return { runId, ok, checks };
}
function renderEvidence(files, signed) {
    return `# Evidence Bundle

Signed: ${signed}

Files:
${files.map((file) => `- ${file.path}`).join("\n") || "- none"}

Private keys, raw agent outputs, .env files, deployment logs, package publishing logs, and full run directories are excluded.
`;
}
function sanitizeEvidenceContent(file, content) {
    if (file === "ledger-manifest.json") {
        try {
            const parsed = JSON.parse(content);
            parsed.entries = (parsed.entries ?? []).filter((entry) => {
                const entryPath = entry.path ?? "";
                return (!entryPath.includes("agent-outputs") &&
                    !entryPath.includes("agent-events") &&
                    !entryPath.startsWith("agents/"));
            });
            return redactReleaseText(JSON.stringify(parsed, null, 2));
        }
        catch {
            return redactReleaseText(content);
        }
    }
    return redactReleaseText(content);
}
//# sourceMappingURL=evidence-bundle.js.map