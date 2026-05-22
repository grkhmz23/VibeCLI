import { z } from "zod";
import { type AgentRoleId } from "./roles.js";
export declare const patchProposalSchema: z.ZodObject<{
    path: z.ZodString;
    operation: z.ZodEnum<["create", "modify", "delete"]>;
    unified_diff: z.ZodString;
    rationale: z.ZodString;
}, "strip", z.ZodTypeAny, {
    path: string;
    operation: "create" | "modify" | "delete";
    unified_diff: string;
    rationale: string;
}, {
    path: string;
    operation: "create" | "modify" | "delete";
    unified_diff: string;
    rationale: string;
}>;
export declare const intakeAgentOutputSchema: z.ZodObject<{
    goal: z.ZodString;
    repo_type: z.ZodEnum<["existing_repo", "new_project", "unknown"]>;
    acceptance_criteria: z.ZodArray<z.ZodString, "many">;
    blocking_questions: z.ZodArray<z.ZodString, "many">;
    assumptions: z.ZodArray<z.ZodString, "many">;
    risk_level: z.ZodEnum<["low", "medium", "high"]>;
}, "strip", z.ZodTypeAny, {
    goal: string;
    repo_type: "unknown" | "existing_repo" | "new_project";
    acceptance_criteria: string[];
    blocking_questions: string[];
    assumptions: string[];
    risk_level: "low" | "medium" | "high";
}, {
    goal: string;
    repo_type: "unknown" | "existing_repo" | "new_project";
    acceptance_criteria: string[];
    blocking_questions: string[];
    assumptions: string[];
    risk_level: "low" | "medium" | "high";
}>;
export declare const repoScannerAgentOutputSchema: z.ZodObject<{
    summary: z.ZodString;
    detected_stack: z.ZodArray<z.ZodString, "many">;
    package_manager: z.ZodEnum<["pnpm", "npm", "yarn", "bun", "unknown"]>;
    test_commands: z.ZodArray<z.ZodString, "many">;
    build_commands: z.ZodArray<z.ZodString, "many">;
    lint_commands: z.ZodArray<z.ZodString, "many">;
    important_files: z.ZodArray<z.ZodString, "many">;
    risk_notes: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    summary: string;
    detected_stack: string[];
    package_manager: "unknown" | "pnpm" | "npm" | "yarn" | "bun";
    test_commands: string[];
    build_commands: string[];
    lint_commands: string[];
    important_files: string[];
    risk_notes: string[];
}, {
    summary: string;
    detected_stack: string[];
    package_manager: "unknown" | "pnpm" | "npm" | "yarn" | "bun";
    test_commands: string[];
    build_commands: string[];
    lint_commands: string[];
    important_files: string[];
    risk_notes: string[];
}>;
export declare const architectAgentOutputSchema: z.ZodObject<{
    architecture_decision: z.ZodString;
    files_to_create: z.ZodArray<z.ZodString, "many">;
    files_to_modify: z.ZodArray<z.ZodString, "many">;
    database_changes: z.ZodArray<z.ZodString, "many">;
    api_changes: z.ZodArray<z.ZodString, "many">;
    security_requirements: z.ZodArray<z.ZodString, "many">;
    test_plan: z.ZodArray<z.ZodString, "many">;
    rollback_plan: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    architecture_decision: string;
    files_to_create: string[];
    files_to_modify: string[];
    database_changes: string[];
    api_changes: string[];
    security_requirements: string[];
    test_plan: string[];
    rollback_plan: string[];
}, {
    architecture_decision: string;
    files_to_create: string[];
    files_to_modify: string[];
    database_changes: string[];
    api_changes: string[];
    security_requirements: string[];
    test_plan: string[];
    rollback_plan: string[];
}>;
export declare const implementationAgentOutputSchema: z.ZodObject<{
    summary: z.ZodString;
    patches: z.ZodArray<z.ZodObject<{
        path: z.ZodString;
        operation: z.ZodEnum<["create", "modify", "delete"]>;
        unified_diff: z.ZodString;
        rationale: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        path: string;
        operation: "create" | "modify" | "delete";
        unified_diff: string;
        rationale: string;
    }, {
        path: string;
        operation: "create" | "modify" | "delete";
        unified_diff: string;
        rationale: string;
    }>, "many">;
    commands_recommended: z.ZodArray<z.ZodString, "many">;
    risks: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    patches: {
        path: string;
        operation: "create" | "modify" | "delete";
        unified_diff: string;
        rationale: string;
    }[];
    summary: string;
    commands_recommended: string[];
    risks: string[];
}, {
    patches: {
        path: string;
        operation: "create" | "modify" | "delete";
        unified_diff: string;
        rationale: string;
    }[];
    summary: string;
    commands_recommended: string[];
    risks: string[];
}>;
export declare const testAgentOutputSchema: z.ZodObject<{
    test_strategy: z.ZodString;
    commands_recommended: z.ZodArray<z.ZodString, "many">;
    expected_failures: z.ZodArray<z.ZodString, "many">;
    missing_tests: z.ZodArray<z.ZodString, "many">;
    patches: z.ZodArray<z.ZodObject<{
        path: z.ZodString;
        operation: z.ZodEnum<["create", "modify", "delete"]>;
        unified_diff: z.ZodString;
        rationale: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        path: string;
        operation: "create" | "modify" | "delete";
        unified_diff: string;
        rationale: string;
    }, {
        path: string;
        operation: "create" | "modify" | "delete";
        unified_diff: string;
        rationale: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    patches: {
        path: string;
        operation: "create" | "modify" | "delete";
        unified_diff: string;
        rationale: string;
    }[];
    commands_recommended: string[];
    test_strategy: string;
    expected_failures: string[];
    missing_tests: string[];
}, {
    patches: {
        path: string;
        operation: "create" | "modify" | "delete";
        unified_diff: string;
        rationale: string;
    }[];
    commands_recommended: string[];
    test_strategy: string;
    expected_failures: string[];
    missing_tests: string[];
}>;
export declare const securityAgentOutputSchema: z.ZodObject<{
    verdict: z.ZodEnum<["pass", "fail"]>;
    findings: z.ZodArray<z.ZodObject<{
        severity: z.ZodEnum<["low", "medium", "high", "critical"]>;
        file: z.ZodString;
        issue: z.ZodString;
        required_fix: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        file: string;
        severity: "low" | "medium" | "high" | "critical";
        issue: string;
        required_fix: string;
    }, {
        file: string;
        severity: "low" | "medium" | "high" | "critical";
        issue: string;
        required_fix: string;
    }>, "many">;
    security_notes: z.ZodArray<z.ZodString, "many">;
    blocked_release_reasons: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    findings: {
        file: string;
        severity: "low" | "medium" | "high" | "critical";
        issue: string;
        required_fix: string;
    }[];
    verdict: "pass" | "fail";
    security_notes: string[];
    blocked_release_reasons: string[];
}, {
    findings: {
        file: string;
        severity: "low" | "medium" | "high" | "critical";
        issue: string;
        required_fix: string;
    }[];
    verdict: "pass" | "fail";
    security_notes: string[];
    blocked_release_reasons: string[];
}>;
export declare const releaseManagerOutputSchema: z.ZodObject<{
    verdict: z.ZodEnum<["ready", "blocked"]>;
    summary: z.ZodString;
    completed_gates: z.ZodArray<z.ZodString, "many">;
    blocked_gates: z.ZodArray<z.ZodString, "many">;
    required_next_actions: z.ZodArray<z.ZodString, "many">;
    final_user_report: z.ZodString;
}, "strip", z.ZodTypeAny, {
    summary: string;
    verdict: "blocked" | "ready";
    completed_gates: string[];
    blocked_gates: string[];
    required_next_actions: string[];
    final_user_report: string;
}, {
    summary: string;
    verdict: "blocked" | "ready";
    completed_gates: string[];
    blocked_gates: string[];
    required_next_actions: string[];
    final_user_report: string;
}>;
export declare const agentOutputSchemas: {
    intake: z.ZodObject<{
        goal: z.ZodString;
        repo_type: z.ZodEnum<["existing_repo", "new_project", "unknown"]>;
        acceptance_criteria: z.ZodArray<z.ZodString, "many">;
        blocking_questions: z.ZodArray<z.ZodString, "many">;
        assumptions: z.ZodArray<z.ZodString, "many">;
        risk_level: z.ZodEnum<["low", "medium", "high"]>;
    }, "strip", z.ZodTypeAny, {
        goal: string;
        repo_type: "unknown" | "existing_repo" | "new_project";
        acceptance_criteria: string[];
        blocking_questions: string[];
        assumptions: string[];
        risk_level: "low" | "medium" | "high";
    }, {
        goal: string;
        repo_type: "unknown" | "existing_repo" | "new_project";
        acceptance_criteria: string[];
        blocking_questions: string[];
        assumptions: string[];
        risk_level: "low" | "medium" | "high";
    }>;
    repo_scanner: z.ZodObject<{
        summary: z.ZodString;
        detected_stack: z.ZodArray<z.ZodString, "many">;
        package_manager: z.ZodEnum<["pnpm", "npm", "yarn", "bun", "unknown"]>;
        test_commands: z.ZodArray<z.ZodString, "many">;
        build_commands: z.ZodArray<z.ZodString, "many">;
        lint_commands: z.ZodArray<z.ZodString, "many">;
        important_files: z.ZodArray<z.ZodString, "many">;
        risk_notes: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        summary: string;
        detected_stack: string[];
        package_manager: "unknown" | "pnpm" | "npm" | "yarn" | "bun";
        test_commands: string[];
        build_commands: string[];
        lint_commands: string[];
        important_files: string[];
        risk_notes: string[];
    }, {
        summary: string;
        detected_stack: string[];
        package_manager: "unknown" | "pnpm" | "npm" | "yarn" | "bun";
        test_commands: string[];
        build_commands: string[];
        lint_commands: string[];
        important_files: string[];
        risk_notes: string[];
    }>;
    architect: z.ZodObject<{
        architecture_decision: z.ZodString;
        files_to_create: z.ZodArray<z.ZodString, "many">;
        files_to_modify: z.ZodArray<z.ZodString, "many">;
        database_changes: z.ZodArray<z.ZodString, "many">;
        api_changes: z.ZodArray<z.ZodString, "many">;
        security_requirements: z.ZodArray<z.ZodString, "many">;
        test_plan: z.ZodArray<z.ZodString, "many">;
        rollback_plan: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        architecture_decision: string;
        files_to_create: string[];
        files_to_modify: string[];
        database_changes: string[];
        api_changes: string[];
        security_requirements: string[];
        test_plan: string[];
        rollback_plan: string[];
    }, {
        architecture_decision: string;
        files_to_create: string[];
        files_to_modify: string[];
        database_changes: string[];
        api_changes: string[];
        security_requirements: string[];
        test_plan: string[];
        rollback_plan: string[];
    }>;
    implementation: z.ZodObject<{
        summary: z.ZodString;
        patches: z.ZodArray<z.ZodObject<{
            path: z.ZodString;
            operation: z.ZodEnum<["create", "modify", "delete"]>;
            unified_diff: z.ZodString;
            rationale: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            path: string;
            operation: "create" | "modify" | "delete";
            unified_diff: string;
            rationale: string;
        }, {
            path: string;
            operation: "create" | "modify" | "delete";
            unified_diff: string;
            rationale: string;
        }>, "many">;
        commands_recommended: z.ZodArray<z.ZodString, "many">;
        risks: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        patches: {
            path: string;
            operation: "create" | "modify" | "delete";
            unified_diff: string;
            rationale: string;
        }[];
        summary: string;
        commands_recommended: string[];
        risks: string[];
    }, {
        patches: {
            path: string;
            operation: "create" | "modify" | "delete";
            unified_diff: string;
            rationale: string;
        }[];
        summary: string;
        commands_recommended: string[];
        risks: string[];
    }>;
    test: z.ZodObject<{
        test_strategy: z.ZodString;
        commands_recommended: z.ZodArray<z.ZodString, "many">;
        expected_failures: z.ZodArray<z.ZodString, "many">;
        missing_tests: z.ZodArray<z.ZodString, "many">;
        patches: z.ZodArray<z.ZodObject<{
            path: z.ZodString;
            operation: z.ZodEnum<["create", "modify", "delete"]>;
            unified_diff: z.ZodString;
            rationale: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            path: string;
            operation: "create" | "modify" | "delete";
            unified_diff: string;
            rationale: string;
        }, {
            path: string;
            operation: "create" | "modify" | "delete";
            unified_diff: string;
            rationale: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        patches: {
            path: string;
            operation: "create" | "modify" | "delete";
            unified_diff: string;
            rationale: string;
        }[];
        commands_recommended: string[];
        test_strategy: string;
        expected_failures: string[];
        missing_tests: string[];
    }, {
        patches: {
            path: string;
            operation: "create" | "modify" | "delete";
            unified_diff: string;
            rationale: string;
        }[];
        commands_recommended: string[];
        test_strategy: string;
        expected_failures: string[];
        missing_tests: string[];
    }>;
    security: z.ZodObject<{
        verdict: z.ZodEnum<["pass", "fail"]>;
        findings: z.ZodArray<z.ZodObject<{
            severity: z.ZodEnum<["low", "medium", "high", "critical"]>;
            file: z.ZodString;
            issue: z.ZodString;
            required_fix: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            file: string;
            severity: "low" | "medium" | "high" | "critical";
            issue: string;
            required_fix: string;
        }, {
            file: string;
            severity: "low" | "medium" | "high" | "critical";
            issue: string;
            required_fix: string;
        }>, "many">;
        security_notes: z.ZodArray<z.ZodString, "many">;
        blocked_release_reasons: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        findings: {
            file: string;
            severity: "low" | "medium" | "high" | "critical";
            issue: string;
            required_fix: string;
        }[];
        verdict: "pass" | "fail";
        security_notes: string[];
        blocked_release_reasons: string[];
    }, {
        findings: {
            file: string;
            severity: "low" | "medium" | "high" | "critical";
            issue: string;
            required_fix: string;
        }[];
        verdict: "pass" | "fail";
        security_notes: string[];
        blocked_release_reasons: string[];
    }>;
    release_manager: z.ZodObject<{
        verdict: z.ZodEnum<["ready", "blocked"]>;
        summary: z.ZodString;
        completed_gates: z.ZodArray<z.ZodString, "many">;
        blocked_gates: z.ZodArray<z.ZodString, "many">;
        required_next_actions: z.ZodArray<z.ZodString, "many">;
        final_user_report: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        summary: string;
        verdict: "blocked" | "ready";
        completed_gates: string[];
        blocked_gates: string[];
        required_next_actions: string[];
        final_user_report: string;
    }, {
        summary: string;
        verdict: "blocked" | "ready";
        completed_gates: string[];
        blocked_gates: string[];
        required_next_actions: string[];
        final_user_report: string;
    }>;
    fixer: z.ZodObject<{
        summary: z.ZodString;
        patches: z.ZodArray<z.ZodObject<{
            path: z.ZodString;
            operation: z.ZodEnum<["create", "modify", "delete"]>;
            unified_diff: z.ZodString;
            rationale: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            path: string;
            operation: "create" | "modify" | "delete";
            unified_diff: string;
            rationale: string;
        }, {
            path: string;
            operation: "create" | "modify" | "delete";
            unified_diff: string;
            rationale: string;
        }>, "many">;
        commands_recommended: z.ZodArray<z.ZodString, "many">;
        risks: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        patches: {
            path: string;
            operation: "create" | "modify" | "delete";
            unified_diff: string;
            rationale: string;
        }[];
        summary: string;
        commands_recommended: string[];
        risks: string[];
    }, {
        patches: {
            path: string;
            operation: "create" | "modify" | "delete";
            unified_diff: string;
            rationale: string;
        }[];
        summary: string;
        commands_recommended: string[];
        risks: string[];
    }>;
};
export type PatchProposal = z.infer<typeof patchProposalSchema>;
export type IntakeAgentOutput = z.infer<typeof intakeAgentOutputSchema>;
export type RepoScannerAgentOutput = z.infer<typeof repoScannerAgentOutputSchema>;
export type ArchitectAgentOutput = z.infer<typeof architectAgentOutputSchema>;
export type ImplementationAgentOutput = z.infer<typeof implementationAgentOutputSchema>;
export type TestAgentOutput = z.infer<typeof testAgentOutputSchema>;
export type SecurityAgentOutput = z.infer<typeof securityAgentOutputSchema>;
export type ReleaseManagerOutput = z.infer<typeof releaseManagerOutputSchema>;
export type AgentOutput = z.infer<(typeof agentOutputSchemas)[AgentRoleId]>;
export declare function schemaForAgent(role: AgentRoleId): z.ZodType;
