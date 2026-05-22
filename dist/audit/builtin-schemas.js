const disclaimer = "This is an evidence mapping template, not a compliance certification.";
const categoryDetails = [
    {
        category: "security",
        id: "SEC-BASELINE-001",
        title: "Security baseline evidence is present",
        severity: "critical",
        sources: ["security-policy", "scanner-results", "release-packet"]
    },
    {
        category: "authentication",
        id: "AUTHN-REVIEW-001",
        title: "Authentication changes have review evidence",
        severity: "high",
        sources: ["handoff", "deployment-readiness"]
    },
    {
        category: "authorization",
        id: "AUTHZ-REVIEW-001",
        title: "Authorization boundaries have review evidence",
        severity: "high",
        sources: ["handoff", "deployment-readiness"]
    },
    {
        category: "secrets",
        id: "SEC-SECRETS-001",
        title: "Secrets are not stored in source or artifacts",
        severity: "critical",
        sources: ["ledger", "scanner-results", "security-policy", "handoff", "release-packet"]
    },
    {
        category: "api-boundary",
        id: "API-BOUNDARY-001",
        title: "API boundary review is documented",
        severity: "high",
        sources: ["handoff", "deployment-readiness"]
    },
    {
        category: "cors",
        id: "CORS-REVIEW-001",
        title: "CORS impact is reviewed when APIs change",
        severity: "medium",
        sources: ["deployment-readiness", "handoff"]
    },
    {
        category: "jwt-session",
        id: "SESSION-REVIEW-001",
        title: "JWT or session impact is reviewed",
        severity: "high",
        sources: ["deployment-readiness", "handoff"]
    },
    {
        category: "database-migrations",
        id: "DB-MIGRATIONS-001",
        title: "Database migration notes are present when needed",
        severity: "medium",
        sources: ["deployment-readiness", "handoff"]
    },
    {
        category: "dependency-hygiene",
        id: "DEPS-HYGIENE-001",
        title: "Dependency and scanner evidence is available",
        severity: "high",
        sources: ["scanner-results", "external-scanner-results"]
    },
    {
        category: "testing",
        id: "TESTING-VERIFY-001",
        title: "Verification results are documented",
        severity: "critical",
        sources: ["verification-results"]
    },
    {
        category: "ci-cd",
        id: "CI-STATUS-001",
        title: "CI status is captured",
        severity: "high",
        sources: ["ci-status"]
    },
    {
        category: "observability",
        id: "OBSERVABILITY-001",
        title: "Production path observability notes are present",
        severity: "medium",
        sources: ["deployment-readiness", "handoff"]
    },
    {
        category: "error-handling",
        id: "ERROR-HANDLING-001",
        title: "Error handling impact is documented",
        severity: "medium",
        sources: ["handoff", "release-packet"]
    },
    {
        category: "ai-provider-safety",
        id: "AI-PROVIDER-SAFETY-001",
        title: "AI provider safety and cost notes are documented",
        severity: "medium",
        sources: ["deployment-readiness", "release-packet"]
    },
    {
        category: "cost-rate-limits",
        id: "COST-RATE-LIMITS-001",
        title: "Cost and rate-limit evidence exists where relevant",
        severity: "medium",
        sources: ["deployment-readiness", "handoff"]
    },
    {
        category: "release-governance",
        id: "RELEASE-GOV-001",
        title: "Release governance packet and readiness exist",
        severity: "critical",
        sources: ["release-packet", "release-readiness"]
    },
    {
        category: "provenance",
        id: "PROVENANCE-001",
        title: "Local provenance evidence is available",
        severity: "high",
        sources: ["provenance"]
    },
    {
        category: "auditability",
        id: "AUDITABILITY-001",
        title: "Ledger and audit records are verifiable",
        severity: "critical",
        sources: ["ledger", "organization-audit"]
    },
    {
        category: "rollback",
        id: "ROLLBACK-001",
        title: "Rollback evidence is documented",
        severity: "high",
        sources: ["release-packet", "handoff"]
    },
    {
        category: "organization-approval",
        id: "ORG-APPROVAL-001",
        title: "Organization approval matrix is available when required",
        severity: "high",
        sources: ["organization-approval"]
    },
    {
        category: "remote-attestation",
        id: "REMOTE-ATTESTATION-001",
        title: "Remote attestation export evidence is available when used",
        severity: "medium",
        sources: ["remote-attestation", "transparency"]
    },
    {
        category: "retention",
        id: "RETENTION-001",
        title: "Evidence retention plan is documented",
        severity: "medium",
        sources: ["retention"]
    }
];
export function builtinAuditSchemas() {
    return [
        makeSchema("internal-secure-release", "Internal Secure Release Evidence Mapping", "Read-only evidence mapping for release governance."),
        makeSchema("startup-production-readiness", "Startup Production Readiness Mapping", "Read-only release evidence mapping for small teams preparing production releases."),
        makeSchema("soc2-security-mapping", "SOC 2 Security Control Mapping Support", "Read-only evidence mapping that can support security control discussions."),
        makeSchema("iso27001-secure-sdlc-mapping", "ISO 27001 Secure SDLC Mapping Support", "Read-only evidence mapping that can support secure SDLC control discussions."),
        makeSchema("ai-appsec-readiness", "AI Application Security Readiness Mapping", "Read-only evidence mapping focused on AI provider safety and application security."),
        makeSchema("crypto-fintech-release-readiness", "Crypto Fintech Release Readiness Mapping", "Read-only evidence mapping for sensitive financial application release workflows.")
    ];
}
export function builtinAuditSchema(name) {
    return builtinAuditSchemas().find((schema) => schema.name === name);
}
function makeSchema(name, title, description) {
    return {
        version: 1,
        name,
        title,
        description,
        disclaimer,
        controls: categoryDetails.map((detail) => ({
            id: detail.id,
            title: detail.title,
            category: detail.category,
            severity: detail.severity,
            required: true,
            evidenceSources: detail.sources,
            checks: [
                {
                    id: `${detail.id.toLowerCase()}-evidence`,
                    description: "Required evidence is present, redacted, and tied to local VibeCLI artifacts.",
                    artifactHints: detail.sources.map((source) => `.vibecli/runs/<run-id>/${source}`)
                }
            ]
        }))
    };
}
//# sourceMappingURL=builtin-schemas.js.map