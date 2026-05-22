import { readdir, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { loadConfig, securityPolicyPath, stringifyYaml } from "../config/config.js";
import { requiredSecurityPolicy } from "../config/defaults.js";
import { sha256File } from "../ledger/hash.js";
import { ensureDir, pathExists, readJson, writeJson } from "../utils/fs.js";
import { orgPaths } from "./config.js";
import { loadOrgPrivateKey, loadOrgPublicKey } from "./keyring.js";
import { canonicalJson, sha256Text, signCanonicalJson, verifyCanonicalJson } from "./signature.js";
import { appendOrgAuditEvent } from "./audit-log.js";
import type { OrgPolicyBundle, OrgPolicyEnvelope, OrgPolicyManifest } from "./types.js";

export async function createOrgPolicyBundle(
  cwd: string,
  options: { sign?: boolean; confirm?: string } = {}
): Promise<OrgPolicyBundle> {
  if (options.sign && options.confirm !== "SIGN ORG POLICY") {
    throw new Error("Org policy signing requires exact confirmation: SIGN ORG POLICY");
  }
  const config = await loadConfig(cwd);
  const paths = await orgPaths(cwd);
  const policyProfiles = await listPolicyProfileHashes(cwd);
  const bundle: OrgPolicyBundle = {
    version: 1,
    type: "vibecli.organization.policy-bundle",
    createdAt: new Date().toISOString(),
    org: { orgId: config.organization.org_id, orgName: config.organization.org_name },
    configHash: sha256Text(stringifyYaml({ ...config, providers: Object.keys(config.providers) })),
    policyProfiles,
    approvalPolicies: Object.entries(config.organization.approval_policies).map(
      ([name, policy]) => ({
        name,
        minApprovals: policy.min_approvals,
        requiredRoles: policy.required_roles,
        requireDistinctReviewers: policy.require_distinct_reviewers
      })
    ),
    retentionPolicies: Object.entries(config.organization.retention.policies).map(
      ([name, policy]) => ({
        name,
        retentionDays: policy.retention_days,
        legalHold: policy.legal_hold,
        exportMode: policy.export_mode
      })
    ),
    securityBaseline: { requiredChecks: Object.keys(requiredSecurityPolicy) },
    remoteAttestation: {
      allowRemoteSubmission: config.remote_attestation.allow_remote_submission,
      metadataOnlyDefault: config.remote_attestation.send_metadata_only,
      requireHttpsTargets: config.remote_attestation.require_https_targets
    },
    warnings: []
  };
  await writeJson(join(paths.latestPolicyBundleDir, "ORG_POLICY_BUNDLE.json"), bundle);
  await writePolicyMarkdown(cwd, bundle);
  await writeJson(
    join(paths.latestPolicyBundleDir, "ORG_POLICY_MANIFEST.json"),
    await createPolicyManifest(cwd)
  );
  await appendOrgAuditEvent(cwd, {
    eventType: options.sign ? "org.policy.signed" : "org.policy.created",
    actor: null,
    runId: null,
    summary: options.sign
      ? "Organization policy bundle signed."
      : "Organization policy bundle created.",
    artifactHashes: [{ path: "ORG_POLICY_BUNDLE.json", sha256: sha256Text(canonicalJson(bundle)) }],
    redacted: true
  });
  if (options.sign) await signOrgPolicyBundle(cwd);
  return bundle;
}

export async function signOrgPolicyBundle(cwd: string): Promise<OrgPolicyEnvelope> {
  const paths = await orgPaths(cwd);
  const bundlePath = join(paths.latestPolicyBundleDir, "ORG_POLICY_BUNDLE.json");
  if (!pathExists(bundlePath)) await createOrgPolicyBundle(cwd);
  const bundle = await readJson<OrgPolicyBundle>(bundlePath);
  const privateKey = await loadOrgPrivateKey(cwd);
  const publicKey = await loadOrgPublicKey(cwd);
  const bundleSha256 = sha256Text(canonicalJson(bundle));
  const envelope: OrgPolicyEnvelope = {
    version: 1,
    type: "vibecli.organization.policy-envelope",
    createdAt: new Date().toISOString(),
    bundlePath: "ORG_POLICY_BUNDLE.json",
    bundleSha256,
    signature: {
      algorithm: "ed25519",
      signatureBase64: signCanonicalJson(bundle, privateKey),
      publicKeyFingerprint: publicKey.fingerprint
    },
    publicKey: { pem: publicKey.pem, fingerprint: publicKey.fingerprint }
  };
  await writeJson(join(paths.latestPolicyBundleDir, "ORG_POLICY_ENVELOPE.json"), envelope);
  await writePolicySignatureMarkdown(cwd, envelope);
  await writeJson(
    join(paths.latestPolicyBundleDir, "ORG_POLICY_MANIFEST.json"),
    await createPolicyManifest(cwd)
  );
  return envelope;
}

export async function verifyOrgPolicyBundle(cwd: string): Promise<{
  ok: boolean;
  checks: Array<{ name: string; ok: boolean; message: string }>;
  fingerprint: string | null;
}> {
  const paths = await orgPaths(cwd);
  const checks: Array<{ name: string; ok: boolean; message: string }> = [];
  const bundlePath = join(paths.latestPolicyBundleDir, "ORG_POLICY_BUNDLE.json");
  const envelopePath = join(paths.latestPolicyBundleDir, "ORG_POLICY_ENVELOPE.json");
  if (!pathExists(bundlePath)) checks.push({ name: "bundle", ok: false, message: "missing" });
  if (!pathExists(envelopePath)) checks.push({ name: "envelope", ok: false, message: "missing" });
  let fingerprint: string | null = null;
  if (pathExists(bundlePath) && pathExists(envelopePath)) {
    const bundle = await readJson<OrgPolicyBundle>(bundlePath);
    const envelope = await readJson<OrgPolicyEnvelope>(envelopePath);
    fingerprint = envelope.publicKey.fingerprint;
    checks.push({
      name: "bundle_hash",
      ok: sha256Text(canonicalJson(bundle)) === envelope.bundleSha256,
      message: sha256Text(canonicalJson(bundle)) === envelope.bundleSha256 ? "ok" : "hash mismatch"
    });
    const { createPublicKey } = await import("node:crypto");
    const signatureOk = verifyCanonicalJson(
      bundle,
      envelope.signature.signatureBase64,
      createPublicKey(envelope.publicKey.pem)
    );
    checks.push({ name: "signature", ok: signatureOk, message: signatureOk ? "ok" : "invalid" });
    checks.push({
      name: "fingerprint",
      ok: envelope.signature.publicKeyFingerprint === envelope.publicKey.fingerprint,
      message:
        envelope.signature.publicKeyFingerprint === envelope.publicKey.fingerprint
          ? "ok"
          : "fingerprint mismatch"
    });
  }
  if (pathExists(join(paths.latestPolicyBundleDir, "ORG_POLICY_MANIFEST.json"))) {
    const manifest = await readJson<OrgPolicyManifest>(
      join(paths.latestPolicyBundleDir, "ORG_POLICY_MANIFEST.json")
    );
    for (const file of manifest.files) {
      const fullPath = join(paths.latestPolicyBundleDir, file.path);
      if (!pathExists(fullPath))
        checks.push({ name: `manifest:${file.path}`, ok: false, message: "missing" });
      else {
        const hash = await sha256File(fullPath);
        checks.push({
          name: `manifest:${file.path}`,
          ok: hash.sha256 === file.sha256,
          message: hash.sha256 === file.sha256 ? "ok" : "hash mismatch"
        });
      }
    }
  }
  return { ok: checks.every((check) => check.ok), checks, fingerprint };
}

export async function showOrgPolicyBundle(cwd: string): Promise<OrgPolicyBundle> {
  const paths = await orgPaths(cwd);
  return readJson<OrgPolicyBundle>(join(paths.latestPolicyBundleDir, "ORG_POLICY_BUNDLE.json"));
}

async function listPolicyProfileHashes(
  cwd: string
): Promise<Array<{ name: string; sha256: string }>> {
  const dir = join(cwd, ".vibecli", "policies", "profiles");
  const files = await readdir(dir).catch(() => []);
  const result = [];
  for (const file of files.filter((item) => item.endsWith(".yaml") || item.endsWith(".yml"))) {
    const fullPath = join(dir, file);
    const hash = await sha256File(fullPath);
    result.push({ name: file.replace(/\.ya?ml$/, ""), sha256: hash.sha256 });
  }
  if (pathExists(join(cwd, securityPolicyPath))) {
    const hash = await sha256File(join(cwd, securityPolicyPath));
    result.push({ name: "security-policy", sha256: hash.sha256 });
  }
  return result;
}

async function createPolicyManifest(cwd: string): Promise<OrgPolicyManifest> {
  const paths = await orgPaths(cwd);
  const entries = [];
  const files = await readdir(paths.latestPolicyBundleDir).catch(() => []);
  for (const file of files.filter(
    (name) => name.startsWith("ORG_POLICY_") && name !== "ORG_POLICY_MANIFEST.json"
  )) {
    const fullPath = join(paths.latestPolicyBundleDir, file);
    const hash = await sha256File(fullPath);
    entries.push({ path: relative(paths.latestPolicyBundleDir, fullPath), ...hash });
  }
  entries.sort((left, right) => left.path.localeCompare(right.path));
  const withoutHash = {
    createdAt: new Date().toISOString(),
    algorithm: "sha256" as const,
    files: entries
  };
  return { ...withoutHash, manifestHash: sha256Text(JSON.stringify(withoutHash, null, 2)) };
}

async function writePolicyMarkdown(cwd: string, bundle: OrgPolicyBundle): Promise<void> {
  const paths = await orgPaths(cwd);
  await ensureDir(paths.latestPolicyBundleDir);
  await writeFile(
    join(paths.latestPolicyBundleDir, "ORG_POLICY_BUNDLE.md"),
    `# Organization Policy Bundle

Org: ${bundle.org.orgId} (${bundle.org.orgName})

Approval policies:
${bundle.approvalPolicies.map((policy) => `- ${policy.name}`).join("\n") || "- none"}

Retention policies:
${bundle.retentionPolicies.map((policy) => `- ${policy.name}`).join("\n") || "- none"}
`,
    "utf8"
  );
}

async function writePolicySignatureMarkdown(
  cwd: string,
  envelope: OrgPolicyEnvelope
): Promise<void> {
  const paths = await orgPaths(cwd);
  await ensureDir(paths.latestPolicyBundleDir);
  await writeFile(
    join(paths.latestPolicyBundleDir, "ORG_POLICY_SIGNATURE.md"),
    `# Organization Policy Signature

Fingerprint: ${envelope.publicKey.fingerprint}

Private key included: false
`,
    "utf8"
  );
}
