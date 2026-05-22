import { addDisposalApproval, getDisposalApprovals, verifyDisposalApprovals } from "../evidence-disposal/approval.js";
export function registerDisposalApprovalsCommand(program) {
    program
        .command("disposal-approvals")
        .argument("<run-id>", "run id")
        .description("Manage local multi-reviewer disposal approvals")
        .option("--add", "add approval")
        .option("--reviewer <id>", "reviewer id")
        .option("--role <role>", "reviewer role")
        .option("--decision <decision>", "approved, rejected, or needs_changes")
        .option("--note <note>", "approval note")
        .option("--external-reviewer", "allow reviewer outside local org config")
        .option("--quorum", "show quorum")
        .option("--verify", "verify approval artifact hashes")
        .option("--confirm <confirm>", "exact confirmation")
        .option("--json", "print JSON")
        .action(async (runId, options) => {
        if (options.add) {
            const result = await addDisposalApproval(process.cwd(), runId, options);
            console.log(options.json
                ? JSON.stringify(result, null, 2)
                : `Disposal approval recorded; quorum ${result.quorum.status}`);
            return;
        }
        if (options.verify) {
            const result = await verifyDisposalApprovals(process.cwd(), runId);
            console.log(options.json
                ? JSON.stringify(result, null, 2)
                : `Disposal approvals ${result.ok ? "PASS" : "FAIL"}: ${result.message}`);
            if (!result.ok)
                process.exitCode = 1;
            return;
        }
        const result = await getDisposalApprovals(process.cwd(), runId);
        console.log(options.json
            ? JSON.stringify(result, null, 2)
            : `Disposal approvals: quorum ${result.quorum.status}, approved ${result.quorum.approvedCount}`);
    });
}
//# sourceMappingURL=disposal-approvals.js.map