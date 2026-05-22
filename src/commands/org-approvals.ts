import type { Command } from "commander";
import { addOrgApproval, getApprovalMatrix, verifyApprovalMatrix } from "../org/approval-matrix.js";

export function registerOrgApprovalsCommand(program: Command): void {
  program
    .command("org-approvals")
    .argument("<run-id>", "run id")
    .option("--add", "add approval")
    .option("--reviewer <reviewer>", "reviewer id")
    .option("--role <role>", "reviewer role")
    .option("--decision <decision>", "approval decision")
    .option("--note <note>", "approval note")
    .option("--external-reviewer", "allow reviewer not in config")
    .option("--confirm <confirm>", "exact confirmation")
    .option("--quorum", "compute quorum")
    .option("--verify", "verify approval matrix")
    .option("--json", "print JSON")
    .action(
      async (
        runId: string,
        options: {
          add?: boolean;
          reviewer?: string;
          role?: string;
          decision?: "approved" | "rejected" | "needs_changes";
          note?: string;
          externalReviewer?: boolean;
          confirm?: string;
          quorum?: boolean;
          verify?: boolean;
          json?: boolean;
        }
      ) => {
        const result = options.verify
          ? await verifyApprovalMatrix(process.cwd(), runId)
          : options.add
            ? await addOrgApproval(process.cwd(), runId, {
                reviewer: options.reviewer ?? "",
                role: options.role ?? "",
                decision: options.decision ?? "approved",
                note: options.note ?? "",
                confirm: options.confirm,
                externalReviewer: options.externalReviewer
              })
            : await getApprovalMatrix(process.cwd(), runId);
        console.log(
          options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2)
        );
      }
    );
}
