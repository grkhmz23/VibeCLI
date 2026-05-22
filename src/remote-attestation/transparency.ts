import { appendFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { sha256File, sha256Text } from "../ledger/hash.js";
import { verifyLedger } from "../ledger/verify.js";
import { RunStore } from "../orchestrator/run-store.js";
import { pathExists, readJson, ensureDir } from "../utils/fs.js";
import { updateRemoteAttestationState } from "./state.js";
import { redactAttestationJson, redactAttestationText } from "./redaction.js";
import type { TransparencyChainEntry, TransparencyEntry } from "./types.js";

async function optionalJson<T>(path: string): Promise<T | undefined> {
  return pathExists(path) ? readJson<T>(path).catch(() => undefined) : undefined;
}

export async function generateTransparencyEntry(
  cwd: string,
  runId: string
): Promise<TransparencyEntry> {
  const store = new RunStore(cwd);
  const runPath = store.runPath(runId);
  const state = await store.readState(runId);
  const releaseSummary = await optionalJson<{
    channel?: string;
    version?: { planned?: string | null };
    git?: { tag?: string | null };
  }>(join(runPath, "release", "RELEASE_SUMMARY.json"));
  const attestation = await optionalJson<{
    provenance?: {
      envelopeSha256?: string | null;
      signed?: boolean;
      publicKeyFingerprint?: string | null;
    };
    evidence?: { archiveSha256?: string | null; manifestSha256?: string | null };
  }>(join(runPath, "remote-attestation", "ATTESTATION_EXPORT.json"));
  const provenanceStatement = await optionalJson<{
    subject?: Array<{ name: string; digest: { sha256: string } }>;
  }>(join(runPath, "provenance", "provenance-statement.json"));
  const ledger = await verifyLedger(cwd, runId).catch(() => undefined);
  const ledgerHash = pathExists(join(runPath, "ledger-manifest.json"))
    ? await sha256File(join(runPath, "ledger-manifest.json"))
    : null;
  const warnings: string[] = [];
  if (!attestation?.provenance?.signed) warnings.push("Signed provenance is missing.");
  if (!attestation?.evidence?.manifestSha256) warnings.push("Evidence manifest is missing.");
  if (!ledger?.ok) warnings.push("Ledger verification failed or ledger is missing.");
  const base = redactAttestationJson({
    version: 1 as const,
    kind: "vibecli.transparency.entry" as const,
    runId,
    createdAt: new Date().toISOString(),
    entryHash: "",
    release: {
      channel: releaseSummary?.channel ?? state.release?.packet.channel ?? null,
      version: releaseSummary?.version?.planned ?? state.release?.version.plannedVersion ?? null,
      tag: releaseSummary?.git?.tag ?? state.release?.tag.tag ?? null
    },
    subjects:
      provenanceStatement?.subject?.map((subject) => ({
        name: subject.name,
        sha256: subject.digest.sha256
      })) ?? [],
    provenance: {
      signed: Boolean(attestation?.provenance?.signed),
      envelopeSha256: attestation?.provenance?.envelopeSha256 ?? null,
      publicKeyFingerprint: attestation?.provenance?.publicKeyFingerprint ?? null
    },
    evidence: {
      archiveSha256: attestation?.evidence?.archiveSha256 ?? null,
      manifestSha256: attestation?.evidence?.manifestSha256 ?? null
    },
    ledger: { manifestSha256: ledgerHash?.sha256 ?? null, verified: ledger?.ok ?? false },
    policy: { name: state.policy ?? null, strict: state.policy === "strict-enterprise" },
    attestations: {
      verificationPassed: state.verification?.status === "passed",
      scannerHighCriticalClear:
        !state.scanners || state.scanners.criticalFindings + state.scanners.highFindings === 0,
      ciPassed: state.release?.ci.status === "passed",
      deploymentReady:
        state.release?.deploymentReadiness.verdict === "ready_to_deploy" ||
        state.release?.deploymentReadiness.verdict === "ready_with_warnings",
      releaseApprovalPresent: pathExists(join(runPath, "approvals.json"))
    },
    warnings
  });
  const entry: TransparencyEntry = {
    ...base,
    entryHash: sha256Text(JSON.stringify({ ...base, entryHash: "" }, null, 2))
  };
  await store.writeArtifact(runId, "remote-attestation/TRANSPARENCY_ENTRY.json", entry);
  await store.writeTextArtifact(
    runId,
    "remote-attestation/TRANSPARENCY_ENTRY.md",
    renderEntry(entry)
  );
  await updateRemoteAttestationState(store, runId, (remote) => {
    remote.transparency = { status: "generated", entryHash: entry.entryHash };
  });
  await writeLedgerManifest(cwd, runId);
  return entry;
}

export async function appendTransparencyEntry(
  cwd: string,
  runId: string,
  confirm?: string
): Promise<TransparencyChainEntry> {
  if (confirm !== `APPEND TRANSPARENCY ${runId}`) {
    throw new Error(
      `Transparency append requires exact confirmation: APPEND TRANSPARENCY ${runId}`
    );
  }
  const store = new RunStore(cwd);
  const entry = pathExists(
    join(store.runPath(runId), "remote-attestation", "TRANSPARENCY_ENTRY.json")
  )
    ? await readJson<TransparencyEntry>(
        join(store.runPath(runId), "remote-attestation", "TRANSPARENCY_ENTRY.json")
      )
    : await generateTransparencyEntry(cwd, runId);
  const logDir = join(cwd, ".vibecli", "transparency-log");
  await ensureDir(logDir);
  const chainPath = join(logDir, "chain.json");
  const chain = pathExists(chainPath) ? await readJson<TransparencyChainEntry[]>(chainPath) : [];
  const previous = chain.at(-1)?.chainHash ?? null;
  const chainEntryBase = {
    index: chain.length,
    runId,
    createdAt: new Date().toISOString(),
    entryHash: entry.entryHash,
    previousChainHash: previous
  };
  const chainEntry: TransparencyChainEntry = {
    ...chainEntryBase,
    chainHash: sha256Text(JSON.stringify(chainEntryBase, null, 2))
  };
  await appendFile(join(logDir, "log.jsonl"), `${JSON.stringify(entry)}\n`, "utf8");
  await writeFile(chainPath, `${JSON.stringify([...chain, chainEntry], null, 2)}\n`, "utf8");
  await updateRemoteAttestationState(store, runId, (remote) => {
    remote.transparency = {
      status: "appended",
      entryHash: entry.entryHash,
      chainHash: chainEntry.chainHash
    };
  });
  await writeLedgerManifest(cwd, runId);
  return chainEntry;
}

export async function verifyTransparencyLog(
  cwd: string,
  runId?: string
): Promise<{
  ok: boolean;
  checks: Array<{ index: number; ok: boolean; message: string }>;
  foundRun: boolean;
}> {
  const chainPath = join(cwd, ".vibecli", "transparency-log", "chain.json");
  if (!pathExists(chainPath)) return { ok: false, checks: [], foundRun: false };
  const chain = await readJson<TransparencyChainEntry[]>(chainPath).catch(() => undefined);
  if (!chain) return { ok: false, checks: [], foundRun: false };
  const checks = chain.map((entry, index) => {
    const previous = index === 0 ? null : chain[index - 1]?.chainHash;
    const base = {
      index: entry.index,
      runId: entry.runId,
      createdAt: entry.createdAt,
      entryHash: entry.entryHash,
      previousChainHash: entry.previousChainHash
    };
    const ok =
      entry.index === index &&
      entry.previousChainHash === previous &&
      entry.chainHash === sha256Text(JSON.stringify(base, null, 2));
    return { index, ok, message: ok ? "ok" : "chain hash mismatch" };
  });
  const foundRun = runId ? chain.some((entry) => entry.runId === runId) : true;
  return { ok: checks.every((check) => check.ok) && foundRun, checks, foundRun };
}

function renderEntry(entry: TransparencyEntry): string {
  return redactAttestationText(`# Local Transparency Entry

Run id: ${entry.runId}

Entry hash: ${entry.entryHash}

Signed provenance: ${entry.provenance.signed}

Ledger verified: ${entry.ledger.verified}

This is a local tamper-evident entry. External transparency requires a remote submission receipt.
`);
}
