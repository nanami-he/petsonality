import { describe, test, expect } from "bun:test";
import { statusLineScriptPath, formatStatusLineCommand, statusLineConfigForPlatform } from "./statusline-config.ts";

describe("statusline config", () => {
  test("uses the bash statusline on Unix", () => {
    const runtimeDir = "/home/me/.petsonality";

    expect(statusLineScriptPath("linux", runtimeDir)).toBe("/home/me/.petsonality/statusline/pet-status.sh");
    expect(formatStatusLineCommand("linux", runtimeDir)).toBe("/home/me/.petsonality/statusline/pet-status.sh");
    expect(statusLineConfigForPlatform("linux", runtimeDir)).toEqual({
      type: "command",
      command: "/home/me/.petsonality/statusline/pet-status.sh",
      padding: 1,
      refreshInterval: 1,
    });
  });

  test("uses PowerShell with a quoted ps1 path on Windows", () => {
    const runtimeDir = "C:\\Users\\Lee Example\\.petsonality";

    expect(statusLineScriptPath("win32", runtimeDir)).toBe("C:\\Users\\Lee Example\\.petsonality\\statusline\\pet-status.ps1");
    expect(formatStatusLineCommand("win32", runtimeDir)).toBe(
      'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\\Users\\Lee Example\\.petsonality\\statusline\\pet-status.ps1"',
    );
    expect(statusLineConfigForPlatform("win32", runtimeDir)).toEqual({
      type: "command",
      command: 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\\Users\\Lee Example\\.petsonality\\statusline\\pet-status.ps1"',
      padding: 1,
      refreshInterval: 1,
    });
  });
});
