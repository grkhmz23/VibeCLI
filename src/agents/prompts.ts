import type { AgentRoleId } from "./roles.js";

export const phaseOneRolePrompts: Record<AgentRoleId, string> = {
  intake: "Capture prompt, constraints, and acceptance criteria.",
  repo_scanner: "Summarize repository state using safe read-only context.",
  architect: "Produce a bounded implementation plan.",
  implementation: "Record a dry-run implementation result without source edits.",
  test: "Record deterministic test gate expectations.",
  security: "Evaluate the configured security baseline.",
  release_manager: "Write final run report and readiness notes.",
  fixer: "Propose repair patches for failed gates without applying changes."
};
