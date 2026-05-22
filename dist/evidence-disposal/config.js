import { join } from "node:path";
import { loadConfig } from "../config/config.js";
export const defaultDisposalConfig = {
    enabled: true,
    disposal_dir: ".vibecli/evidence-lifecycle/disposal",
    require_retention_expired: true,
    require_no_legal_hold: true,
    require_archive_verified: true,
    require_retention_ledger: true,
    require_org_approval: false,
    require_disposal_attestation: true,
    delete_scope: "run-evidence-only",
    allow_archive_deletion: false,
    allow_key_deletion: false,
    allow_source_deletion: false,
    allow_remote_deletion: false,
    allow_automatic_purge: false,
    dry_run_by_default: true,
    max_files_per_disposal: 500,
    max_bytes_per_disposal: 50_000_000,
    protected_classes: [
        "private-keys",
        "env-files",
        "source-code",
        "archives",
        "org-keys",
        "provenance-keys",
        "git"
    ],
    receipt: {
        require_sha256_before_delete: true,
        require_post_delete_verification: true,
        include_recovery_guidance: true
    }
};
export async function loadDisposalConfig(cwd) {
    const config = await loadConfig(cwd);
    return {
        ...defaultDisposalConfig,
        ...config.evidence_disposal,
        receipt: { ...defaultDisposalConfig.receipt, ...config.evidence_disposal?.receipt }
    };
}
export async function disposalPaths(cwd) {
    const config = await loadDisposalConfig(cwd);
    return { disposalDir: join(cwd, config.disposal_dir) };
}
//# sourceMappingURL=config.js.map