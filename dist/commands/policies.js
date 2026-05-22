import { listPolicyProfileNames, loadPolicyProfile } from "../policies/profile-loader.js";
import { validatePolicyProfiles } from "../policies/profile-validator.js";
import { stringifyYaml } from "../config/config.js";
export function registerPoliciesCommand(program) {
    const policies = program.command("policies").description("Manage organization policy profiles");
    policies
        .command("list")
        .description("List policy profiles")
        .action(async () => {
        for (const name of await listPolicyProfileNames(process.cwd()))
            console.log(name);
    });
    policies
        .command("show")
        .argument("<name>", "policy profile name")
        .description("Show a policy profile")
        .action(async (name) => {
        console.log(stringifyYaml(await loadPolicyProfile(process.cwd(), name)));
    });
    policies
        .command("validate")
        .argument("[name]", "policy profile name")
        .description("Validate policy profiles")
        .action(async (name) => {
        const results = await validatePolicyProfiles(process.cwd(), name);
        for (const result of results) {
            console.log(`${result.ok ? "PASS" : "FAIL"} ${result.profile}: ${result.errors.join("; ") || "valid"}`);
        }
        if (results.some((result) => !result.ok))
            process.exitCode = 1;
    });
}
//# sourceMappingURL=policies.js.map