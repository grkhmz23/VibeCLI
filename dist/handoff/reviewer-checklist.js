const sections = [
    "Product intent",
    "Code correctness",
    "Tests",
    "Security",
    "Auth/authz",
    "CORS and API boundary",
    "JWT/session safety",
    "Database migrations and data integrity",
    "Dependency hygiene",
    "Frontend/backend secret boundary",
    "Observability/logging",
    "Error handling",
    "AI/provider cost and rate-limit behavior",
    "Rollback plan",
    "Manual QA",
    "Final reviewer decision"
];
export function generateReviewerChecklist(summary) {
    return `# VibeCLI Reviewer Checklist

Run id: ${summary.runId}

Policy: ${summary.policy ?? "none"}

${sections
        .map((section) => {
        const blocking = ["Tests", "Security", "Auth/authz", "Rollback plan"].includes(section)
            ? "blocking"
            : section === "Final reviewer decision"
                ? "blocking"
                : "recommended";
        return `## ${section}

Status: ${summary.verificationStatus ?? "unknown"}

Review level: ${blocking}

- [ ] Review run artifacts relevant to ${section}.
- [ ] Record concerns as policy exceptions or approval notes when needed.
`;
    })
        .join("\n")}
`;
}
//# sourceMappingURL=reviewer-checklist.js.map