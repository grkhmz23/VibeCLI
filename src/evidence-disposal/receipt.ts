import { join } from "node:path";
import { RunStore } from "../orchestrator/run-store.js";
import { readJson } from "../utils/fs.js";
import type { DisposalReceipt } from "./types.js";

export async function readDisposalReceipt(cwd: string, runId: string): Promise<DisposalReceipt> {
  return readJson<DisposalReceipt>(
    join(
      new RunStore(cwd).runPath(runId),
      "evidence-lifecycle",
      "disposal",
      "DISPOSAL_RECEIPT.json"
    )
  );
}
