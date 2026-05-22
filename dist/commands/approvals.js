import { refreshLedgerAfterOperation } from "../ledger/events.js";
import { addApprovalNote, readApprovalNotes, verifyApprovalNotes } from "../approvals/notes.js";
export function registerApprovalsCommand(program) {
    program
        .command("approvals")
        .argument("<run-id>", "run id")
        .option("--add", "add approval note")
        .option("--type <type>", "approval type")
        .option("--decision <decision>", "decision")
        .option("--reviewer <name>", "reviewer")
        .option("--note <note>", "note")
        .option("--confirm <confirm>", "exact confirmation")
        .option("--verify", "verify approval note hashes")
        .option("--json", "print JSON")
        .description("Manage local approval notes")
        .action(async (runId, options) => {
        if (options.verify) {
            const result = await verifyApprovalNotes(process.cwd(), runId);
            console.log(options.json
                ? JSON.stringify(result, null, 2)
                : `Approvals ${result.ok ? "PASS" : "FAIL"}: ${result.notes.length} note(s)`);
            if (!result.ok)
                process.exitCode = 1;
            return;
        }
        if (options.add) {
            const note = await addApprovalNote(process.cwd(), runId, {
                type: options.type ?? "review",
                decision: options.decision ?? "approved",
                reviewer: options.reviewer ?? "",
                note: options.note ?? "",
                confirm: options.confirm
            });
            await refreshLedgerAfterOperation(process.cwd(), runId);
            console.log(options.json ? JSON.stringify(note, null, 2) : `Added approval note ${note.id}`);
            return;
        }
        const notes = await readApprovalNotes(process.cwd(), runId);
        console.log(options.json
            ? JSON.stringify(notes, null, 2)
            : notes.map((note) => `${note.id}: ${note.decision} by ${note.reviewer}`).join("\n") ||
                "No approval notes recorded.");
    });
}
//# sourceMappingURL=approvals.js.map