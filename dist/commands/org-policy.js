import { createOrgPolicyBundle, showOrgPolicyBundle, verifyOrgPolicyBundle } from "../org/policy-bundle.js";
export function registerOrgPolicyCommand(program) {
    const command = program.command("org-policy").description("Manage organization policy bundles");
    command
        .command("bundle")
        .option("--sign", "sign policy bundle")
        .option("--confirm <confirm>", "exact confirmation")
        .action(async (options) => {
        console.log(JSON.stringify(await createOrgPolicyBundle(process.cwd(), {
            sign: options.sign,
            confirm: options.confirm
        }), null, 2));
    });
    command
        .command("verify")
        .option("--json", "print JSON")
        .action(async (options) => {
        const result = await verifyOrgPolicyBundle(process.cwd());
        console.log(options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2));
        if (!result.ok)
            process.exitCode = 1;
    });
    command
        .command("show")
        .option("--json", "print JSON")
        .action(async (options) => {
        const result = await showOrgPolicyBundle(process.cwd());
        console.log(options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2));
    });
}
//# sourceMappingURL=org-policy.js.map