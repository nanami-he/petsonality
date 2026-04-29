import { describe, test, expect } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import { ANIMALS } from "../server/engine.ts";

const STATUSLINE_DIR = join(import.meta.dir, "..", "statusline");

describe("PowerShell statusline", () => {
  test("ships a native PowerShell renderer without jq", () => {
    const script = readFileSync(join(STATUSLINE_DIR, "pet-status.ps1"), "utf8");

    expect(script).toContain("ConvertFrom-Json");
    expect(script).toContain("pet-art.json");
    expect(script).toContain("$PSScriptRoot");
    expect(script).toContain("[Environment]::GetFolderPath(\"UserProfile\")");
    expect(script).toContain("$env:USERPROFILE");
    expect(script).toContain("$env:HOME");
    expect(script).not.toContain("jq");
  });

  test("ships generated JSON art data for every animal", () => {
    const data = JSON.parse(readFileSync(join(STATUSLINE_DIR, "pet-art.json"), "utf8"));

    expect(Object.keys(data.animals).sort()).toEqual([...ANIMALS].sort());
    for (const animal of ANIMALS) {
      const entry = data.animals[animal];
      expect(entry.color).toMatch(/^\x1b\[38;2;\d+;\d+;\d+m$/);
      expect(entry.bubbleColor).toMatch(/^\x1b\[38;2;\d+;\d+;\d+m$/);
      expect(entry.frames.length).toBeGreaterThanOrEqual(3);
      for (const frame of entry.frames) {
        expect(frame).toHaveLength(4);
        for (const line of frame) {
          expect(typeof line).toBe("string");
        }
      }
    }
  });
});
