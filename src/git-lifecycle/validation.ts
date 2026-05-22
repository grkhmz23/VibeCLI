export function validateBranchName(name: string): string {
  if (!name.trim()) throw new Error("Branch name cannot be empty");
  if (name.startsWith(".") || name.startsWith("/") || name.endsWith("/") || name.includes("..")) {
    throw new Error(`Unsafe branch name: ${name}`);
  }
  if (name.includes("//") || /\s/.test(name) || /[~^:?*[\\]/.test(name)) {
    throw new Error(`Unsafe branch name: ${name}`);
  }
  if (name.length > 80) throw new Error("Branch name must be 80 characters or fewer");
  return name;
}

export function validateBranchPrefix(prefix: string): string {
  if (prefix.includes("/")) throw new Error("branch_prefix must be a single safe path segment");
  return validateBranchName(prefix);
}
