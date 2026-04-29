import { join, win32 } from "path";
import type { platform } from "os";

type Platform = ReturnType<typeof platform>;

export interface StatusLineConfig {
  type: "command";
  command: string;
  padding: number;
  refreshInterval: number;
}

export function statusLineScriptPath(currentPlatform: Platform, runtimeDir: string): string {
  const scriptName = currentPlatform === "win32" ? "pet-status.ps1" : "pet-status.sh";
  const pathJoin = currentPlatform === "win32" ? win32.join : join;
  return pathJoin(runtimeDir, "statusline", scriptName);
}

function quoteWindowsCommandArg(value: string): string {
  return `"${value.replaceAll('"', '\\"')}"`;
}

export function formatStatusLineCommand(currentPlatform: Platform, runtimeDir: string): string {
  const scriptPath = statusLineScriptPath(currentPlatform, runtimeDir);
  if (currentPlatform === "win32") {
    return `powershell.exe -NoProfile -ExecutionPolicy Bypass -File ${quoteWindowsCommandArg(scriptPath)}`;
  }
  return scriptPath;
}

export function statusLineConfigForPlatform(currentPlatform: Platform, runtimeDir: string): StatusLineConfig {
  return {
    type: "command",
    command: formatStatusLineCommand(currentPlatform, runtimeDir),
    padding: 1,
    refreshInterval: 1,
  };
}
