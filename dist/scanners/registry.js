import { envExampleScanner, packageScriptScanner, protectedFileTouchScanner, secretPatternScanner, testPresenceScanner } from "./builtin.js";
export const builtinScanners = [
    protectedFileTouchScanner,
    secretPatternScanner,
    envExampleScanner,
    packageScriptScanner,
    testPresenceScanner
];
export async function runBuiltinScanners(context) {
    const results = [];
    for (const scanner of builtinScanners) {
        results.push(await scanner(context));
    }
    return results;
}
//# sourceMappingURL=registry.js.map