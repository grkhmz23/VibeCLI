import { join, relative, resolve } from "node:path";
import { sha256File } from "../ledger/hash.js";
import { verifyLedger } from "../ledger/verify.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { verifyEvidenceArchive } from "../evidence-lifecycle/archive-verify.js";
import { verifyRetentionLedger } from "../evidence-lifecycle/retention-ledger-verify.js";
import { appendRetentionLedgerEvent } from "../evidence-lifecycle/retention-ledger.js";
import { RunStore } from "../orchestrator/run-store.js";
import { pathExists, readJson } from "../utils/fs.js";
import { loadDisposalConfig } from "./config.js";
import { isProtectedDisposalPath } from "./classifier.js";
import { updateEvidenceDisposalState } from "./state.js";
export async function runDisposalPrecheck(cwd, runId) {
    const config = await loadDisposalConfig(cwd);
    const store = new RunStore(cwd);
    const runPath = store.runPath(runId);
    const planPath = join(runPath, "evidence-lifecycle", "disposal", "DISPOSAL_PLAN.json");
    const checks = [];
    if (!pathExists(planPath)) {
        checks.push({ name: "disposal plan exists", ok: false, blocking: true, message: "missing" });
        return writePrecheck(cwd, runId, checks);
    }
    const plan = await readJson(planPath);
    checks.push({
        name: "disposal plan status ready",
        ok: plan.status === "ready" || plan.status === "ready_with_warnings",
        blocking: true,
        message: plan.status
    });
    const legalHoldPath = join(runPath, "evidence-lifecycle", "LEGAL_HOLD.json");
    const legalHold = pathExists(legalHoldPath)
        ? await readJson(legalHoldPath).catch(() => undefined)
        : undefined;
    checks.push({
        name: "legal hold not enabled",
        ok: legalHold?.status !== "enabled",
        blocking: true,
        message: legalHold?.status === "enabled" ? "blocked by legal hold" : "ok"
    });
    checks.push({
        name: "candidate list exists",
        ok: pathExists(join(runPath, "evidence-lifecycle", "disposal", "DISPOSAL_CANDIDATES.json")),
        blocking: true,
        message: "candidate artifact"
    });
    let totalFiles = 0;
    let totalBytes = 0;
    for (const candidate of plan.candidates) {
        totalFiles += 1;
        totalBytes += candidate.sizeBytes;
        const fullPath = join(runPath, candidate.path);
        const inside = isInside(runPath, fullPath);
        checks.push({
            name: `candidate inside run ${candidate.path}`,
            ok: inside,
            blocking: true,
            message: inside ? "ok" : "outside run directory"
        });
        checks.push({
            name: `candidate protected ${candidate.path}`,
            ok: !isProtectedDisposalPath(candidate.path),
            blocking: true,
            message: isProtectedDisposalPath(candidate.path) ? "protected path" : "ok"
        });
        if (pathExists(fullPath)) {
            const hash = await sha256File(fullPath);
            checks.push({
                name: `candidate hash ${candidate.path}`,
                ok: hash.sha256 === candidate.sha256 && hash.sizeBytes === candidate.sizeBytes,
                blocking: true,
                message: hash.sha256 === candidate.sha256 ? "ok" : "hash mismatch"
            });
        }
        else {
            checks.push({
                name: `candidate exists ${candidate.path}`,
                ok: false,
                blocking: true,
                message: "missing"
            });
        }
    }
    checks.push({
        name: "file count within limit",
        ok: totalFiles <= config.max_files_per_disposal,
        blocking: true,
        message: `${totalFiles}/${config.max_files_per_disposal}`
    });
    checks.push({
        name: "byte count within limit",
        ok: totalBytes <= config.max_bytes_per_disposal,
        blocking: true,
        message: `${totalBytes}/${config.max_bytes_per_disposal}`
    });
    if (config.require_archive_verified) {
        const archive = await verifyEvidenceArchive(cwd, runId).catch(() => ({ ok: false }));
        checks.push({
            name: "archive verified",
            ok: archive.ok,
            blocking: true,
            message: archive.ok ? "ok" : "invalid"
        });
    }
    if (config.require_retention_ledger) {
        const retentionLedger = await verifyRetentionLedger(cwd, runId).catch(() => ({ ok: false }));
        await writeLedgerManifest(cwd, runId).catch(() => undefined);
        const runLedger = await verifyLedger(cwd, runId).catch(() => ({ ok: false }));
        checks.push({
            name: "retention ledger valid",
            ok: Boolean(retentionLedger.ok && runLedger.ok),
            blocking: true,
            message: retentionLedger.ok && runLedger.ok ? "ok" : "invalid"
        });
    }
    if (config.require_disposal_attestation) {
        checks.push({
            name: "disposal attestation present",
            ok: pathExists(join(runPath, "evidence-lifecycle", "disposal", "DISPOSAL_ATTESTATION.json")),
            blocking: true,
            message: "attestation artifact"
        });
    }
    if (config.require_org_approval) {
        const approvals = pathExists(join(runPath, "evidence-lifecycle", "disposal", "DISPOSAL_APPROVALS.json"))
            ? await readJson(join(runPath, "evidence-lifecycle", "disposal", "DISPOSAL_APPROVALS.json")).catch(() => undefined)
            : undefined;
        checks.push({
            name: "disposal approval quorum met",
            ok: approvals?.quorum?.status === "met",
            blocking: true,
            message: approvals?.quorum?.status ?? "missing"
        });
    }
    return writePrecheck(cwd, runId, checks);
}
async function writePrecheck(cwd, runId, checks) {
    const store = new RunStore(cwd);
    const ok = checks.every((check) => !check.blocking || check.ok);
    const result = {
        runId,
        createdAt: new Date().toISOString(),
        ok,
        checks,
        warnings: ["Precheck is local only. No evidence was deleted."],
        nextActions: ok
            ? [
                `vibe disposal-execute ${runId} --dry-run`,
                `vibe disposal-execute ${runId} --confirm "DELETE EVIDENCE ${runId}"`
            ]
            : [`Resolve blocking checks, then run vibe disposal-precheck ${runId}`]
    };
    await store.writeArtifact(runId, "evidence-lifecycle/disposal/DISPOSAL_PRECHECK.json", result);
    await store.writeTextArtifact(runId, "evidence-lifecycle/disposal/DISPOSAL_PRECHECK.md", renderPrecheck(result));
    await updateEvidenceDisposalState(store, runId, (state) => {
        state.precheck = { status: ok ? "passed" : "failed" };
    });
    await writeLedgerManifest(cwd, runId).catch(() => undefined);
    if (ok) {
        await appendRetentionLedgerEvent(cwd, {
            eventType: "disposal_precheck_passed",
            runId,
            actor: null,
            summary: "Disposal precheck passed.",
            artifactHashes: []
        }).catch(() => undefined);
    }
    return result;
}
function isInside(root, path) {
    const rel = relative(resolve(root), resolve(path));
    return rel === "" || (!rel.startsWith("..") && !rel.startsWith("/"));
}
function renderPrecheck(result) {
    return `# Disposal Precheck

Run id: ${result.runId}
OK: ${result.ok}

Checks:
${result.checks.map((check) => `- ${check.name}: ${check.ok ? "ok" : "failed"} (${check.message})`).join("\n")}

No evidence was deleted.
`;
}
//# sourceMappingURL=predelete.js.map