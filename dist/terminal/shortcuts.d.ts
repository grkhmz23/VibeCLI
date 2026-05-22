import { type AgentRoleId } from "../agents/roles.js";
export type ConsoleCommand = {
    type: "help";
} | {
    type: "exit";
} | {
    type: "status";
    runId?: string;
    watch?: boolean;
} | {
    type: "run";
    prompt: string;
    live: boolean;
    stream: boolean;
} | {
    type: "mode";
    mode?: "dry-run" | "live";
} | {
    type: "stream";
    enabled?: boolean;
} | {
    type: "policies";
} | {
    type: "policy";
    name?: string;
} | {
    type: "route";
    agent?: AgentRoleId;
} | {
    type: "workspace";
    runId: string;
} | {
    type: "review";
    runId: string;
    diff: boolean;
} | {
    type: "diff";
    runId: string;
} | {
    type: "approve";
    runId: string;
} | {
    type: "apply";
    runId: string;
    confirm?: string;
} | {
    type: "rollback";
    runId: string;
    confirm?: string;
} | {
    type: "providers";
    doctor?: boolean;
} | {
    type: "models";
} | {
    type: "verify";
    runId: string;
    confirm?: string;
    all: boolean;
} | {
    type: "scan";
    runId: string;
    external: boolean;
    confirm?: string;
} | {
    type: "repair";
    runId: string;
    live: boolean;
    dryRun: boolean;
    plan: boolean;
    confirm?: string;
} | {
    type: "cost";
    runId: string;
} | {
    type: "ledger";
    runId: string;
    verify: boolean;
} | {
    type: "handoff";
    runId: string;
    verify: boolean;
} | {
    type: "pr-body";
    runId: string;
} | {
    type: "checklist";
    runId: string;
} | {
    type: "exceptions";
    runId: string;
} | {
    type: "approvals";
    runId: string;
    verify: boolean;
} | {
    type: "github";
    command: "doctor" | "pr";
    runId?: string;
    mode?: "summary" | "update" | "comment" | "sync";
    pr?: string;
    confirm?: string;
} | {
    type: "github-release";
    runId: string;
    checkRemoteTag: boolean;
    createDraft: boolean;
    updateDraft: boolean;
    tag?: string;
    confirm?: string;
} | {
    type: "readiness";
    runId: string;
} | {
    type: "branch";
    runId: string;
    create: boolean;
    confirm?: string;
} | {
    type: "commit-message";
    runId: string;
} | {
    type: "commit";
    runId: string;
    create: boolean;
    confirm?: string;
} | {
    type: "lifecycle";
    runId: string;
} | {
    type: "feedback";
    runId: string;
    github: boolean;
    pr?: string;
    confirm?: string;
    file?: string;
} | {
    type: "merge-readiness";
    runId: string;
    github: boolean;
    pr?: string;
    confirm?: string;
} | {
    type: "release";
    runId: string;
    channel?: string;
    verify: boolean;
    strict: boolean;
    json: boolean;
} | {
    type: "changelog";
    runId: string;
    write: boolean;
    confirm?: string;
    json: boolean;
} | {
    type: "version";
    runId: string;
    bump?: string;
    preid?: string;
    version?: string;
    apply: boolean;
    confirm?: string;
    confirmMajor?: string;
    json: boolean;
} | {
    type: "release-branch";
    runId: string;
    create: boolean;
    confirm?: string;
    allowDirty: boolean;
    channel?: string;
} | {
    type: "tag";
    runId: string;
    create: boolean;
    deleteLocal: boolean;
    confirm?: string;
    allowDirty: boolean;
} | {
    type: "ci";
    runId: string;
    github: boolean;
    confirm?: string;
    file?: string;
} | {
    type: "deployment-readiness";
    runId: string;
    channel?: string;
    json: boolean;
} | {
    type: "release-approval";
    runId: string;
    decision?: "approved" | "rejected" | "needs_changes";
    reviewer?: string;
    note?: string;
    confirm?: string;
} | {
    type: "release-readiness";
    runId: string;
    channel?: string;
    json: boolean;
} | {
    type: "provenance";
    runId?: string;
    keyCommand?: "status" | "init" | "export-public";
    sign: boolean;
    verify: boolean;
    confirm?: string;
    rotate: boolean;
    json: boolean;
} | {
    type: "checksums";
    runId: string;
    verify: boolean;
    json: boolean;
} | {
    type: "evidence";
    runId: string;
    sign: boolean;
    verify: boolean;
    confirm?: string;
    json: boolean;
} | {
    type: "remote-targets";
    command: "list" | "doctor" | "add" | "disable" | "remove";
    name?: string;
    url?: string;
    tokenEnv?: string;
    ping: boolean;
    confirm?: string;
    json: boolean;
} | {
    type: "attestation";
    command: "export" | "submit" | "receipt";
    runId: string;
    target?: string;
    dryRun: boolean;
    confirm?: string;
    json: boolean;
} | {
    type: "transparency";
    command: "generate" | "append" | "verify";
    runId?: string;
    confirm?: string;
    json: boolean;
} | {
    type: "registry-metadata";
    runId: string;
    image?: string;
    tag?: string;
    json: boolean;
} | {
    type: "org";
    command: "status" | "init" | "reviewers" | "audit" | "key";
    keyCommand?: "status" | "init" | "export-public";
    confirm?: string;
    createKey: boolean;
    rotate: boolean;
    force: boolean;
    noEnable: boolean;
    verify: boolean;
    json: boolean;
} | {
    type: "org-policy";
    command: "bundle" | "verify" | "show";
    sign: boolean;
    confirm?: string;
    json: boolean;
} | {
    type: "org-approvals";
    runId: string;
    add: boolean;
    reviewer?: string;
    role?: string;
    decision?: "approved" | "rejected" | "needs_changes";
    note?: string;
    externalReviewer: boolean;
    quorum: boolean;
    verify: boolean;
    confirm?: string;
    json: boolean;
} | {
    type: "receipt-refresh";
    runId: string;
    dryRun: boolean;
    verifyRemote: boolean;
    confirm?: string;
    json: boolean;
} | {
    type: "retention";
    runId: string;
    policy?: string;
    mark: boolean;
    purgePreview: boolean;
    confirm?: string;
    json: boolean;
} | {
    type: "evidence-export";
    runId: string;
    mode?: string;
    verify: boolean;
    json: boolean;
} | {
    type: "org-report";
    runId: string;
    json: boolean;
} | {
    type: "audit-schemas";
    command: "list" | "show" | "validate" | "install-defaults";
    name?: string;
    force: boolean;
    confirm?: string;
    json: boolean;
} | {
    type: "audit-map";
    runId: string;
    schema?: string;
    json: boolean;
} | {
    type: "audit-coverage";
    runId: string;
    schema?: string;
    json: boolean;
} | {
    type: "audit-gaps";
    runId: string;
    schema?: string;
    json: boolean;
} | {
    type: "audit-export";
    runId: string;
    schema?: string;
    sign: boolean;
    verify: boolean;
    confirm?: string;
    json: boolean;
} | {
    type: "compliance-bundle";
    runId: string;
    schema?: string;
    minimal: boolean;
    sign: boolean;
    verify: boolean;
    confirm?: string;
    json: boolean;
} | {
    type: "reviewer-directory";
    command: "import" | "list" | "validate";
    file?: string;
    apply: boolean;
    confirm?: string;
    allowRawEmail: boolean;
    rawEmailConfirm?: string;
    json: boolean;
} | {
    type: "auditor-handoff";
    runId: string;
    schema?: string;
    minimal: boolean;
    verify: boolean;
    json: boolean;
} | {
    type: "evidence-inventory";
    runId?: string;
    all: boolean;
    deep: boolean;
    json: boolean;
} | {
    type: "evidence-lifecycle";
    runId?: string;
    all: boolean;
    json: boolean;
} | {
    type: "retention-enforce";
    runId: string;
    policy?: string;
    json: boolean;
} | {
    type: "evidence-archive";
    runId: string;
    create: boolean;
    mode?: string;
    sign: boolean;
    confirm?: string;
    verify: boolean;
    json: boolean;
} | {
    type: "retention-ledger";
    runId?: string;
    verify: boolean;
    record: boolean;
    event?: string;
    summary?: string;
    confirm?: string;
    json: boolean;
} | {
    type: "legal-hold";
    runId: string;
    enable: boolean;
    release: boolean;
    reason?: string;
    by?: string;
    confirm?: string;
    json: boolean;
} | {
    type: "evidence-compact";
    runId: string;
    bundle: boolean;
    confirm?: string;
    verify: boolean;
    json: boolean;
} | {
    type: "evidence-report";
    deep: boolean;
    policy?: string;
    json: boolean;
} | {
    type: "disposal-eligibility";
    runId?: string;
    all: boolean;
    policy?: string;
    json: boolean;
} | {
    type: "disposal-candidates";
    runId: string;
    json: boolean;
} | {
    type: "disposal-plan";
    runId: string;
    forcePreview: boolean;
    json: boolean;
} | {
    type: "disposal-attestation";
    runId: string;
    sign: boolean;
    confirm?: string;
    json: boolean;
} | {
    type: "disposal-approvals";
    runId: string;
    add: boolean;
    reviewer?: string;
    role?: string;
    decision?: "approved" | "rejected" | "needs_changes";
    note?: string;
    externalReviewer: boolean;
    quorum: boolean;
    verify: boolean;
    confirm?: string;
    json: boolean;
} | {
    type: "disposal-precheck";
    runId: string;
    json: boolean;
} | {
    type: "disposal-execute";
    runId: string;
    dryRun: boolean;
    confirm?: string;
    json: boolean;
} | {
    type: "disposal-report";
    deep: boolean;
    json: boolean;
} | {
    type: "dogfood";
    command: "plan" | "fixtures" | "run" | "report";
    fixture?: string;
    writeFixtures: boolean;
    clean: boolean;
    applyFixturePatches: boolean;
    confirm?: string;
    json: boolean;
} | {
    type: "live-smoke";
    provider?: string;
    model?: string;
    profile?: string;
    rc: boolean;
    confirm?: string;
    json: boolean;
} | {
    type: "scanner-check";
    runSafe: boolean;
    strict: boolean;
    installGuide: boolean;
    confirm?: string;
    json: boolean;
} | {
    type: "security-redteam";
    json: boolean;
} | {
    type: "package-check";
    json: boolean;
} | {
    type: "package-install-check";
    json: boolean;
} | {
    type: "docs-check";
    strict: boolean;
    json: boolean;
} | {
    type: "perf-check";
    json: boolean;
} | {
    type: "beta-check";
    strict: boolean;
    json: boolean;
} | {
    type: "beta-backlog";
    json: boolean;
} | {
    type: "beta-warnings";
    command?: "accept" | "resolve";
    warningId?: string;
    by?: string;
    reason?: string;
    confirm?: string;
    strict: boolean;
    json: boolean;
} | {
    type: "dogfood-apply-smoke";
    json: boolean;
} | {
    type: "beta-rc";
    channel?: string;
    strict: boolean;
    json: boolean;
} | {
    type: "beta-trial";
    command: "create" | "list" | "show";
    target?: string;
    trialId?: string;
    json: boolean;
} | {
    type: "doctor";
} | {
    type: "clear";
} | {
    type: "plain";
    prompt: string;
} | {
    type: "unknown";
    message: string;
};
export declare function parseConsoleCommand(input: string): ConsoleCommand;
