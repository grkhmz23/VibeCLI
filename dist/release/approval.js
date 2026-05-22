import { join } from "node:path";
import { sha256File } from "../ledger/hash.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { readApprovalNotes, renderApprovalNotes } from "../approvals/notes.js";
import { localPayloadSignature } from "../approvals/signature.js";
import { RunStore } from "../orchestrator/run-store.js";
import { pathExists } from "../utils/fs.js";
import { redactReleaseText } from "./redaction.js";
import { generateReleasePacket } from "./packet.js";
async function hashIfExists(runPath, path) {
    const fullPath = join(runPath, path);
    return pathExists(fullPath) ? { path, sha256: (await sha256File(fullPath)).sha256 } : undefined;
}
export async function addReleaseApproval(cwd, runId, args) {
    if (!args.decision && !args.reviewer && !args.note)
        return readApprovalNotes(cwd, runId);
    if (args.confirm !== `ADD RELEASE APPROVAL ${runId}`) {
        throw new Error(`Release approval requires exact confirmation: ADD RELEASE APPROVAL ${runId}`);
    }
    if (!args.decision || !args.reviewer?.trim() || !args.note?.trim()) {
        throw new Error("Release approval decision, reviewer, and note are required.");
    }
    const store = new RunStore(cwd);
    const runPath = store.runPath(runId);
    const artifactHashes = (await Promise.all([
        "release/RELEASE_SUMMARY.json",
        "release/RELEASE_MANIFEST.json",
        "release/DEPLOYMENT_READINESS.md",
        "release/CI_STATUS.md",
        "ledger-manifest.json"
    ].map((path) => hashIfExists(runPath, path)))).filter((entry) => Boolean(entry));
    const unsigned = {
        id: `release-approval-${Date.now().toString(36)}`,
        runId,
        createdAt: new Date().toISOString(),
        type: "release",
        decision: args.decision,
        reviewer: redactReleaseText(args.reviewer),
        note: redactReleaseText(args.note),
        artifactHashes
    };
    const approval = { ...unsigned, signature: localPayloadSignature(unsigned) };
    const notes = [...(await readApprovalNotes(cwd, runId)), approval];
    await store.writeArtifact(runId, "approvals.json", notes);
    await store.writeTextArtifact(runId, "handoff/APPROVALS.md", renderApprovalNotes(notes));
    await store.writeTextArtifact(runId, "release/RELEASE_APPROVALS.md", renderApprovalNotes(notes.filter((note) => note.type === "release")));
    await generateReleasePacket(cwd, runId).catch(() => undefined);
    await writeLedgerManifest(cwd, runId);
    return notes;
}
//# sourceMappingURL=approval.js.map