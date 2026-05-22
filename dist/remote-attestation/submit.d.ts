import { postJson } from "./http-client.js";
import type { RemoteSubmissionReceipt } from "./types.js";
export declare function submitAttestation(cwd: string, runId: string, options: {
    target?: string;
    confirm?: string;
    dryRun?: boolean;
    allowConfigDisabled?: boolean;
    allowLedgerWarning?: boolean;
    post?: typeof postJson;
}): Promise<RemoteSubmissionReceipt>;
