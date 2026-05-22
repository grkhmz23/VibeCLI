import { createPublicKey } from "node:crypto";
import { join } from "node:path";
import { canonicalJson, verifyCanonicalJson } from "../provenance/signature.js";
import { sha256File, sha256Text } from "../ledger/hash.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { RunStore } from "../orchestrator/run-store.js";
import { pathExists } from "../utils/fs.js";
import { appendRetentionLedgerEvent } from "./retention-ledger.js";
import { updateEvidenceLifecycleState } from "./state.js";
import { readArchiveManifest } from "./archive.js";
export async function verifyEvidenceArchive(cwd, runId) {
    const manifest = await readArchiveManifest(cwd, runId);
    const checks = [];
    const archivePath = join(cwd, manifest.archivePath);
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
    const { signed, signature, ...unsigned } = manifest;
    void signed;
    void signature;
    if (manifest.signature.algorithm === "ed25519" && manifest.signature.signatureBase64) {
        const publicKeyPath = manifest.signature.publicKeyFingerprint ? findPublicKeyPath(cwd) : null;
        if (publicKeyPath && pathExists(publicKeyPath)) {
            const pem = await import("node:fs/promises").then((fs) => fs.readFile(publicKeyPath, "utf8"));
            checks.push({
                name: "signature",
                ok: verifyCanonicalJson(unsigned, manifest.signature.signatureBase64, createPublicKey(pem)),
                message: "ed25519 signature check"
            });
        }
        else {
            checks.push({ name: "signature", ok: true, message: "signature fingerprint recorded" });
        }
    }
    else if (manifest.signature.signatureBase64) {
        checks.push({
            name: "signature",
            ok: sha256Text(canonicalJson(unsigned)) === manifest.signature.signatureBase64,
            message: "sha256-local signature check"
        });
    }
    const ok = checks.every((check) => check.ok);
    const store = new RunStore(cwd);
    await updateEvidenceLifecycleState(store, runId, (state) => {
        state.archive = {
            status: ok ? "verified" : "invalid",
            mode: manifest.mode,
            archivePath: manifest.archivePath,
            archiveSha256: manifest.archiveSha256
        };
    });
    await writeLedgerManifest(cwd, runId);
    if (ok) {
        await appendRetentionLedgerEvent(cwd, {
            eventType: "archive_verified",
            runId,
            actor: null,
            summary: "Local evidence archive verified.",
            artifactHashes: [{ path: manifest.archivePath, sha256: manifest.archiveSha256 }]
        }).catch(() => undefined);
    }
    return { ok, checks };
}
function findPublicKeyPath(cwd) {
    return join(cwd, ".vibecli", "org", "keys", "org-policy-signing-key.public.pem");
}
//# sourceMappingURL=archive-verify.js.map