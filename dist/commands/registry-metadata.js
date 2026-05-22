import { generateRegistryMetadata } from "../remote-attestation/registry-metadata.js";
export function registerRegistryMetadataCommand(program) {
    program
        .command("registry-metadata")
        .argument("<run-id>", "run id")
        .option("--image <name>", "image name")
        .option("--tag <tag>", "image tag")
        .option("--json", "print JSON")
        .description("Generate registry metadata without pushing artifacts")
        .action(async (runId, options) => {
        const result = await generateRegistryMetadata(process.cwd(), runId, options);
        console.log(options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2));
    });
}
//# sourceMappingURL=registry-metadata.js.map