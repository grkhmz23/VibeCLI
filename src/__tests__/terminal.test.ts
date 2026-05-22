import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { initConfig } from "../config/config.js";
import { executePhaseOneWorkflow } from "../orchestrator/workflow.js";
import { parseConsoleCommand } from "../terminal/shortcuts.js";
import { createTheme } from "../terminal/theme.js";
import {
  renderAgentStatusBoard,
  renderHeader,
  renderInputFrame,
  renderLogo
} from "../terminal/render.js";
import { executeConsoleCommand, watchRunSnapshots } from "../terminal/console.js";

async function repo(): Promise<string> {
  const cwd = await mkdtemp(join(tmpdir(), "vibecli-terminal-"));
  await initConfig(cwd);
  return cwd;
}

const originalFetch = globalThis.fetch;

describe("terminal rendering", () => {
  it("renderLogo returns VibeCLI branding and not third-party branding", () => {
    const logo = renderLogo(createTheme({ color: false }));
    expect(logo).toContain("VibeCLI");
    for (const name of ["Q" + "wen", "Clau" + "de", "Co" + "dex"]) {
      expect(logo).not.toContain(name);
    }
  });

  it("renderInputFrame includes separators and prompt marker", () => {
    const frame = renderInputFrame(createTheme({ color: false }), 60);
    expect(frame).toContain("─");
    expect(frame).toContain("> Type your request or /help");
    expect(frame).toContain("? shortcuts");
  });

  it("renderInputFrame adapts to narrow terminal width", () => {
    const first = renderInputFrame(createTheme({ color: false }), 20).split("\n")[0] ?? "";
    expect(first.length).toBe(40);
  });

  it("renderHeader includes repo/profile/provider summary", () => {
    const header = renderHeader(
      {
        repoPath: "/repo",
        profile: "company-grade",
        configStatus: "loaded",
        providers: [{ name: "openrouter", status: "missing_env", message: "OPENROUTER_API_KEY" }],
        branch: "main"
      },
      createTheme({ color: false })
    );
    expect(header).toContain("/repo");
    expect(header).toContain("company-grade");
    expect(header).toContain("openrouter");
  });

  it("renderAgentStatusBoard displays all required agents", () => {
    const board = renderAgentStatusBoard(undefined, createTheme({ color: false }));
    for (const agent of [
      "intake",
      "repo_scanner",
      "architect",
      "implementation",
      "test",
      "security",
      "release_manager"
    ]) {
      expect(board).toContain(agent);
    }
  });

  it("NO_COLOR disables ANSI color output", () => {
    process.env.NO_COLOR = "1";
    const output = renderLogo(createTheme());
    delete process.env.NO_COLOR;
    expect(output).not.toContain("\u001b[");
  });
});

describe("console parser", () => {
  it.each([
    ["/help", "help"],
    ["/exit", "exit"],
    ["/quit", "exit"],
    ["/run build auth", "run"],
    ["/run --live build auth", "run"],
    ["/mode dry-run", "mode"],
    ["/mode live", "mode"],
    ["/review run-1 --diff", "review"],
    ['/apply run-1 --confirm "APPLY run-1"', "apply"],
    ['/rollback run-1 --confirm "ROLLBACK run-1"', "rollback"],
    ["Add password reset flow", "plain"]
  ])("parses %s", (input, type) => {
    expect(parseConsoleCommand(input).type).toBe(type);
  });

  it("rejects unknown slash commands with helpful message", () => {
    const parsed = parseConsoleCommand("/wat");
    expect(parsed.type).toBe("unknown");
    if (parsed.type === "unknown") expect(parsed.message).toContain("Unknown command");
  });
});

describe("console safety and watch", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("apply without exact confirmation does not apply", async () => {
    const cwd = await repo();
    const output = await executeConsoleCommand(
      { type: "apply", runId: "run-1" },
      { cwd, mode: "dry-run", stream: false, theme: createTheme({ color: false }) }
    );
    expect(output).toContain("requires exact confirmation");
  });

  it("rollback without exact confirmation does not rollback", async () => {
    const cwd = await repo();
    const output = await executeConsoleCommand(
      { type: "rollback", runId: "run-1" },
      { cwd, mode: "dry-run", stream: false, theme: createTheme({ color: false }) }
    );
    expect(output).toContain("requires exact confirmation");
  });

  it("mode live prints spend warning", async () => {
    const cwd = await repo();
    const output = await executeConsoleCommand(
      { type: "mode", mode: "live" },
      { cwd, mode: "dry-run", stream: false, theme: createTheme({ color: false }) }
    );
    expect(output).toContain("spend provider credits");
  });

  it("models missing env var is non-fatal", async () => {
    const cwd = await repo();
    const output = await executeConsoleCommand(
      { type: "models" },
      { cwd, mode: "dry-run", stream: false, theme: createTheme({ color: false }) }
    );
    expect(output).toContain("OPENROUTER_API_KEY");
  });

  it("plain text prompt in dry-run does not call providers", async () => {
    const cwd = await repo();
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;
    const output = await executeConsoleCommand(
      { type: "plain", prompt: "Build auth" },
      { cwd, mode: "dry-run", stream: false, theme: createTheme({ color: false }) }
    );
    expect(output).toContain("completed");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("status watch reads run state repeatedly using bounded watcher", async () => {
    const cwd = await repo();
    const state = await executePhaseOneWorkflow({
      cwd,
      prompt: "watch",
      profile: "company-grade",
      runId: "run-watch"
    });
    const snapshots = await watchRunSnapshots(
      { cwd, mode: "dry-run", stream: false, theme: createTheme({ color: false }) },
      state.runId,
      { iterations: 2, intervalMs: 1 }
    );
    expect(snapshots).toHaveLength(2);
    expect(snapshots[0]).toContain("run-watch");
  });
});
