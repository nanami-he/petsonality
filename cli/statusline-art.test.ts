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

describe("golden retriever statusline actions", () => {
  test("bash renderer maps lick and spin to the redesigned golden frames", () => {
    const script = readFileSync(join(STATUSLINE_DIR, "pet-status.sh"), "utf8");

    expect(script).toContain("lick) if [ $(( (ACT_STEP / 5) % 2 )) -eq 0 ]; then FRAME=5; else FRAME=6; fi ;;");
    expect(script).toContain("spin) if [ $(( (ACT_STEP / 5) % 2 )) -eq 0 ]; then FRAME=7; else FRAME=0; fi ;;");
    expect(script).toContain('FRAME=7; echo "ACT_TYPE=spin;');
  });

  test("PowerShell renderer maps lick and spin to the redesigned golden frames", () => {
    const script = readFileSync(join(STATUSLINE_DIR, "pet-status.ps1"), "utf8");

    expect(script).toContain('"lick" { if (([math]::Floor($a.Step / 5) % 2) -eq 0) { $frame = 5 } else { $frame = 6 } }');
    expect(script).toContain('default { if (([math]::Floor($a.Step / 5) % 2) -eq 0) { $frame = 7 } else { $frame = 0 } }');
    expect(script).toContain('Start-Action ".gold_act" "spin" (Get-Random -Minimum 80 -Maximum 100) 0; return 7');
  });

  test("golden uses its explicit blink frame instead of generic eye replacement", () => {
    const shell = readFileSync(join(STATUSLINE_DIR, "pet-status.sh"), "utf8");
    const ps = readFileSync(join(STATUSLINE_DIR, "pet-status.ps1"), "utf8");

    expect(shell).toContain("raven|owl|bear|golden) FRAME=2; BLINK=0 ;;");
    expect(ps).toContain('$PetId -eq "golden"');
  });
});
