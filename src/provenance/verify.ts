import { createPublicKey } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { verifyLedger } from "../ledger/verify.js";
import { RunStore } from "../orchestrator/run-store.js";
import { pathExists, readJson } from "../utils/fs.js";
import { fingerprintPublicKey, sha256Text, verifyCanonicalJson } from "./signature.js";
import { updateProvenanceState } from "./state.js";
import type {
  ProvenanceEnvelope,
  ProvenanceStatement,
  ProvenanceVerificationResult
} from "./types.js";

export async function verifyProvenance(
  cwd: string,
  runId: string
): Promise<ProvenanceVerificationResult> {
  const store = new RunStore(cwd);
  const runPath = store.runPath(runId);
  const checks: ProvenanceVerificationResult["checks"] = [];
  const warnings: string[] = [];
  const statementPath = join(runPath, "provenance", "provenance-statement.json");
  const envelopePath = join(runPath, "provenance", "provenance-envelope.json");
  if (!pathExists(statementPath)) {
    checks.push({ name: "statement-present", ok: false, message: "provenance statement missing" });
  }
  if (!pathExists(envelopePath)) {
    checks.push({ name: "envelope-present", ok: false, message: "provenance envelope missing" });
  }
  if (!pathExists(statementPath) || !pathExists(envelopePath)) {
    const result = { runId, ok: false, checks, warnings };
    await updateProvenanceState(store, runId, (provenance) => {
      provenance.signature = { status: "invalid", verifiedAt: new Date().toISOString() };
    }).catch(() => undefined);
    return result;
  }
  const statementText = await readFile(statementPath, "utf8");
  const statement = JSON.parse(statementText) as ProvenanceStatement;
  const envelope = await readJson<ProvenanceEnvelope>(envelopePath);
  const statementHash = sha256Text(statementText);
  checks.push({
    name: "statement-hash",
    ok: statementHash === envelope.statementSha256,
    message:
      statementHash === envelope.statementSha256
        ? "statement hash matches"
        : "statement hash mismatch"
  });
  const fingerprint = fingerprintPublicKey(envelope.publicKey.pem);
  checks.push({
    name: "public-key-fingerprint",
    ok:
      fingerprint === envelope.publicKey.fingerprint &&
      fingerprint === envelope.signature.publicKeyFingerprint,
    message: "public key fingerprint check"
  });
  const signatureOk = verifyCanonicalJson(
    statement,
    envelope.signature.signatureBase64,
    createPublicKey(envelope.publicKey.pem)
  );
  checks.push({
    name: "signature",
    ok: signatureOk,
    message: signatureOk ? "signature verified" : "signature verification failed"
  });
  if (!Array.isArray(statement.materials)) {
    checks.push({ name: "materials", ok: false, message: "materials are missing or invalid" });
  }
  for (const material of Array.isArray(statement.materials) ? statement.materials : []) {
    const rel = material.uri.replace(`vibecli://${runId}/`, "");
    if (rel === "ledger-manifest.json") {
      checks.push({
        name: `material:${rel}`,
        ok: true,
        message: "ledger manifest is verified through the ledger check"
      });
      continue;
    }
    const fullPath = join(runPath, rel);
    if (!pathExists(fullPath)) {
      checks.push({ name: `material:${rel}`, ok: false, message: "material missing" });
      continue;
    }
    const hash = sha256Text(await readFile(fullPath));
    checks.push({
      name: `material:${rel}`,
      ok: hash === material.digest.sha256,
      message: hash === material.digest.sha256 ? "material hash matches" : "material hash mismatch"
    });
  }
  const ledger = await verifyLedger(cwd, runId).catch(() => undefined);
  if (!ledger) warnings.push("Ledger is missing.");
  checks.push({
    name: "ledger",
    ok: ledger?.ok ?? false,
    message: ledger?.ok ? "ledger verified" : "ledger verification failed"
  });
  const ok = checks.every((check) => check.ok);
  await updateProvenanceState(store, runId, (provenance) => {
    provenance.signature = {
      status: ok ? "verified" : "invalid",
      verifiedAt: new Date().toISOString()
    };
  });
  return { runId, ok, checks, warnings };
}
