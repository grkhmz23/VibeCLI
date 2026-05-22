import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { loadConfig, saveConfig } from "../config/config.js";
import { ensureDir, pathExists } from "../utils/fs.js";
import { orgPaths } from "./config.js";
import { appendOrgAuditEvent, readOrgAudit, verifyOrgAuditLog } from "./audit-log.js";
import { orgKeyStatus } from "./keyring.js";
export async function orgStatus(cwd) {
    const config = await loadConfig(cwd);
    const audit = await readOrgAudit(cwd);
    const key = await orgKeyStatus(cwd).catch(() => ({
        status: "missing",
        publicKeyFingerprint: null
    }));
    const roles = {};
    for (const reviewer of config.organization.reviewers) {
        for (const role of reviewer.roles)
            roles[role] = (roles[role] ?? 0) + 1;
    }
    return {
        enabled: config.organization.enabled,
        orgId: config.organization.org_id,
        orgName: config.organization.org_name,
        requireSignedPolicyBundle: config.organization.require_signed_policy_bundle,
        approvalPolicies: Object.keys(config.organization.approval_policies),
        reviewerCount: config.organization.reviewers.length,
        roles,
        auditLog: {
            events: audit.events.length,
            latestChainHash: audit.chain.at(-1)?.chainHash ?? null
        },
        key: { status: key.status, publicKeyFingerprint: key.publicKeyFingerprint }
    };
}
export async function initOrganization(cwd, options) {
    const expected = options.force
        ? "FORCE INIT ORGANIZATION"
        : options.createKey
            ? "INIT ORGANIZATION WITH KEY"
            : "INIT ORGANIZATION";
    if (options.confirm !== expected) {
        throw new Error(`Organization init requires exact confirmation: ${expected}`);
    }
    const config = await loadConfig(cwd);
    if (config.organization.enabled && !options.force) {
        throw new Error("Organization workflow is already enabled; use --force with exact confirmation.");
    }
    const paths = await orgPaths(cwd);
    await ensureDir(paths.keyDir);
    await ensureDir(paths.policyBundleDir);
    await ensureDir(paths.auditLogDir);
    await ensureDir(paths.exportsDir);
    config.organization.enabled = !options.noEnable;
    await saveConfig(cwd, config);
    await writeFile(join(paths.orgRoot, "ORG_STATUS.md"), renderOrgStatus(await orgStatus(cwd)), "utf8");
    await appendOrgAuditEvent(cwd, {
        eventType: "org.init",
        actor: null,
        runId: null,
        summary: `Organization initialized. enabled=${config.organization.enabled}`,
        artifactHashes: pathExists(join(cwd, ".vibecli", "config.yaml"))
            ? [{ path: ".vibecli/config.yaml", sha256: "config-updated" }]
            : [],
        redacted: true
    });
    if (options.createKey) {
        const { initOrgKey } = await import("./keyring.js");
        await initOrgKey(cwd, { confirm: "CREATE ORG KEY" });
    }
    return orgStatus(cwd);
}
export async function listOrgReviewers(cwd) {
    const config = await loadConfig(cwd);
    return config.organization.reviewers.map((reviewer) => ({
        id: reviewer.id,
        displayName: reviewer.display_name,
        roles: reviewer.roles
    }));
}
export async function orgAuditSummary(cwd, verify = false) {
    if (verify) {
        const result = await verifyOrgAuditLog(cwd);
        await appendOrgAuditEvent(cwd, {
            eventType: "org.audit.verified",
            actor: null,
            runId: null,
            summary: `Organization audit verification ${result.ok ? "passed" : "failed"}.`,
            artifactHashes: [],
            redacted: true
        }).catch(() => undefined);
        return result;
    }
    const audit = await readOrgAudit(cwd);
    return {
        eventCount: audit.events.length,
        latestChainHash: audit.chain.at(-1)?.chainHash ?? null,
        errors: []
    };
}
function renderOrgStatus(status) {
    return `# Organization Status

Enabled: ${status.enabled}
Org: ${status.orgId} (${status.orgName})
Signed policy bundle required: ${status.requireSignedPolicyBundle}
Reviewers: ${status.reviewerCount}
Audit events: ${status.auditLog.events}
`;
}
//# sourceMappingURL=status.js.map