import { type HttpPostResult } from "./http-client.js";
import type { ReceiptVerification } from "../org/types.js";
export declare function refreshReceipt(cwd: string, runId: string, options?: {
    dryRun?: boolean;
    verifyRemote?: boolean;
    confirm?: string;
    get?: (url: string, headers: Record<string, string>, timeoutMs: number) => Promise<HttpPostResult>;
}): Promise<ReceiptVerification>;
export declare function readReceiptVerification(cwd: string, runId: string): Promise<ReceiptVerification | null>;
