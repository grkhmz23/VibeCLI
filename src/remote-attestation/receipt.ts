import { join } from "node:path";
import { RunStore } from "../orchestrator/run-store.js";
import { pathExists, readJson } from "../utils/fs.js";
import type { RemoteSubmissionReceipt } from "./types.js";

export async function readRemoteSubmissionReceipt(
  cwd: string,
  runId: string
): Promise<RemoteSubmissionReceipt | null> {
  const path = join(
    new RunStore(cwd).runPath(runId),
    "remote-attestation",
    "REMOTE_SUBMISSION_RECEIPT.json"
  );
  return pathExists(path) ? readJson<RemoteSubmissionReceipt>(path) : null;
}

export function parseRemoteReceipt(body: string): {
  remoteReceiptId: string | null;
  remoteUrl: string | null;
} {
  try {
    const parsed = JSON.parse(body) as Record<string, unknown>;
    const id = parsed.receiptId ?? parsed.id;
    const url = parsed.url ?? parsed.entryUrl ?? parsed.transparencyUrl;
    return {
      remoteReceiptId: typeof id === "string" ? id : null,
      remoteUrl: typeof url === "string" ? url : null
    };
  } catch {
    return { remoteReceiptId: null, remoteUrl: null };
  }
}
