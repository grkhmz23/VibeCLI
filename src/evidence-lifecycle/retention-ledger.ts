import { appendFile, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chooseAuditSigningKey } from "../audit/sign.js";
import { sha256Text, signCanonicalJson } from "../provenance/signature.js";
import { appendOrgAuditEvent } from "../org/audit-log.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { RunStore } from "../orchestrator/run-store.js";
import { ensureDir, pathExists, readJson } from "../utils/fs.js";
import { evidenceLifecyclePaths } from "./config.js";
import { redactEvidenceText } from "./redaction.js";
import { updateEvidenceLifecycleState } from "./state.js";
import type { RetentionChainEntry, RetentionLedgerEvent } from "./types.js";

export async function appendRetentionLedgerEvent(
  cwd: string,
  event: Omit<RetentionLedgerEvent, "version" | "createdAt" | "signature">
): Promise<RetentionChainEntry> {
  const paths = await evidenceLifecyclePaths(cwd);
  await ensureDir(paths.retentionLedgerDir);
  const createdAt = new Date().toISOString();
  const payload = {
    version: 1 as const,
    createdAt,
    eventType: event.eventType,
    runId: event.runId,
    actor: event.actor ? redactEvidenceText(event.actor, 120) : null,
    summary: redactEvidenceText(event.summary, 500),
    artifactHashes: event.artifactHashes
  };
  const payloadHash = sha256Text(JSON.stringify(payload));
  const key = await chooseAuditSigningKey(cwd).catch(() => undefined);
  const fullEvent: RetentionLedgerEvent = {
    ...payload,
    signature: key
      ? {
          algorithm: "ed25519",
          publicKeyFingerprint: key.publicFingerprint,
          payloadHash,
          signatureBase64: signCanonicalJson(payload, key.privateKey)
        }
      : {
          algorithm: "sha256-local",
          publicKeyFingerprint: null,
          payloadHash,
          signatureBase64: null
        }
  };
  const logPath = join(paths.retentionLedgerDir, "retention-ledger.jsonl");
  const chainPath = join(paths.retentionLedgerDir, "retention-chain.json");
  const chain = pathExists(chainPath)
    ? await readJson<RetentionChainEntry[]>(chainPath).catch(() => [])
    : [];
  const eventHash = sha256Text(JSON.stringify(fullEvent));
  const previousChainHash = chain.at(-1)?.chainHash ?? null;
  const entry: RetentionChainEntry = {
    index: chain.length,
    createdAt,
    runId: event.runId,
    eventHash,
    previousChainHash,
    chainHash: sha256Text(
      JSON.stringify({ index: chain.length, runId: event.runId, eventHash, previousChainHash })
    )
  };
  await appendFile(logPath, `${JSON.stringify(fullEvent)}\n`, "utf8");
  await writeFile(chainPath, `${JSON.stringify([...chain, entry], null, 2)}\n`, "utf8");
  await appendOrgAuditEvent(cwd, {
    eventType: `evidence_lifecycle.${event.eventType}`,
    actor: event.actor,
    runId: event.runId,
    summary: fullEvent.summary,
    artifactHashes: event.artifactHashes,
    redacted: true
  }).catch(() => undefined);
  return entry;
}

export async function readRetentionLedger(
  cwd: string
): Promise<{ events: RetentionLedgerEvent[]; chain: RetentionChainEntry[] }> {
  const paths = await evidenceLifecyclePaths(cwd);
  const logPath = join(paths.retentionLedgerDir, "retention-ledger.jsonl");
  const events = pathExists(logPath)
    ? (await readFile(logPath, "utf8"))
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) => JSON.parse(line) as RetentionLedgerEvent)
    : [];
  const chain = pathExists(join(paths.retentionLedgerDir, "retention-chain.json"))
    ? await readJson<RetentionChainEntry[]>(
        join(paths.retentionLedgerDir, "retention-chain.json")
      ).catch(() => [])
    : [];
  return { events, chain };
}

export async function retentionLedgerSummary(
  cwd: string,
  runId?: string
): Promise<{
  eventCount: number;
  latestChainHash: string | null;
  events: RetentionLedgerEvent[];
}> {
  const { events, chain } = await readRetentionLedger(cwd);
  const filtered = runId ? events.filter((event) => event.runId === runId) : events;
  return {
    eventCount: filtered.length,
    latestChainHash: chain.at(-1)?.chainHash ?? null,
    events: filtered
  };
}

export async function recordManualRetentionEvent(
  cwd: string,
  runId: string,
  options: { event: RetentionLedgerEvent["eventType"]; summary: string; confirm?: string }
): Promise<RetentionChainEntry> {
  if (options.confirm !== `RECORD RETENTION EVENT ${runId}`) {
    throw new Error(
      `Retention ledger record requires exact confirmation: RECORD RETENTION EVENT ${runId}`
    );
  }
  const entry = await appendRetentionLedgerEvent(cwd, {
    eventType: options.event,
    runId,
    actor: null,
    summary: options.summary,
    artifactHashes: []
  });
  await updateEvidenceLifecycleState(new RunStore(cwd), runId, (state) => {
    state.retentionLedger = { status: "recorded", latestChainHash: entry.chainHash };
  }).catch(() => undefined);
  await writeLedgerManifest(cwd, runId).catch(() => undefined);
  return entry;
}
