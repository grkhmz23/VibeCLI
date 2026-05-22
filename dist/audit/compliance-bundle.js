import { gzip } from "node:zlib";
import { promisify } from "node:util";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { sha256File, sha256Text } from "../ledger/hash.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { appendOrgAuditEvent } from "../org/audit-log.js";
import { RunStore } from "../orchestrator/run-store.js";
import { redactReleaseText } from "../release/redaction.js";
import { pathExists } from "../utils/fs.js";
import { generateAuditCoverage } from "./coverage.js";
import { generateAuditGaps } from "./gaps.js";
import { chooseAuditSigningKey, makeSignedAuditEnvelope } from "./sign.js";
import { updateAuditState } from "./state.js";
import { verifyAuditManifest } from "./verify.js";
const gzipAsync = promisify(gzip);
const minimalFiles = [
    "audit/AUDIT_COVERAGE.json",
    "audit/AUDIT_GAPS.json",
    "audit/AUDIT_EVIDENCE_MAP.md",
    "ledger-manifest.json"
];
const fullFiles = [
    ...minimalFiles,
    "audit/export/AUDIT_REPORT.json",
    "release/RELEASE_SUMMARY.json",
    "release/RELEASE_READINESS.md",
    "provenance/provenance-envelope.json",
    "org/APPROVAL_MATRIX.json",
    "org/RETENTION_PLAN.json"
];
export async function createComplianceBundle(cwd, runId, options = {}) {
    if (options.sign && options.confirm !== `SIGN COMPLIANCE BUNDLE ${runId}`) {
        throw new Error(`Compliance bundle signing requires exact confirmation: SIGN COMPLIANCE BUNDLE ${runId}`);
    }
    const coverage = await generateAuditCoverage(cwd, runId, { schema: options.schema });
    const gaps = await generateAuditGaps(cwd, runId, { schema: coverage.schema });
    const store = new RunStore(cwd);
    const runPath = store.runPath(runId);
    const files = options.minimal ? minimalFiles : fullFiles;
    const archive = {};
    const includedArtifacts = [];
    for (const file of files) {
        if (isExcluded(file))
            continue;
        const fullPath = join(runPath, file);
        if (!pathExists(fullPath))
            continue;
        archive[file] = redactReleaseText(await readFile(fullPath, "utf8"));
        const hash = await sha256File(fullPath);
        includedArtifacts.push({ path: file, sha256: hash.sha256, class: artifactClass(file) });
    }
    const bundle = {
        version: 1,
        type: "vibecli.compliance.check-bundle",
        runId,
        createdAt: new Date().toISOString(),
        schema: coverage.schema,
        disclaimer: coverage.disclaimer,
        includedArtifacts,
        coverage: coverage.coverage,
        gaps: gaps.summary,
        readOnly: true,
        certificationClaim: false,
        warnings: ["Compliance check bundles are read-only audit support artifacts, not certification."]
    };
    await store.writeArtifact(runId, "audit/compliance/COMPLIANCE_CHECK_BUNDLE.json", bundle);
    await store.writeTextArtifact(runId, "audit/compliance/COMPLIANCE_CHECK_BUNDLE.md", renderBundle(bundle));
    const archivePath = join(runPath, "audit", "compliance", `vibecli-compliance-${runId}-${coverage.schema}.tar.gz`);
    await writeFile(archivePath, await gzipAsync(JSON.stringify(archive, null, 2)));
    const archiveHash = await sha256File(archivePath);
    const manifest = await writeComplianceManifest(cwd, runId, coverage.schema, archiveHash.sha256);
    if (options.sign) {
        const key = await chooseAuditSigningKey(cwd);
        const envelope = makeSignedAuditEnvelope(runId, "vibecli.compliance.bundle-envelope", "audit/compliance/COMPLIANCE_CHECK_BUNDLE.json", bundle, key);
        await store.writeArtifact(runId, "audit/compliance/COMPLIANCE_BUNDLE_ENVELOPE.json", envelope);
        await store.writeTextArtifact(runId, "audit/compliance/COMPLIANCE_BUNDLE_SIGNATURE.md", `# Compliance Bundle Signature\n\nPublic key fingerprint: ${envelope.publicKey.fingerprint}\n`);
        await appendOrgAuditEvent(cwd, {
            eventType: "audit.compliance_bundle.signed",
            actor: null,
            runId,
            summary: "Compliance check bundle signed.",
            artifactHashes: [
                { path: "audit/compliance/COMPLIANCE_MANIFEST.json", sha256: manifest.manifestHash }
            ],
            redacted: true
        }).catch(() => undefined);
    }
    await updateAuditState(store, runId, (audit) => {
        audit.complianceBundle = {
            status: options.sign ? "signed" : "generated",
            schema: coverage.schema
        };
    });
    await writeLedgerManifest(cwd, runId);
    return bundle;
}
export async function verifyComplianceBundle(cwd, runId) {
    const store = new RunStore(cwd);
    const root = join(store.runPath(runId), "audit", "compliance");
    const result = await verifyAuditManifest(root, join(root, "COMPLIANCE_MANIFEST.json"), join(root, "COMPLIANCE_BUNDLE_ENVELOPE.json"), join(root, "COMPLIANCE_CHECK_BUNDLE.json"));
    await updateAuditState(store, runId, (audit) => {
        audit.complianceBundle = { status: result.ok ? "verified" : "invalid" };
    });
    await writeLedgerManifest(cwd, runId);
    return result;
}
async function writeComplianceManifest(cwd, runId, schema, archiveSha256) {
    const store = new RunStore(cwd);
    const root = join(store.runPath(runId), "audit", "compliance");
    const files = [];
    for (const path of ["COMPLIANCE_CHECK_BUNDLE.json", "COMPLIANCE_CHECK_BUNDLE.md"]) {
        const hash = await sha256File(join(root, path));
        files.push({ path, ...hash });
    }
    const withoutHash = {
        runId,
        createdAt: new Date().toISOString(),
        algorithm: "sha256",
        files,
        archivePath: `vibecli-compliance-${runId}-${schema}.tar.gz`,
        archiveSha256
    };
    const manifest = {
        ...withoutHash,
        manifestHash: sha256Text(JSON.stringify(withoutHash, null, 2))
    };
    await store.writeArtifact(runId, "audit/compliance/COMPLIANCE_MANIFEST.json", manifest);
    return manifest;
}
function renderBundle(bundle) {
    return `# Compliance Check Bundle

Schema: ${bundle.schema}

${bundle.disclaimer}

Read only: true
Certification claim: false

This bundle does not certify compliance and is not uploaded.
`;
}
function isExcluded(path) {
    return (path.includes(".env") ||
        path.includes("private.pem") ||
        path.includes("agent-outputs") ||
        path.includes(".vibecli/keys"));
}
function artifactClass(path) {
    return path.split("/")[0] ?? "artifact";
}
//# sourceMappingURL=compliance-bundle.js.map