import { describe, test, expect } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

describe("Claude plugin manifest", () => {
  test("uses the bundled Node server instead of Bun source execution", () => {
    const manifest = JSON.parse(
      readFileSync(join(import.meta.dir, "..", ".claude-plugin", "plugin.json"), "utf8"),
    );

    expect(manifest.mcpServers.petsonality.command).toBe("node");
    expect(manifest.mcpServers.petsonality.args).toEqual(["dist/server.js"]);
  });
});
