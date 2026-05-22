import { join } from "node:path";
import { loadConfig } from "../config/config.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { RunStore } from "../orchestrator/run-store.js";
import { appendOrgAuditEvent } from "../org/audit-log.js";
import { updateOrganizationState } from "../org/state.js";
import { pathExists, readJson } from "../utils/fs.js";
import { getText, type HttpPostResult } from "./http-client.js";
import { readRemoteSubmissionReceipt } from "./receipt.js";
import type { ReceiptVerification } from "../org/types.js";

export async function refreshReceipt(
  cwd: string,
  runId: string,
  options: {
    dryRun?: boolean;
    verifyRemote?: boolean;
    confirm?: string;
    get?: (
      url: string,
      headers: Record<string, string>,
      timeoutMs: number
    ) => Promise<HttpPostResult>;
  } = {}
): Promise<ReceiptVerification> {
  const receipt = await readRemoteSubmissionReceipt(cwd, runId);
  const base: ReceiptVerification = {
    runId,
    createdAt: new Date().toISOString(),
    target: receipt?.target ?? null,
    remoteUrl: receipt?.remoteUrl ?? null,
    verified: false,
    statusCode: null,
    receiptId: receipt?.remoteReceiptId ?? null,
    remoteEntryHash: null,
    matchesLocalReceipt: null,
    warnings: [],
    errors: []
  };
  if (!receipt) base.errors.push("Remote submission receipt is missing.");
  if (!receipt?.remoteUrl)
    base.errors.push("No remote receipt URL or lookup template is available.");
  if (!options.verifyRemote) {
    if (options.dryRun) base.warnings.push("Dry run only; no remote endpoint was called.");
    return writeReceiptVerification(cwd, runId, { ...base, verified: false }, options.dryRun);
  }
  if (options.confirm !== `VERIFY REMOTE RECEIPT ${runId}`) {
    throw new Error(
      `Remote receipt verification requires exact confirmation: VERIFY REMOTE RECEIPT ${runId}`
    );
  }
  if (base.errors.length) return writeReceiptVerification(cwd, runId, base, false);
  const config = await loadConfig(cwd);
  const target = receipt ? config.remote_attestation.targets[receipt.target] : undefined;
  const headers: Record<string, string> = {};
  if (target?.token_env && process.env[target.token_env]) {
    headers.authorization = `Bearer ${process.env[target.token_env]}`;
  }
  const result = await (options.get ?? getText)(
    receipt?.remoteUrl ?? "",
    headers,
    config.remote_attestation.request_timeout_ms
  );
  let remoteReceiptId: string | null = null;
  let remoteEntryHash: string | null = null;
  try {
    const parsed = JSON.parse(result.body) as Record<string, unknown>;
    remoteReceiptId =
      typeof parsed.receiptId === "string"
        ? parsed.receiptId
        : typeof parsed.id === "string"
          ? parsed.id
          : null;
    remoteEntryHash = typeof parsed.entryHash === "string" ? parsed.entryHash : null;
  } catch {
    base.warnings.push("Remote response was not JSON.");
  }
  const verification: ReceiptVerification = {
    ...base,
    verified: result.statusCode >= 200 && result.statusCode < 300,
    statusCode: result.statusCode,
    receiptId: remoteReceiptId ?? receipt?.remoteReceiptId ?? null,
    remoteEntryHash,
    matchesLocalReceipt: remoteReceiptId
      ? remoteReceiptId === receipt?.remoteReceiptId
      : receipt?.remoteReceiptId
        ? false
        : null
  };
  if (!verification.verified)
    verification.errors.push(`Remote verification returned ${result.statusCode}.`);
  return writeReceiptVerification(cwd, runId, verification, false);
}

async function writeReceiptVerification(
  cwd: string,
  runId: string,
  value: ReceiptVerification,
  dryRun = false
): Promise<ReceiptVerification> {
  const store = new RunStore(cwd);
  await store.writeArtifact(runId, "remote-attestation/REMOTE_RECEIPT_VERIFICATION.json", value);
  await store.writeTextArtifact(
    runId,
    "remote-attestation/REMOTE_RECEIPT_VERIFICATION.md",
    `# Remote Receipt Verification

Verified: ${value.verified}
Remote URL: ${value.remoteUrl ?? "none"}
Errors:
${value.errors.map((error) => `- ${error}`).join("\n") || "- none"}
`
  );
  await updateOrganizationState(store, runId, (org) => {
    org.receiptRefresh = {
      status: dryRun
        ? "dry_run"
        : value.verified
          ? "verified"
          : value.errors.length
            ? "failed"
            : "blocked",
      verifiedAt: value.verified ? value.createdAt : undefined
    };
  });
  const configPath = join(store.runPath(runId), "state.json");
  if (pathExists(configPath)) {
    await appendOrgAuditEvent(cwd, {
      eventType: "org.receipt.refresh",
      actor: null,
      runId,
      summary: dryRun
        ? "Remote receipt refresh dry run."
        : `Remote receipt verification ${value.verified ? "passed" : "failed"}.`,
      artifactHashes: [],
      redacted: true
    }).catch(() => undefined);
  }
  await writeLedgerManifest(cwd, runId).catch(() => undefined);
  return value;
}

export async function readReceiptVerification(
  cwd: string,
  runId: string
): Promise<ReceiptVerification | null> {
  const path = join(
    new RunStore(cwd).runPath(runId),
    "remote-attestation",
    "REMOTE_RECEIPT_VERIFICATION.json"
  );
  return pathExists(path) ? readJson<ReceiptVerification>(path) : null;
}
