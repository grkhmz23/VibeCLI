import { scanRepoContext, type RepoContext } from "./repo-scanner.js";

export async function buildRunContext(cwd: string): Promise<RepoContext> {
  return scanRepoContext(cwd);
}
