import { mkdtemp, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { configPath, initConfig } from "../config/config.js";
import { executePhaseOneWorkflow } from "../orchestrator/workflow.js";
import { parseConsoleCommand } from "../terminal/shortcuts.js";
import { createTheme } from "../terminal/theme.js";
import {
  renderAgentStatusBoard,
  renderHeader,
  renderInputFrame,
  renderLogo
} from "../terminal/render.js";
import {
  executeConsoleCommand,
  isConsoleAbortError,
  runConsole,
  watchRunSnapshots
} from "../terminal/console.js";
import { pathExists } from "../utils/fs.js";

async function repo(): Promise<string> {
  const cwd = await mkdtemp(join(tmpdir(), "vibecli-terminal-"));
  await initConfig(cwd);
  return cwd;
}

async function noConfigRepo(): Promise<string> {
  return mkdtemp(join(tmpdir(), "vibecli-terminal-no-config-"));
}

async function runCount(cwd: string): Promise<number> {
  const runsPath = join(cwd, ".vibecli", "runs");
  return pathExists(runsPath) ? (await readdir(runsPath)).length : 0;
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
    ["/init", "init"],
    ["vibe init", "cli-command-inside-console"],
    ["vibe console", "cli-command-inside-console"],
    ['vibe run "x"', "cli-command-inside-console"],
    ["vibe status", "cli-command-inside-console"],
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

  it("no-config console startup renders first-run state without throwing", async () => {
    const cwd = await noConfigRepo();
    const logs: string[] = [];
    const logSpy = vi.spyOn(console, "log").mockImplementation((value?: unknown) => {
      logs.push(String(value));
    });
    await runConsole(cwd, { inputLines: ["/help", "/exit"] });
    logSpy.mockRestore();
    const output = logs.join("\n");
    expect(output).toContain("Config: not initialized");
    expect(output).toContain("This directory is not initialized for VibeCLI.");
    expect(output).toContain("/init");
  });

  it("/init creates config from no-config console mode", async () => {
    const cwd = await noConfigRepo();
    const output = await executeConsoleCommand(
      { type: "init" },
      { cwd, mode: "dry-run", stream: false, theme: createTheme({ color: false }) }
    );
    expect(output).toContain("Initialized VibeCLI");
    expect(pathExists(join(cwd, configPath))).toBe(true);
  });

  it("safe console commands work before init and config-required commands are blocked", async () => {
    const cwd = await noConfigRepo();
    const context = {
      cwd,
      mode: "dry-run" as const,
      stream: false,
      theme: createTheme({ color: false })
    };
    await expect(executeConsoleCommand({ type: "help" }, context)).resolves.toContain(
      "Console commands"
    );
    await expect(executeConsoleCommand({ type: "doctor" }, context)).resolves.toContain(
      "not initialized"
    );
    await expect(
      executeConsoleCommand({ type: "plain", prompt: "Build auth" }, context)
    ).resolves.toBe("Initialize this directory first: /init");
    await expect(executeConsoleCommand({ type: "status" }, context)).resolves.toContain(
      "requires VibeCLI initialization"
    );
    expect(await runCount(cwd)).toBe(0);
  });

  it("CLI-looking input inside console returns guidance and does not create runs", async () => {
    const cwd = await repo();
    const context = {
      cwd,
      mode: "dry-run" as const,
      stream: false,
      theme: createTheme({ color: false })
    };
    await expect(
      executeConsoleCommand(parseConsoleCommand("vibe init"), context)
    ).resolves.toContain("Use `/init`");
    await expect(
      executeConsoleCommand(parseConsoleCommand("vibe console"), context)
    ).resolves.toContain("already inside");
    await expect(
      executeConsoleCommand(parseConsoleCommand("vibe run test"), context)
    ).resolves.toContain("use /run test");
    await expect(
      executeConsoleCommand(parseConsoleCommand("vibe status"), context)
    ).resolves.toContain("use `/status`");
    expect(await runCount(cwd)).toBe(0);
  });

  it("detects readline Ctrl+C aborts for clean console exit handling", () => {
    const error = Object.assign(new Error("Aborted with Ctrl+C"), {
      name: "AbortError",
      code: "ABORT_ERR"
    });
    expect(isConsoleAbortError(error)).toBe(true);
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
