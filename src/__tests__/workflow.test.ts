import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { workflowAgentRoleIds } from "../agents/roles.js";
import { executePhaseOneWorkflow } from "../orchestrator/workflow.js";

describe("workflow", () => {
  it("runs agents in the correct order", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "vibecli-workflow-"));
    const state = await executePhaseOneWorkflow({
      cwd,
      prompt: "Ship a safe change",
      profile: "company-grade",
      runId: "run-test"
    });
    const started = state.events
      .filter((event) => event.type === "agent_started")
      .map((event) => event.agent);
    expect(started).toEqual([...workflowAgentRoleIds]);
    expect(state.status).toBe("completed");
  });
});
