export const agentRoleIds = [
    "intake",
    "repo_scanner",
    "architect",
    "implementation",
    "test",
    "security",
    "release_manager",
    "fixer"
];
export const workflowAgentRoleIds = agentRoleIds.filter((id) => id !== "fixer");
export const agentRoles = {
    intake: {
        id: "intake",
        displayName: "Intake",
        purpose: "Normalize the user prompt into a delivery request.",
        permissions: {
            canReadRepo: false,
            canWriteSource: false,
            canWriteRunArtifacts: true,
            canRunShell: false,
            shellScope: "none"
        },
        requiredArtifacts: ["intake.json"],
        gateCondition: "Prompt is captured and non-empty."
    },
    repo_scanner: {
        id: "repo_scanner",
        displayName: "Repo Scanner",
        purpose: "Collect repository metadata for planning.",
        permissions: {
            canReadRepo: true,
            canWriteSource: false,
            canWriteRunArtifacts: true,
            canRunShell: true,
            shellScope: "safe-readonly"
        },
        requiredArtifacts: ["repo-scan.json"],
        gateCondition: "Repository context artifact is available."
    },
    architect: {
        id: "architect",
        displayName: "Architect",
        purpose: "Create a delivery plan without modifying source files.",
        permissions: {
            canReadRepo: true,
            canWriteSource: false,
            canWriteRunArtifacts: true,
            canRunShell: false,
            shellScope: "none"
        },
        requiredArtifacts: ["architecture-plan.json"],
        gateCondition: "Plan contains ordered implementation boundaries."
    },
    implementation: {
        id: "implementation",
        displayName: "Implementation",
        purpose: "Reserve the future source-writing implementation lane.",
        permissions: {
            canReadRepo: true,
            canWriteSource: true,
            canWriteRunArtifacts: true,
            canRunShell: true,
            shellScope: "future-implementation"
        },
        requiredArtifacts: ["implementation-dry-run.json"],
        gateCondition: "No source files are modified during Phase 1 dry run."
    },
    test: {
        id: "test",
        displayName: "Test",
        purpose: "Model the test gate for future automated validation.",
        permissions: {
            canReadRepo: true,
            canWriteSource: true,
            canWriteRunArtifacts: true,
            canRunShell: true,
            shellScope: "test"
        },
        requiredArtifacts: ["test-gate.json"],
        gateCondition: "Deterministic Phase 1 test gate passes."
    },
    security: {
        id: "security",
        displayName: "Security",
        purpose: "Apply the baseline security policy to the run plan.",
        permissions: {
            canReadRepo: true,
            canWriteSource: false,
            canWriteRunArtifacts: true,
            canRunShell: true,
            shellScope: "scanner"
        },
        requiredArtifacts: ["security-review.json"],
        gateCondition: "All baseline security checks are acknowledged."
    },
    release_manager: {
        id: "release_manager",
        displayName: "Release Manager",
        purpose: "Summarize delivery status and release readiness.",
        permissions: {
            canReadRepo: true,
            canWriteSource: false,
            canWriteRunArtifacts: true,
            canRunShell: true,
            shellScope: "git-release"
        },
        requiredArtifacts: ["release-summary.json"],
        gateCondition: "Final report and gate summary are written."
    },
    fixer: {
        id: "fixer",
        displayName: "Fixer Agent",
        purpose: "Propose repair patches after failed verification or scanner gates.",
        permissions: {
            canReadRepo: true,
            canWriteSource: false,
            canWriteRunArtifacts: true,
            canRunShell: false,
            shellScope: "none"
        },
        requiredArtifacts: ["fixer-output.json"],
        gateCondition: "Repair proposal is stored as patch artifacts only."
    }
};
//# sourceMappingURL=roles.js.map