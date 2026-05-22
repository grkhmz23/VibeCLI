export function classifyEvidencePath(path) {
    if (path === "ledger-manifest.json" || path.includes("ledger"))
        return "run-ledger";
    if (path.startsWith("patches/"))
        return "patches";
    if (path.startsWith("rollback/"))
        return "rollback";
    if (path.includes("verification"))
        return "verification";
    if (path.includes("scanner"))
        return "scanner";
    if (path.startsWith("handoff/") || path.includes("HANDOFF"))
        return "handoff";
    if (path.startsWith("git/") || path.includes("lifecycle") || path.includes("merge-readiness"))
        return "git-lifecycle";
    if (path.startsWith("release/"))
        return "release";
    if (path.startsWith("provenance/"))
        return "provenance";
    if (path.startsWith("evidence/"))
        return "evidence";
    if (path.startsWith("remote-attestation/"))
        return "remote-attestation";
    if (path.startsWith("org/"))
        return "organization";
    if (path.startsWith("audit/"))
        return "audit";
    if (path.includes("console"))
        return "console";
    return "unknown";
}
export function classifySensitivity(path, contentSample) {
    const warnings = [];
    if (path.endsWith(".private.pem") ||
        path.includes("/keys/") ||
        /PRIVATE KEY/.test(contentSample)) {
        return {
            sensitivity: "blocked",
            excluded: true,
            exclusionReason: "Private key material is blocked.",
            warnings: ["Private key material must not be archived."]
        };
    }
    if (/(^|\/)\.env($|\.)/.test(path) && !path.endsWith(".env.example")) {
        return {
            sensitivity: "blocked",
            excluded: true,
            exclusionReason: ".env files are blocked.",
            warnings: [".env content is not read or archived."]
        };
    }
    if (path.startsWith("agent-outputs/") ||
        path.includes("invalid-output") ||
        path.includes("raw")) {
        return {
            sensitivity: "sensitive",
            excluded: true,
            exclusionReason: "Raw provider or agent output is excluded by default.",
            warnings: ["Use redacted summaries instead of raw provider output."]
        };
    }
    if (path.endsWith(".log") || path.includes("command-output")) {
        return {
            sensitivity: "sensitive",
            excluded: true,
            exclusionReason: "Unbounded command logs are excluded by default.",
            warnings: ["Use bounded verification summaries instead of raw command logs."]
        };
    }
    if (/(TOKEN|SECRET|PASSWORD|API_KEY|sk-)/i.test(contentSample)) {
        warnings.push("Secret-like content was redacted or excluded from lifecycle summaries.");
        return {
            sensitivity: "sensitive",
            excluded: false,
            exclusionReason: null,
            warnings
        };
    }
    return {
        sensitivity: path.endsWith(".md") || path.endsWith(".json") ? "internal" : "public_metadata",
        excluded: false,
        exclusionReason: null,
        warnings
    };
}
export function recommendedRetention(evidenceClass) {
    if (["release", "provenance", "evidence", "audit", "organization", "run-ledger"].includes(evidenceClass)) {
        return "long";
    }
    if (["patches", "rollback", "verification", "scanner", "handoff"].includes(evidenceClass)) {
        return "standard";
    }
    return "short";
}
//# sourceMappingURL=classifier.js.map