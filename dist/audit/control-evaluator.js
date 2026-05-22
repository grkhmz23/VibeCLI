export function evaluateControl(control, evidenceBySource) {
    const evidence = control.evidenceSources.flatMap((source) => evidenceBySource.get(source) ?? []);
    const missingSources = control.evidenceSources.filter((source) => (evidenceBySource.get(source) ?? []).length === 0);
    const status = evidence.length === 0
        ? control.required
            ? "missing"
            : "unknown"
        : missingSources.length > 0
            ? "partial"
            : "satisfied";
    return {
        id: control.id,
        title: control.title,
        category: control.category,
        severity: control.severity,
        required: control.required,
        status,
        evidence,
        gaps: missingSources.map((source) => `Missing ${source} evidence.`),
        recommendations: missingSources.map((source) => recommendationFor(source))
    };
}
function recommendationFor(source) {
    const map = {
        ledger: "Run vibe ledger <run-id> --verify.",
        "scanner-results": "Run vibe scan <run-id>.",
        "verification-results": 'Run vibe verify <run-id> --confirm "VERIFY <run-id>".',
        "release-readiness": "Run vibe release-readiness <run-id>.",
        provenance: 'Run vibe provenance <run-id> --sign --confirm "SIGN PROVENANCE <run-id>".',
        "organization-approval": "Run vibe org-approvals <run-id> --quorum.",
        retention: "Run vibe retention <run-id>."
    };
    return map[source] ?? `Generate or attach ${source} evidence.`;
}
//# sourceMappingURL=control-evaluator.js.map