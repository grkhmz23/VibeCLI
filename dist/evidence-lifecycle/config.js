import { join } from "node:path";
import { loadConfig } from "../config/config.js";
export const defaultEvidenceLifecycleConfig = {
    enabled: true,
    archive_dir: ".vibecli/evidence-archive",
    lifecycle_dir: ".vibecli/evidence-lifecycle",
    retention_ledger_dir: ".vibecli/evidence-lifecycle/retention-ledger",
    default_archive_mode: "audit",
    allowed_archive_modes: ["minimal", "audit", "forensic_redacted"],
    require_ledger_pass_for_archive: true,
    require_org_retention_plan_for_archive: false,
    require_signed_archive_manifest: false,
    allow_archive_without_release_packet: true,
    allow_archive_without_evidence_bundle: true,
    allow_compact_summary_bundle: true,
    delete_originals_after_archive: false,
    purge_enabled: false,
    max_archive_bytes: 10_000_000,
    redaction: {
        exclude_private_keys: true,
        exclude_env_files: true,
        exclude_raw_provider_outputs: true,
        exclude_unbounded_command_logs: true,
        redact_secret_like_values: true
    },
    legal_hold: {
        enabled: true,
        require_reason: true
    }
};
export async function loadEvidenceLifecycleConfig(cwd) {
    const config = await loadConfig(cwd);
    return { ...defaultEvidenceLifecycleConfig, ...config.evidence_lifecycle };
}
export async function evidenceLifecyclePaths(cwd) {
    const config = await loadEvidenceLifecycleConfig(cwd);
    return {
        archiveDir: join(cwd, config.archive_dir),
        lifecycleDir: join(cwd, config.lifecycle_dir),
        retentionLedgerDir: join(cwd, config.retention_ledger_dir)
    };
}
//# sourceMappingURL=config.js.map