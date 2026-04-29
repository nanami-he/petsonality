import { describe, test, expect } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

describe("doctor platform diagnostics", () => {
  test("has a Windows-specific statusline smoke path", () => {
    const source = readFileSync(join(import.meta.dir, "doctor.ts"), "utf8");

    expect(source).toContain("IS_WIN");
    expect(source).toContain("pet-status.ps1");
    expect(source).toContain("powershell.exe");
  });
});
