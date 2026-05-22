import { refreshLedgerAfterOperation } from "../ledger/events.js";
import { readPolicyExceptions, writePolicyExceptions } from "../handoff/policy-exceptions.js";
export function registerExceptionsCommand(program) {
    program
        .command("exceptions")
        .argument("<run-id>", "run id")
        .option("--request <reason>", "request a policy exception")
        .option("--policy <policy>", "policy key")
        .option("--severity <severity>", "severity")
        .option("--mitigation <mitigation>", "mitigation")
        .option("--approve <id>", "approve exception id")
        .option("--reject <id>", "reject exception id")
        .option("--by <name>", "reviewer name")
        .option("--confirm <confirm>", "exact confirmation")
        .option("--json", "print JSON")
        .description("Manage policy exception requests")
        .action(async (runId, options) => {
        const file = await readPolicyExceptions(process.cwd(), runId);
        if (options.request !== undefined) {
            if (!options.request.trim() || !options.mitigation?.trim())
                throw new Error("Exception reason and mitigation are required.");
            const severity = options.severity ?? "medium";
            if (severity === "critical" &&
                options.confirm !== `REQUEST CRITICAL EXCEPTION ${runId}`) {
                throw new Error(`Critical exception requires exact confirmation: REQUEST CRITICAL EXCEPTION ${runId}`);
            }
            file.exceptions.push({
                id: `exception-${Date.now().toString(36)}`,
                policy: options.policy ?? "unspecified",
                severity,
                status: "requested",
                reason: options.request,
                risk: options.request,
                mitigation: options.mitigation,
                requestedBy: options.by ?? null,
                approvedBy: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }
        else if (options.approve || options.reject) {
            const id = options.approve ?? options.reject ?? "";
            const expected = options.approve ? `APPROVE EXCEPTION ${id}` : `REJECT EXCEPTION ${id}`;
            if (options.confirm !== expected)
                throw new Error(`Exception decision requires exact confirmation: ${expected}`);
            const item = file.exceptions.find((exception) => exception.id === id);
            if (!item)
                throw new Error(`Exception ${id} not found`);
            item.status = options.approve ? "approved" : "rejected";
            item.approvedBy = options.by ?? null;
            item.updatedAt = new Date().toISOString();
        }
        else if (file.exceptions.length === 0) {
            file.exceptions.push({
                id: "suggested-review-required",
                policy: "review",
                severity: "low",
                status: "requested",
                reason: "Review run gates for possible policy exceptions.",
                risk: "Unknown until reviewed.",
                mitigation: "Complete review checklist and document exceptions explicitly.",
                requestedBy: null,
                approvedBy: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }
        await writePolicyExceptions(process.cwd(), file);
        await refreshLedgerAfterOperation(process.cwd(), runId);
        console.log(options.json
            ? JSON.stringify(file, null, 2)
            : `${file.exceptions.length} exception(s) recorded.`);
    });
}
//# sourceMappingURL=exceptions.js.map