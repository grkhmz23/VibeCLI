import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { configPath, initConfig, loadConfig } from "../config/config.js";
import { defaultConfig } from "../config/defaults.js";
import { configSchema } from "../config/schema.js";
import { pathExists } from "../utils/fs.js";

async function tempRepo(): Promise<string> {
  return mkdtemp(join(tmpdir(), "vibecli-config-"));
}

describe("config", () => {
  it("validates the default config", () => {
    expect(configSchema.parse(defaultConfig)).toEqual(defaultConfig);
  });

  it("creates and reads .vibecli/config.yaml", async () => {
    const cwd = await tempRepo();
    await initConfig(cwd);
    expect(pathExists(join(cwd, configPath))).toBe(true);
    const loaded = await loadConfig(cwd);
    expect(loaded.default_profile).toBe("company-grade");
    expect(loaded.providers.openrouter?.type).toBe("openrouter");
  });
});
