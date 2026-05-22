import { agentRoleIds } from "../agents/roles.js";
function tokens(input) {
    return [...input.matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g)].map((match) => match[1] ?? match[2] ?? match[3] ?? "");
}
function confirmValue(parts) {
    const index = parts.indexOf("--confirm");
    return index >= 0 ? parts[index + 1] : undefined;
}
function optionValue(parts, flag) {
    const index = parts.indexOf(flag);
    return index >= 0 ? parts[index + 1] : undefined;
}
function isAgentRole(value) {
    return Boolean(value && agentRoleIds.includes(value));
}
export function parseConsoleCommand(input) {
    const trimmed = input.trim();
    if (!trimmed)
        return { type: "unknown", message: "Enter a request or /help." };
    if (/^vibe(?:\s|$)/.test(trimmed)) {
        return { type: "cli-command-inside-console", input: trimmed };
    }
    if (!trimmed.startsWith("/"))
        return { type: "plain", prompt: trimmed };
    const parts = tokens(trimmed);
    const command = parts[0]?.slice(1);
    switch (command) {
        case "help":
            return { type: "help" };
        case "init":
            return { type: "init" };
        case "exit":
        case "quit":
            return { type: "exit" };
        case "status":
            return { type: "status", runId: parts[1] };
        case "watch":
            return { type: "status", runId: parts[1], watch: true };
        case "run": {
            const live = parts.includes("--live");
            const stream = parts.includes("--stream");
            const prompt = parts
                .filter((part, index) => index > 0 && part !== "--live" && part !== "--stream")
                .join(" ");
            return { type: "run", prompt, live, stream };
        }
        case "mode":
            return parts[1] === "dry-run" || parts[1] === "live"
                ? { type: "mode", mode: parts[1] }
                : { type: "mode" };
        case "stream":
            return parts[1] === "on"
                ? { type: "stream", enabled: true }
                : parts[1] === "off"
                    ? { type: "stream", enabled: false }
                    : { type: "stream" };
        case "policies":
            return { type: "policies" };
        case "policy":
            return { type: "policy", name: parts[1] };
        case "route":
            return parts[1] === "--agent" && isAgentRole(parts[2])
                ? { type: "route", agent: parts[2] }
                : { type: "route" };
        case "workspace":
            return parts[1]
                ? { type: "workspace", runId: parts[1] }
                : { type: "unknown", message: "Usage: /workspace <run-id>" };
        case "review":
            return parts[1]
                ? { type: "review", runId: parts[1], diff: parts.includes("--diff") }
                : { type: "unknown", message: "Usage: /review <run-id> [--diff]" };
        case "diff":
            return parts[1]
                ? { type: "diff", runId: parts[1] }
                : { type: "unknown", message: "Usage: /diff <run-id>" };
        case "approve":
            return parts[1]
                ? { type: "approve", runId: parts[1] }
                : { type: "unknown", message: "Usage: /approve <run-id>" };
        case "apply":
            return parts[1]
                ? { type: "apply", runId: parts[1], confirm: confirmValue(parts) }
                : { type: "unknown", message: 'Usage: /apply <run-id> --confirm "APPLY <run-id>"' };
        case "rollback":
            return parts[1]
                ? { type: "rollback", runId: parts[1], confirm: confirmValue(parts) }
                : { type: "unknown", message: 'Usage: /rollback <run-id> --confirm "ROLLBACK <run-id>"' };
        case "providers":
            return { type: "providers", doctor: parts[1] === "doctor" };
        case "models":
            return { type: "models" };
        case "verify":
            return parts[1]
                ? {
                    type: "verify",
                    runId: parts[1],
                    confirm: confirmValue(parts),
                    all: parts.includes("--all")
                }
                : { type: "unknown", message: 'Usage: /verify <run-id> --confirm "VERIFY <run-id>"' };
        case "scan":
            return parts[1]
                ? {
                    type: "scan",
                    runId: parts[1],
                    external: parts.includes("--external"),
                    confirm: confirmValue(parts)
                }
                : { type: "unknown", message: "Usage: /scan <run-id>" };
        case "repair":
            return parts[1]
                ? {
                    type: "repair",
                    runId: parts[1],
                    live: parts.includes("--live"),
                    dryRun: parts.includes("--dry-run"),
                    plan: parts.includes("--plan"),
                    confirm: confirmValue(parts)
                }
                : { type: "unknown", message: "Usage: /repair <run-id> --dry-run" };
        case "cost":
            return parts[1]
                ? { type: "cost", runId: parts[1] }
                : { type: "unknown", message: "Usage: /cost <run-id>" };
        case "ledger":
            return parts[1]
                ? { type: "ledger", runId: parts[1], verify: parts.includes("--verify") }
                : { type: "unknown", message: "Usage: /ledger <run-id> [--verify]" };
        case "handoff":
            return parts[1]
                ? { type: "handoff", runId: parts[1], verify: parts.includes("--verify") }
                : { type: "unknown", message: "Usage: /handoff <run-id>" };
        case "pr-body":
            return parts[1]
                ? { type: "pr-body", runId: parts[1] }
                : { type: "unknown", message: "Usage: /pr-body <run-id>" };
        case "checklist":
            return parts[1]
                ? { type: "checklist", runId: parts[1] }
                : { type: "unknown", message: "Usage: /checklist <run-id>" };
        case "exceptions":
            return parts[1]
                ? { type: "exceptions", runId: parts[1] }
                : { type: "unknown", message: "Usage: /exceptions <run-id>" };
        case "approvals":
            return parts[1]
                ? { type: "approvals", runId: parts[1], verify: parts.includes("--verify") }
                : { type: "unknown", message: "Usage: /approvals <run-id>" };
        case "github":
            return parts[1] === "doctor"
                ? { type: "github", command: "doctor" }
                : parts[1] === "release" && parts[2]
                    ? {
                        type: "github-release",
                        runId: parts[2],
                        checkRemoteTag: parts.includes("--check-remote-tag"),
                        createDraft: parts.includes("--create-draft"),
                        updateDraft: parts.includes("--update-draft"),
                        tag: optionValue(parts, "--tag"),
                        confirm: confirmValue(parts)
                    }
                    : parts[1] === "pr" && parts[2]
                        ? {
                            type: "github",
                            command: "pr",
                            runId: parts[2],
                            mode: parts.includes("--sync")
                                ? "sync"
                                : parts.includes("--comment")
                                    ? "comment"
                                    : parts.includes("--update")
                                        ? "update"
                                        : "summary",
                            pr: optionValue(parts, "--pr"),
                            confirm: confirmValue(parts)
                        }
                        : { type: "unknown", message: "Usage: /github doctor | /github pr <run-id>" };
        case "readiness":
            return parts[1]
                ? { type: "readiness", runId: parts[1] }
                : { type: "unknown", message: "Usage: /readiness <run-id>" };
        case "branch":
            return parts[1]
                ? {
                    type: "branch",
                    runId: parts[1],
                    create: parts.includes("--create"),
                    confirm: confirmValue(parts)
                }
                : { type: "unknown", message: "Usage: /branch <run-id>" };
        case "commit-message":
        case "commit-msg":
            return parts[1]
                ? { type: "commit-message", runId: parts[1] }
                : { type: "unknown", message: "Usage: /commit-message <run-id>" };
        case "commit":
            return parts[1]
                ? {
                    type: "commit",
                    runId: parts[1],
                    create: parts.includes("--create"),
                    confirm: confirmValue(parts)
                }
                : { type: "unknown", message: "Usage: /commit <run-id>" };
        case "lifecycle":
            return parts[1]
                ? { type: "lifecycle", runId: parts[1] }
                : { type: "unknown", message: "Usage: /lifecycle <run-id>" };
        case "feedback":
            return parts[1]
                ? {
                    type: "feedback",
                    runId: parts[1],
                    github: parts.includes("--github"),
                    pr: optionValue(parts, "--pr"),
                    confirm: confirmValue(parts),
                    file: optionValue(parts, "--file")
                }
                : { type: "unknown", message: "Usage: /feedback <run-id>" };
        case "merge-readiness":
        case "merge-check":
            return parts[1]
                ? {
                    type: "merge-readiness",
                    runId: parts[1],
                    github: parts.includes("--github"),
                    pr: optionValue(parts, "--pr"),
                    confirm: confirmValue(parts)
                }
                : { type: "unknown", message: "Usage: /merge-readiness <run-id>" };
        case "release":
            return parts[1]
                ? {
                    type: "release",
                    runId: parts[1],
                    channel: optionValue(parts, "--channel"),
                    verify: parts.includes("--verify"),
                    strict: parts.includes("--strict"),
                    json: parts.includes("--json")
                }
                : { type: "unknown", message: "Usage: /release <run-id>" };
        case "changelog":
            return parts[1]
                ? {
                    type: "changelog",
                    runId: parts[1],
                    write: parts.includes("--write"),
                    confirm: confirmValue(parts),
                    json: parts.includes("--json")
                }
                : { type: "unknown", message: "Usage: /changelog <run-id>" };
        case "version":
            return parts[1]
                ? {
                    type: "version",
                    runId: parts[1],
                    bump: optionValue(parts, "--bump"),
                    preid: optionValue(parts, "--preid"),
                    version: optionValue(parts, "--version"),
                    apply: parts.includes("--apply"),
                    confirm: confirmValue(parts),
                    confirmMajor: optionValue(parts, "--confirm-major"),
                    json: parts.includes("--json")
                }
                : { type: "unknown", message: "Usage: /version <run-id>" };
        case "release-branch":
            return parts[1]
                ? {
                    type: "release-branch",
                    runId: parts[1],
                    create: parts.includes("--create"),
                    confirm: confirmValue(parts),
                    allowDirty: parts.includes("--allow-dirty"),
                    channel: optionValue(parts, "--channel")
                }
                : { type: "unknown", message: "Usage: /release-branch <run-id>" };
        case "tag":
            return parts[1]
                ? {
                    type: "tag",
                    runId: parts[1],
                    create: parts.includes("--create"),
                    deleteLocal: parts.includes("--delete-local"),
                    confirm: confirmValue(parts),
                    allowDirty: parts.includes("--allow-dirty")
                }
                : { type: "unknown", message: "Usage: /tag <run-id>" };
        case "ci":
            return parts[1]
                ? {
                    type: "ci",
                    runId: parts[1],
                    github: parts.includes("--github"),
                    confirm: confirmValue(parts),
                    file: optionValue(parts, "--file")
                }
                : { type: "unknown", message: "Usage: /ci <run-id>" };
        case "deployment-readiness":
        case "deploy-readiness":
            return parts[1]
                ? {
                    type: "deployment-readiness",
                    runId: parts[1],
                    channel: optionValue(parts, "--channel"),
                    json: parts.includes("--json")
                }
                : { type: "unknown", message: "Usage: /deployment-readiness <run-id>" };
        case "release-approval":
            return parts[1]
                ? {
                    type: "release-approval",
                    runId: parts[1],
                    decision: optionValue(parts, "--decision"),
                    reviewer: optionValue(parts, "--reviewer"),
                    note: optionValue(parts, "--note"),
                    confirm: confirmValue(parts)
                }
                : { type: "unknown", message: "Usage: /release-approval <run-id>" };
        case "release-readiness":
            return parts[1]
                ? {
                    type: "release-readiness",
                    runId: parts[1],
                    channel: optionValue(parts, "--channel"),
                    json: parts.includes("--json")
                }
                : { type: "unknown", message: "Usage: /release-readiness <run-id>" };
        case "provenance":
            return parts[1] === "key" &&
                (parts[2] === "status" || parts[2] === "init" || parts[2] === "export-public")
                ? {
                    type: "provenance",
                    keyCommand: parts[2],
                    sign: false,
                    verify: false,
                    confirm: confirmValue(parts),
                    rotate: parts.includes("--rotate"),
                    json: parts.includes("--json")
                }
                : parts[1]
                    ? {
                        type: "provenance",
                        runId: parts[1],
                        sign: parts.includes("--sign"),
                        verify: parts.includes("--verify"),
                        confirm: confirmValue(parts),
                        rotate: false,
                        json: parts.includes("--json")
                    }
                    : { type: "unknown", message: "Usage: /provenance <run-id> | /provenance key status" };
        case "checksums":
            return parts[1]
                ? {
                    type: "checksums",
                    runId: parts[1],
                    verify: parts.includes("--verify"),
                    json: parts.includes("--json")
                }
                : { type: "unknown", message: "Usage: /checksums <run-id>" };
        case "evidence":
            return parts[1]
                ? {
                    type: "evidence",
                    runId: parts[1],
                    sign: parts.includes("--sign"),
                    verify: parts.includes("--verify"),
                    confirm: confirmValue(parts),
                    json: parts.includes("--json")
                }
                : { type: "unknown", message: "Usage: /evidence <run-id>" };
        case "remote-targets":
            if (parts[1] === "list" || parts[1] === "doctor") {
                return {
                    type: "remote-targets",
                    command: parts[1],
                    ping: parts.includes("--ping"),
                    confirm: confirmValue(parts),
                    json: parts.includes("--json")
                };
            }
            if (parts[1] === "add" && parts[2] === "generic-http") {
                return {
                    type: "remote-targets",
                    command: "add",
                    name: optionValue(parts, "--name"),
                    url: optionValue(parts, "--url"),
                    tokenEnv: optionValue(parts, "--token-env"),
                    ping: false,
                    confirm: confirmValue(parts),
                    json: parts.includes("--json")
                };
            }
            if ((parts[1] === "disable" || parts[1] === "remove") && parts[2]) {
                return {
                    type: "remote-targets",
                    command: parts[1],
                    name: parts[2],
                    ping: false,
                    confirm: confirmValue(parts),
                    json: parts.includes("--json")
                };
            }
            return { type: "unknown", message: "Usage: /remote-targets list" };
        case "attestation":
            if ((parts[1] === "export" || parts[1] === "receipt") && parts[2]) {
                return {
                    type: "attestation",
                    command: parts[1],
                    runId: parts[2],
                    dryRun: false,
                    confirm: confirmValue(parts),
                    json: parts.includes("--json")
                };
            }
            if (parts[1] === "submit" && parts[2]) {
                return {
                    type: "attestation",
                    command: "submit",
                    runId: parts[2],
                    target: optionValue(parts, "--target"),
                    dryRun: parts.includes("--dry-run"),
                    confirm: confirmValue(parts),
                    json: parts.includes("--json")
                };
            }
            return { type: "unknown", message: "Usage: /attestation export <run-id>" };
        case "transparency":
            if (parts[1] === "append" && parts[2]) {
                return {
                    type: "transparency",
                    command: "append",
                    runId: parts[2],
                    confirm: confirmValue(parts),
                    json: parts.includes("--json")
                };
            }
            if (parts[1] === "verify") {
                return {
                    type: "transparency",
                    command: "verify",
                    runId: parts[2],
                    json: parts.includes("--json")
                };
            }
            return parts[1]
                ? {
                    type: "transparency",
                    command: "generate",
                    runId: parts[1],
                    json: parts.includes("--json")
                }
                : { type: "unknown", message: "Usage: /transparency <run-id>" };
        case "registry-metadata":
            return parts[1]
                ? {
                    type: "registry-metadata",
                    runId: parts[1],
                    image: optionValue(parts, "--image"),
                    tag: optionValue(parts, "--tag"),
                    json: parts.includes("--json")
                }
                : { type: "unknown", message: "Usage: /registry-metadata <run-id>" };
        case "org":
            if (parts[1] === "key") {
                return parts[2] === "status" || parts[2] === "init" || parts[2] === "export-public"
                    ? {
                        type: "org",
                        command: "key",
                        keyCommand: parts[2],
                        confirm: confirmValue(parts),
                        createKey: false,
                        rotate: parts.includes("--rotate"),
                        force: false,
                        noEnable: false,
                        verify: false,
                        json: parts.includes("--json")
                    }
                    : { type: "unknown", message: "Usage: /org key status" };
            }
            if (parts[1] === "status" ||
                parts[1] === "init" ||
                parts[1] === "reviewers" ||
                parts[1] === "audit") {
                return {
                    type: "org",
                    command: parts[1],
                    confirm: confirmValue(parts),
                    createKey: parts.includes("--create-key"),
                    rotate: false,
                    force: parts.includes("--force"),
                    noEnable: parts.includes("--no-enable"),
                    verify: parts.includes("--verify"),
                    json: parts.includes("--json")
                };
            }
            return { type: "unknown", message: "Usage: /org status" };
        case "org-policy":
            if (parts[1] === "bundle" || parts[1] === "verify" || parts[1] === "show") {
                return {
                    type: "org-policy",
                    command: parts[1],
                    sign: parts.includes("--sign"),
                    confirm: confirmValue(parts),
                    json: parts.includes("--json")
                };
            }
            return { type: "unknown", message: "Usage: /org-policy bundle" };
        case "org-approvals":
            return parts[1]
                ? {
                    type: "org-approvals",
                    runId: parts[1],
                    add: parts.includes("--add"),
                    reviewer: optionValue(parts, "--reviewer"),
                    role: optionValue(parts, "--role"),
                    decision: optionValue(parts, "--decision"),
                    note: optionValue(parts, "--note"),
                    externalReviewer: parts.includes("--external-reviewer"),
                    quorum: parts.includes("--quorum"),
                    verify: parts.includes("--verify"),
                    confirm: confirmValue(parts),
                    json: parts.includes("--json")
                }
                : { type: "unknown", message: "Usage: /org-approvals <run-id>" };
        case "receipt-refresh":
            return parts[1]
                ? {
                    type: "receipt-refresh",
                    runId: parts[1],
                    dryRun: parts.includes("--dry-run"),
                    verifyRemote: parts.includes("--verify-remote"),
                    confirm: confirmValue(parts),
                    json: parts.includes("--json")
                }
                : { type: "unknown", message: "Usage: /receipt-refresh <run-id>" };
        case "retention":
            return parts[1]
                ? {
                    type: "retention",
                    runId: parts[1],
                    policy: optionValue(parts, "--policy"),
                    mark: parts.includes("--mark"),
                    purgePreview: parts.includes("--purge-preview"),
                    confirm: confirmValue(parts),
                    json: parts.includes("--json")
                }
                : { type: "unknown", message: "Usage: /retention <run-id>" };
        case "evidence-export":
            return parts[1]
                ? {
                    type: "evidence-export",
                    runId: parts[1],
                    mode: optionValue(parts, "--mode"),
                    verify: parts.includes("--verify"),
                    json: parts.includes("--json")
                }
                : { type: "unknown", message: "Usage: /evidence-export <run-id>" };
        case "org-report":
            return parts[1]
                ? { type: "org-report", runId: parts[1], json: parts.includes("--json") }
                : { type: "unknown", message: "Usage: /org-report <run-id>" };
        case "audit-schemas":
            if (parts[1] === "list" ||
                parts[1] === "show" ||
                parts[1] === "validate" ||
                parts[1] === "install-defaults") {
                return {
                    type: "audit-schemas",
                    command: parts[1],
                    name: parts[2],
                    force: parts.includes("--force"),
                    confirm: confirmValue(parts),
                    json: parts.includes("--json")
                };
            }
            return { type: "unknown", message: "Usage: /audit-schemas list" };
        case "audit-map":
            return parts[1]
                ? {
                    type: "audit-map",
                    runId: parts[1],
                    schema: optionValue(parts, "--schema"),
                    json: parts.includes("--json")
                }
                : { type: "unknown", message: "Usage: /audit-map <run-id>" };
        case "audit-coverage":
            return parts[1]
                ? {
                    type: "audit-coverage",
                    runId: parts[1],
                    schema: optionValue(parts, "--schema"),
                    json: parts.includes("--json")
                }
                : { type: "unknown", message: "Usage: /audit-coverage <run-id>" };
        case "audit-gaps":
            return parts[1]
                ? {
                    type: "audit-gaps",
                    runId: parts[1],
                    schema: optionValue(parts, "--schema"),
                    json: parts.includes("--json")
                }
                : { type: "unknown", message: "Usage: /audit-gaps <run-id>" };
        case "audit-export":
            return parts[1]
                ? {
                    type: "audit-export",
                    runId: parts[1],
                    schema: optionValue(parts, "--schema"),
                    sign: parts.includes("--sign"),
                    verify: parts.includes("--verify"),
                    confirm: confirmValue(parts),
                    json: parts.includes("--json")
                }
                : { type: "unknown", message: "Usage: /audit-export <run-id>" };
        case "compliance-bundle":
            return parts[1]
                ? {
                    type: "compliance-bundle",
                    runId: parts[1],
                    schema: optionValue(parts, "--schema"),
                    minimal: parts.includes("--minimal"),
                    sign: parts.includes("--sign"),
                    verify: parts.includes("--verify"),
                    confirm: confirmValue(parts),
                    json: parts.includes("--json")
                }
                : { type: "unknown", message: "Usage: /compliance-bundle <run-id>" };
        case "reviewer-directory":
            if (parts[1] === "import" || parts[1] === "validate" || parts[1] === "list") {
                return {
                    type: "reviewer-directory",
                    command: parts[1],
                    file: optionValue(parts, "--file"),
                    apply: parts.includes("--apply"),
                    confirm: confirmValue(parts),
                    allowRawEmail: parts.includes("--allow-raw-email"),
                    rawEmailConfirm: optionValue(parts, "--raw-email-confirm"),
                    json: parts.includes("--json")
                };
            }
            return { type: "unknown", message: "Usage: /reviewer-directory import --file <path>" };
        case "auditor-handoff":
            return parts[1]
                ? {
                    type: "auditor-handoff",
                    runId: parts[1],
                    schema: optionValue(parts, "--schema"),
                    minimal: parts.includes("--minimal"),
                    verify: parts.includes("--verify"),
                    json: parts.includes("--json")
                }
                : { type: "unknown", message: "Usage: /auditor-handoff <run-id>" };
        case "evidence-inventory":
            return {
                type: "evidence-inventory",
                runId: parts[1]?.startsWith("--") ? undefined : parts[1],
                all: parts.includes("--all"),
                deep: parts.includes("--deep"),
                json: parts.includes("--json")
            };
        case "evidence-lifecycle":
            return {
                type: "evidence-lifecycle",
                runId: parts[1]?.startsWith("--") ? undefined : parts[1],
                all: parts.includes("--all"),
                json: parts.includes("--json")
            };
        case "retention-enforce":
            return parts[1]
                ? {
                    type: "retention-enforce",
                    runId: parts[1],
                    policy: optionValue(parts, "--policy"),
                    json: parts.includes("--json")
                }
                : { type: "unknown", message: "Usage: /retention-enforce <run-id>" };
        case "evidence-archive":
            return parts[1]
                ? {
                    type: "evidence-archive",
                    runId: parts[1],
                    create: parts.includes("--create"),
                    mode: optionValue(parts, "--mode"),
                    sign: parts.includes("--sign"),
                    confirm: confirmValue(parts),
                    verify: parts.includes("--verify"),
                    json: parts.includes("--json")
                }
                : { type: "unknown", message: "Usage: /evidence-archive <run-id>" };
        case "retention-ledger":
            return {
                type: "retention-ledger",
                runId: parts[1]?.startsWith("--") ? undefined : parts[1],
                verify: parts.includes("--verify"),
                record: parts.includes("--record"),
                event: optionValue(parts, "--event"),
                summary: optionValue(parts, "--summary"),
                confirm: confirmValue(parts),
                json: parts.includes("--json")
            };
        case "legal-hold":
            return parts[1]
                ? {
                    type: "legal-hold",
                    runId: parts[1],
                    enable: parts.includes("--enable"),
                    release: parts.includes("--release"),
                    reason: optionValue(parts, "--reason"),
                    by: optionValue(parts, "--by"),
                    confirm: confirmValue(parts),
                    json: parts.includes("--json")
                }
                : { type: "unknown", message: "Usage: /legal-hold <run-id>" };
        case "evidence-compact":
            return parts[1]
                ? {
                    type: "evidence-compact",
                    runId: parts[1],
                    bundle: parts.includes("--bundle"),
                    confirm: confirmValue(parts),
                    verify: parts.includes("--verify"),
                    json: parts.includes("--json")
                }
                : { type: "unknown", message: "Usage: /evidence-compact <run-id>" };
        case "evidence-report":
            return {
                type: "evidence-report",
                deep: parts.includes("--deep"),
                policy: optionValue(parts, "--policy"),
                json: parts.includes("--json")
            };
        case "disposal-eligibility":
            return {
                type: "disposal-eligibility",
                runId: parts[1]?.startsWith("--") ? undefined : parts[1],
                all: parts.includes("--all"),
                policy: optionValue(parts, "--policy"),
                json: parts.includes("--json")
            };
        case "disposal-candidates":
            return parts[1]
                ? { type: "disposal-candidates", runId: parts[1], json: parts.includes("--json") }
                : { type: "unknown", message: "Usage: /disposal-candidates <run-id>" };
        case "disposal-plan":
            return parts[1]
                ? {
                    type: "disposal-plan",
                    runId: parts[1],
                    forcePreview: parts.includes("--force-preview"),
                    json: parts.includes("--json")
                }
                : { type: "unknown", message: "Usage: /disposal-plan <run-id>" };
        case "disposal-attestation":
            return parts[1]
                ? {
                    type: "disposal-attestation",
                    runId: parts[1],
                    sign: parts.includes("--sign"),
                    confirm: confirmValue(parts),
                    json: parts.includes("--json")
                }
                : { type: "unknown", message: "Usage: /disposal-attestation <run-id>" };
        case "disposal-approvals":
            return parts[1]
                ? {
                    type: "disposal-approvals",
                    runId: parts[1],
                    add: parts.includes("--add"),
                    reviewer: optionValue(parts, "--reviewer"),
                    role: optionValue(parts, "--role"),
                    decision: optionValue(parts, "--decision"),
                    note: optionValue(parts, "--note"),
                    externalReviewer: parts.includes("--external-reviewer"),
                    quorum: parts.includes("--quorum"),
                    verify: parts.includes("--verify"),
                    confirm: confirmValue(parts),
                    json: parts.includes("--json")
                }
                : { type: "unknown", message: "Usage: /disposal-approvals <run-id>" };
        case "disposal-precheck":
            return parts[1]
                ? { type: "disposal-precheck", runId: parts[1], json: parts.includes("--json") }
                : { type: "unknown", message: "Usage: /disposal-precheck <run-id>" };
        case "disposal-execute":
            return parts[1]
                ? {
                    type: "disposal-execute",
                    runId: parts[1],
                    dryRun: parts.includes("--dry-run"),
                    confirm: confirmValue(parts),
                    json: parts.includes("--json")
                }
                : { type: "unknown", message: "Usage: /disposal-execute <run-id>" };
        case "disposal-report":
            return {
                type: "disposal-report",
                deep: parts.includes("--deep"),
                json: parts.includes("--json")
            };
        case "dogfood":
            return parts[1] === "plan" ||
                parts[1] === "fixtures" ||
                parts[1] === "run" ||
                parts[1] === "report"
                ? {
                    type: "dogfood",
                    command: parts[1],
                    fixture: optionValue(parts, "--fixture"),
                    writeFixtures: parts.includes("--write-fixtures"),
                    clean: parts.includes("--clean"),
                    applyFixturePatches: parts.includes("--apply-fixture-patches"),
                    confirm: confirmValue(parts),
                    json: parts.includes("--json")
                }
                : { type: "unknown", message: "Usage: /dogfood plan|fixtures|run|report" };
        case "live-smoke":
            return {
                type: "live-smoke",
                provider: optionValue(parts, "--provider"),
                model: optionValue(parts, "--model"),
                profile: optionValue(parts, "--profile"),
                rc: parts.includes("--rc"),
                confirm: confirmValue(parts),
                json: parts.includes("--json")
            };
        case "scanner-check":
            return {
                type: "scanner-check",
                runSafe: parts.includes("--run-safe"),
                strict: parts.includes("--strict"),
                installGuide: parts.includes("--install-guide"),
                confirm: confirmValue(parts),
                json: parts.includes("--json")
            };
        case "security-redteam":
            return { type: "security-redteam", json: parts.includes("--json") };
        case "package-check":
            return { type: "package-check", json: parts.includes("--json") };
        case "package-install-check":
            return { type: "package-install-check", json: parts.includes("--json") };
        case "docs-check":
            return {
                type: "docs-check",
                strict: parts.includes("--strict"),
                json: parts.includes("--json")
            };
        case "perf-check":
            return { type: "perf-check", json: parts.includes("--json") };
        case "beta-check":
            return {
                type: "beta-check",
                strict: parts.includes("--strict"),
                json: parts.includes("--json")
            };
        case "beta-backlog":
            return { type: "beta-backlog", json: parts.includes("--json") };
        case "beta-warnings":
            return parts[1] === "accept" || parts[1] === "resolve"
                ? {
                    type: "beta-warnings",
                    command: parts[1],
                    warningId: parts[2],
                    by: optionValue(parts, "--by"),
                    reason: optionValue(parts, "--reason"),
                    confirm: confirmValue(parts),
                    strict: parts.includes("--strict"),
                    json: parts.includes("--json")
                }
                : {
                    type: "beta-warnings",
                    strict: parts.includes("--strict"),
                    json: parts.includes("--json")
                };
        case "dogfood-apply-smoke":
            return { type: "dogfood-apply-smoke", json: parts.includes("--json") };
        case "beta-rc":
            return {
                type: "beta-rc",
                channel: optionValue(parts, "--channel"),
                strict: parts.includes("--strict"),
                json: parts.includes("--json")
            };
        case "beta-trial":
            return parts[1] === "create" || parts[1] === "list" || parts[1] === "show"
                ? {
                    type: "beta-trial",
                    command: parts[1],
                    target: optionValue(parts, "--target"),
                    trialId: parts[2],
                    json: parts.includes("--json")
                }
                : { type: "unknown", message: "Usage: /beta-trial create|list|show" };
        case "doctor":
            return { type: "doctor" };
        case "clear":
            return { type: "clear" };
        default:
            return {
                type: "unknown",
                message: `Unknown command /${command}. Run /help for available commands.`
            };
    }
}
//# sourceMappingURL=shortcuts.js.map