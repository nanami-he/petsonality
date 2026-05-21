import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { tmpdir } from "os";

const ROOT = dirname(import.meta.dir);

describe("uninstall behavior", () => {
  test("does not remove unrelated statusLine commands containing the substring pet", () => {
    const home = mkdtempSync(join(tmpdir(), "petsonality-uninstall-"));
    const claudeDir = join(home, ".claude");
    mkdirSync(claudeDir, { recursive: true });
    writeFileSync(join(home, ".claude.json"), JSON.stringify({ mcpServers: {} }));
    writeFileSync(join(claudeDir, "settings.json"), JSON.stringify({
      statusLine: {
        type: "command",
        command: "/usr/local/bin/snippet-status",
        padding: 1,
        refreshInterval: 1,
      },
    }, null, 2));

    const result = Bun.spawnSync({
      cmd: ["bun", "cli/uninstall.ts"],
      cwd: ROOT,
      env: { ...process.env, HOME: home },
    });

    expect(result.exitCode).toBe(0);
    const settings = JSON.parse(readFileSync(join(claudeDir, "settings.json"), "utf8"));
    expect(settings.statusLine?.command).toBe("/usr/local/bin/snippet-status");
  });
});
