import type { RemoteSubmissionReceipt } from "./types.js";
export declare function readRemoteSubmissionReceipt(cwd: string, runId: string): Promise<RemoteSubmissionReceipt | null>;
export declare function parseRemoteReceipt(body: string): {
    remoteReceiptId: string | null;
    remoteUrl: string | null;
};
