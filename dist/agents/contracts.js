import { z } from "zod";
import { agentRoleIds } from "./roles.js";
export const patchProposalSchema = z.object({
    path: z.string().min(1),
    operation: z.enum(["create", "modify", "delete"]),
    unified_diff: z.string(),
    rationale: z.string()
});
export const intakeAgentOutputSchema = z.object({
    goal: z.string(),
    repo_type: z.enum(["existing_repo", "new_project", "unknown"]),
    acceptance_criteria: z.array(z.string()),
    blocking_questions: z.array(z.string()),
    assumptions: z.array(z.string()),
    risk_level: z.enum(["low", "medium", "high"])
});
export const repoScannerAgentOutputSchema = z.object({
    summary: z.string(),
    detected_stack: z.array(z.string()),
    package_manager: z.enum(["pnpm", "npm", "yarn", "bun", "unknown"]),
    test_commands: z.array(z.string()),
    build_commands: z.array(z.string()),
    lint_commands: z.array(z.string()),
    important_files: z.array(z.string()),
    risk_notes: z.array(z.string())
});
export const architectAgentOutputSchema = z.object({
    architecture_decision: z.string(),
    files_to_create: z.array(z.string()),
    files_to_modify: z.array(z.string()),
    database_changes: z.array(z.string()),
    api_changes: z.array(z.string()),
    security_requirements: z.array(z.string()),
    test_plan: z.array(z.string()),
    rollback_plan: z.array(z.string())
});
export const implementationAgentOutputSchema = z.object({
    summary: z.string(),
    patches: z.array(patchProposalSchema),
    commands_recommended: z.array(z.string()),
    risks: z.array(z.string())
});
export const testAgentOutputSchema = z.object({
    test_strategy: z.string(),
    commands_recommended: z.array(z.string()),
    expected_failures: z.array(z.string()),
    missing_tests: z.array(z.string()),
    patches: z.array(patchProposalSchema)
});
export const securityAgentOutputSchema = z.object({
    verdict: z.enum(["pass", "fail"]),
    findings: z.array(z.object({
        severity: z.enum(["low", "medium", "high", "critical"]),
        file: z.string(),
        issue: z.string(),
        required_fix: z.string()
    })),
    security_notes: z.array(z.string()),
    blocked_release_reasons: z.array(z.string())
});
export const releaseManagerOutputSchema = z.object({
    verdict: z.enum(["ready", "blocked"]),
    summary: z.string(),
    completed_gates: z.array(z.string()),
    blocked_gates: z.array(z.string()),
    required_next_actions: z.array(z.string()),
    final_user_report: z.string()
});
export const agentOutputSchemas = {
    intake: intakeAgentOutputSchema,
    repo_scanner: repoScannerAgentOutputSchema,
    architect: architectAgentOutputSchema,
    implementation: implementationAgentOutputSchema,
    test: testAgentOutputSchema,
    security: securityAgentOutputSchema,
    release_manager: releaseManagerOutputSchema,
    fixer: implementationAgentOutputSchema
};
export function schemaForAgent(role) {
    if (!agentRoleIds.includes(role)) {
        throw new Error(`Unsupported agent role ${role}`);
    }
    return agentOutputSchemas[role];
}
//# sourceMappingURL=contracts.js.map