import { join } from "node:path";
import { pathExists, readJson } from "../utils/fs.js";
import { sha256File } from "../ledger/hash.js";
import { RunStore } from "../orchestrator/run-store.js";
import { redactHandoffText } from "../handoff/redaction.js";
import { localPayloadSignature } from "./signature.js";

export type ApprovalNote = {
  id: string;
  runId: string;
  createdAt: string;
  type: "review" | "apply" | "exception" | "release" | "rollback";
  decision: "approved" | "rejected" | "needs_changes";
  reviewer: string;
  note: string;
  artifactHashes: Array<{ path: string; sha256: string }>;
  signature: { algorithm: "sha256-local"; payloadHash: string };
};

export async function readApprovalNotes(cwd: string, runId: string): Promise<ApprovalNote[]> {
  const path = join(new RunStore(cwd).runPath(runId), "approvals.json");
  if (!pathExists(path)) return [];
  return readJson<ApprovalNote[]>(path);
}

async function hashIfExists(
  runPath: string,
  path: string
): Promise<{ path: string; sha256: string } | undefined> {
  const fullPath = join(runPath, path);
  if (!pathExists(fullPath)) return undefined;
  return { path, sha256: (await sha256File(fullPath)).sha256 };
}

export async function addApprovalNote(
  cwd: string,
  runId: string,
  args: {
    type: ApprovalNote["type"];
    decision: ApprovalNote["decision"];
    reviewer: string;
    note: string;
    confirm?: string;
  }
): Promise<ApprovalNote> {
  if (args.confirm !== `ADD APPROVAL NOTE ${runId}`) {
    throw new Error(`Approval note requires exact confirmation: ADD APPROVAL NOTE ${runId}`);
  }
  if (!args.reviewer.trim() || !args.note.trim())
    throw new Error("Reviewer and note are required.");
  const store = new RunStore(cwd);
  const runPath = store.runPath(runId);
  const artifactHashes = (
    await Promise.all(
      [
        "state.json",
        "ledger-manifest.json",
        "handoff/HANDOFF_SUMMARY.json",
        "verification-results.json",
        "scanner-results.json",
        "apply-result.json"
      ].map((path) => hashIfExists(runPath, path))
    )
  ).filter((entry): entry is { path: string; sha256: string } => Boolean(entry));
  const unsigned = {
    id: `approval-${Date.now().toString(36)}`,
    runId,
    createdAt: new Date().toISOString(),
    type: args.type,
    decision: args.decision,
    reviewer: redactHandoffText(args.reviewer),
    note: redactHandoffText(args.note),
    artifactHashes
  };
  const note: ApprovalNote = { ...unsigned, signature: localPayloadSignature(unsigned) };
  const notes = [...(await readApprovalNotes(cwd, runId)), note];
  await store.writeArtifact(runId, "approvals.json", notes);
  await store.writeTextArtifact(runId, "handoff/APPROVALS.md", renderApprovalNotes(notes));
  return note;
}

export function renderApprovalNotes(notes: ApprovalNote[]): string {
  return `# Approval Notes

${notes.length ? notes.map((note) => `- ${note.id}: ${note.type} ${note.decision} by ${note.reviewer} - ${note.note}`).join("\n") : "No approval notes recorded."}
`;
}

export async function verifyApprovalNotes(
  cwd: string,
  runId: string
): Promise<{
  runId: string;
  ok: boolean;
  notes: Array<{ id: string; ok: boolean; reason: string }>;
}> {
  const notes = await readApprovalNotes(cwd, runId);
  const runPath = new RunStore(cwd).runPath(runId);
  const results = [];
  for (const note of notes) {
    const unsigned = { ...note, signature: undefined };
    const signatureOk =
      localPayloadSignature(unsigned).payloadHash !== note.signature.payloadHash ? false : true;
    const artifactsOk = (
      await Promise.all(
        note.artifactHashes.map(async (artifact) => {
          const fullPath = join(runPath, artifact.path);
          return pathExists(fullPath) && (await sha256File(fullPath)).sha256 === artifact.sha256;
        })
      )
    ).every(Boolean);
    results.push({
      id: note.id,
      ok: signatureOk && artifactsOk,
      reason: signatureOk && artifactsOk ? "ok" : "hash mismatch"
    });
  }
  return { runId, ok: results.every((result) => result.ok), notes: results };
}
