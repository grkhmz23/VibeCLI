import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { loadConfig } from "../config/config.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { sha256File } from "../ledger/hash.js";
import { RunStore } from "../orchestrator/run-store.js";
import { ensureDir, pathExists, readJson, writeJson } from "../utils/fs.js";
import { appendOrgAuditEvent } from "./audit-log.js";
import { sha256Text } from "./signature.js";
import { updateOrganizationState } from "./state.js";
import { redactOrgText } from "./validation.js";
import type { OrgApprovalDecision, OrgApprovalMatrix } from "./types.js";

const approvalArtifacts = [
  "state.json",
  "ledger-manifest.json",
  "release/RELEASE_SUMMARY.json",
  "release/RELEASE_READINESS.md",
  "release/DEPLOYMENT_READINESS.md",
  "provenance/provenance-envelope.json",
  "evidence/EVIDENCE_MANIFEST.json",
  "remote-attestation/REMOTE_SUBMISSION_RECEIPT.json"
];

export async function getApprovalMatrix(
  cwd: string,
  runId: string,
  options: { write?: boolean } = { write: true }
): Promise<OrgApprovalMatrix> {
  const store = new RunStore(cwd);
  const matrixPath = join(store.runPath(runId), "org", "APPROVAL_MATRIX.json");
  if (pathExists(matrixPath)) {
    const matrix = await readJson<OrgApprovalMatrix>(matrixPath);
    matrix.quorum = computeQuorum(matrix);
    if (options.write !== false) await writeMatrix(cwd, runId, matrix);
    return matrix;
  }
  const config = await loadConfig(cwd);
  const state = await store.readState(runId);
  const policyName = config.organization.default_approval_policy;
  const policy = config.organization.approval_policies[policyName];
  const matrix: OrgApprovalMatrix = {
    runId,
    createdAt: new Date().toISOString(),
    orgId: config.organization.enabled ? config.organization.org_id : null,
    policy: state.policy ?? "company-grade",
    approvalPolicy: policyName,
    requiredRoles: policy.required_roles,
    minApprovals: policy.min_approvals,
    requireDistinctReviewers: policy.require_distinct_reviewers,
    approvals: [],
    quorum: {
      status: "not_met",
      approvedCount: 0,
      distinctReviewerCount: 0,
      missingRoles: policy.required_roles,
      blockingReasons: [],
      warnings: []
    }
  };
  matrix.quorum = computeQuorum(matrix);
  if (options.write !== false) await writeMatrix(cwd, runId, matrix);
  return matrix;
}

export async function addOrgApproval(
  cwd: string,
  runId: string,
  options: {
    reviewer: string;
    role: string;
    decision: OrgApprovalDecision;
    note: string;
    confirm?: string;
    externalReviewer?: boolean;
  }
): Promise<OrgApprovalMatrix> {
  if (options.confirm !== `ADD ORG APPROVAL ${runId}`) {
    throw new Error(`Org approval requires exact confirmation: ADD ORG APPROVAL ${runId}`);
  }
  if (!options.note.trim()) throw new Error("Org approval note must be non-empty.");
  const config = await loadConfig(cwd);
  const reviewer = config.organization.reviewers.find((item) => item.id === options.reviewer);
  if (!reviewer && !options.externalReviewer) {
    throw new Error(`Reviewer ${options.reviewer} is not configured.`);
  }
  if (reviewer && !reviewer.roles.includes(options.role) && !options.externalReviewer) {
    throw new Error(`Reviewer ${options.reviewer} does not have role ${options.role}.`);
  }
  const matrix = await getApprovalMatrix(cwd, runId);
  const artifactHashes = await hashApprovalArtifacts(cwd, runId);
  const sanitizedNote = redactOrgText(options.note);
  const createdAt = new Date().toISOString();
  const payload = {
    runId,
    createdAt,
    reviewerId: options.reviewer,
    role: options.role,
    decision: options.decision,
    noteHash: sha256Text(sanitizedNote),
    artifactHashes
  };
  matrix.approvals.push({
    id: `org-approval-${createdAt.replace(/[-:.TZ]/g, "")}-${matrix.approvals.length + 1}`,
    createdAt,
    reviewerId: options.reviewer,
    reviewerDisplayName: reviewer?.display_name ?? options.reviewer,
    role: options.role,
    decision: options.decision,
    noteHash: payload.noteHash,
    artifactHashes,
    signature: { algorithm: "sha256-local", payloadHash: sha256Text(JSON.stringify(payload)) }
  });
  matrix.quorum = computeQuorum(matrix);
  await writeMatrix(cwd, runId, matrix);
  await appendOrgAuditEvent(cwd, {
    eventType: "org.approval.added",
    actor: options.reviewer,
    runId,
    summary: `Organization approval recorded for role ${options.role}: ${options.decision}`,
    artifactHashes,
    redacted: true
  });
  await writeLedgerManifest(cwd, runId);
  return matrix;
}

export function computeQuorum(matrix: OrgApprovalMatrix): OrgApprovalMatrix["quorum"] {
  const blockingReasons: string[] = [];
  const warnings: string[] = [];
  const approved = matrix.approvals.filter((approval) => approval.decision === "approved");
  const rejected = matrix.approvals.filter((approval) => approval.decision === "rejected");
  const needsChanges = matrix.approvals.filter((approval) => approval.decision === "needs_changes");
  if (rejected.length) blockingReasons.push("Rejected organization approval exists.");
  if (needsChanges.length) blockingReasons.push("needs_changes organization approval exists.");
  const roles = new Set(approved.map((approval) => approval.role));
  const missingRoles = matrix.requiredRoles.filter((role) => !roles.has(role));
  const reviewers = new Set(approved.map((approval) => approval.reviewerId));
  if (approved.length < matrix.minApprovals) blockingReasons.push("Minimum approvals are not met.");
  if (missingRoles.length) blockingReasons.push("Required reviewer roles are missing.");
  if (matrix.requireDistinctReviewers && reviewers.size < approved.length) {
    blockingReasons.push("Distinct reviewers are required.");
  }
  return {
    status: blockingReasons.length
      ? rejected.length || needsChanges.length
        ? "blocked"
        : "not_met"
      : "met",
    approvedCount: approved.length,
    distinctReviewerCount: reviewers.size,
    missingRoles,
    blockingReasons,
    warnings
  };
}

export async function verifyApprovalMatrix(
  cwd: string,
  runId: string
): Promise<{
  ok: boolean;
  checks: Array<{ name: string; ok: boolean; message: string }>;
}> {
  const matrix = await getApprovalMatrix(cwd, runId, { write: false });
  const checks: Array<{ name: string; ok: boolean; message: string }> = [];
  for (const approval of matrix.approvals) {
    for (const artifact of approval.artifactHashes) {
      if (artifact.path === "ledger-manifest.json" || artifact.path === "state.json") {
        checks.push({ name: artifact.path, ok: true, message: "volatile ledger hash recorded" });
        continue;
      }
      const fullPath = join(new RunStore(cwd).runPath(runId), artifact.path);
      if (!pathExists(fullPath)) {
        checks.push({ name: artifact.path, ok: false, message: "missing" });
      } else {
        const hash = await sha256File(fullPath);
        checks.push({
          name: artifact.path,
          ok: hash.sha256 === artifact.sha256,
          message: hash.sha256 === artifact.sha256 ? "ok" : "hash mismatch"
        });
      }
    }
    const signatureOk = approval.signature.payloadHash.length === 64;
    checks.push({
      name: approval.id,
      ok: signatureOk,
      message: signatureOk ? "ok" : "invalid local signature"
    });
  }
  const ok = checks.every((check) => check.ok);
  await updateOrganizationState(new RunStore(cwd), runId, (org) => {
    org.approvals.status = ok ? matrix.quorum.status : "invalid";
    org.approvals.approvalPolicy = matrix.approvalPolicy;
    org.approvals.approvedCount = matrix.quorum.approvedCount;
    org.approvals.missingRoles = matrix.quorum.missingRoles;
  });
  return { ok, checks };
}

async function writeMatrix(cwd: string, runId: string, matrix: OrgApprovalMatrix): Promise<void> {
  const store = new RunStore(cwd);
  await ensureDir(join(store.runPath(runId), "org"));
  await writeJson(join(store.runPath(runId), "org", "APPROVAL_MATRIX.json"), matrix);
  await store.writeTextArtifact(runId, "org/MULTI_REVIEWER_APPROVALS.md", renderMatrix(matrix));
  await updateOrganizationState(store, runId, (org) => {
    org.enabled = matrix.orgId !== null;
    org.approvals.status = matrix.quorum.status;
    org.approvals.approvalPolicy = matrix.approvalPolicy;
    org.approvals.approvedCount = matrix.quorum.approvedCount;
    org.approvals.missingRoles = matrix.quorum.missingRoles;
  });
}

function renderMatrix(matrix: OrgApprovalMatrix): string {
  return `# Multi-Reviewer Approvals

Policy: ${matrix.approvalPolicy}
Quorum: ${matrix.quorum.status}
Approved count: ${matrix.quorum.approvedCount}
Missing roles: ${matrix.quorum.missingRoles.join(", ") || "none"}

Approvals:
${matrix.approvals.map((approval) => `- ${approval.reviewerId} (${approval.role}): ${approval.decision}`).join("\n") || "- none"}
`;
}

async function hashApprovalArtifacts(
  cwd: string,
  runId: string
): Promise<Array<{ path: string; sha256: string }>> {
  const store = new RunStore(cwd);
  const result = [];
  for (const artifact of approvalArtifacts) {
    const fullPath = join(store.runPath(runId), artifact);
    if (!pathExists(fullPath)) continue;
    const hash = await sha256File(fullPath);
    result.push({ path: artifact, sha256: hash.sha256 });
  }
  return result;
}

export async function readApprovalMatrixNoteHashes(cwd: string, runId: string): Promise<string[]> {
  const path = join(new RunStore(cwd).runPath(runId), "org", "APPROVAL_MATRIX.json");
  if (!pathExists(path)) return [];
  const content = await readFile(path, "utf8");
  return [...content.matchAll(/"noteHash":\s*"([a-f0-9]+)"/g)].map((match) => match[1] ?? "");
}
