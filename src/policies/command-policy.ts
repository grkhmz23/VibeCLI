export const safeReadOnlyCommands = ["git", "node", "npm", "pnpm", "ls", "find"] as const;

export function isSafeReadOnlyCommand(command: string): boolean {
  return safeReadOnlyCommands.includes(command as (typeof safeReadOnlyCommands)[number]);
}
