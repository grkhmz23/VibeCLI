export const safeReadOnlyCommands = ["git", "node", "npm", "pnpm", "ls", "find"];
export function isSafeReadOnlyCommand(command) {
    return safeReadOnlyCommands.includes(command);
}
//# sourceMappingURL=command-policy.js.map