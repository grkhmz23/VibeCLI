import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
export function createConsoleReadline() {
    return createInterface({ input, output, terminal: process.stdin.isTTY });
}
//# sourceMappingURL=input.js.map