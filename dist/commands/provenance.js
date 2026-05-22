import { exportPublicKey, initProvenanceKey, keyStatus } from "../provenance/keyring.js";
import { generateProvenanceStatement } from "../provenance/statement.js";
import { signProvenance } from "../provenance/envelope.js";
import { verifyProvenance } from "../provenance/verify.js";
export function registerProvenanceCommand(program) {
    const provenance = program.command("provenance").description("Manage release provenance");
    const key = provenance.command("key").description("Manage local provenance signing key");
    key
        .command("status")
        .option("--json", "print JSON")
        .action(async (rawOptions, command) => {
        const options = actionOptions(rawOptions, command);
        const status = await keyStatus(process.cwd());
        console.log(options.json ? JSON.stringify(status, null, 2) : renderKeyStatus(status));
    });
    key
        .command("init")
        .option("--confirm <confirm>", "exact confirmation")
        .option("--rotate", "rotate existing key")
        .action(async (rawOptions, command) => {
        const options = actionOptions(rawOptions, command);
        const metadata = await initProvenanceKey(process.cwd(), {
            confirm: options.confirm,
            rotate: options.rotate
        });
        console.log(JSON.stringify({ ...metadata, privateKeyPath: "[REDACTED]" }, null, 2));
    });
    key
        .command("export-public")
        .option("--json", "print JSON")
        .action(async (rawOptions, command) => {
        const options = actionOptions(rawOptions, command);
        const exported = await exportPublicKey(process.cwd());
        console.log(options.json
            ? JSON.stringify(exported, null, 2)
            : `${exported.pem}\nFingerprint: ${exported.fingerprint}`);
    });
    provenance
        .allowUnknownOption()
        .argument("<run-id>", "run id")
        .option("--sign", "sign provenance")
        .option("--verify", "verify provenance")
        .option("--json", "print JSON")
        .option("--refresh", "refresh statement")
        .action(async (runId, options, command) => {
        const confirm = readUnknownOption(command.args, "--confirm");
        const result = options.verify
            ? await verifyProvenance(process.cwd(), runId)
            : options.sign
                ? await signProvenance(process.cwd(), runId, { confirm })
                : await generateProvenanceStatement(process.cwd(), runId);
        console.log(options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2));
        if (options.verify && "ok" in result && !result.ok)
            process.exitCode = 1;
        void options.refresh;
    });
}
function actionOptions(options, command) {
    return Object.keys(options).length ? options : command.opts();
}
function readUnknownOption(args, flag) {
    const index = args.indexOf(flag);
    return index >= 0 ? args[index + 1] : undefined;
}
function renderKeyStatus(status) {
    return [
        `Key status: ${status.status}`,
        `Public key fingerprint: ${status.publicKeyFingerprint ?? "none"}`,
        "Private key: [REDACTED]"
    ].join("\n");
}
//# sourceMappingURL=provenance.js.map