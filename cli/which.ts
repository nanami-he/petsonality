/**
 * Cross-platform binary lookup. Replaces `execSync("which X")` which fails
 * on Windows ('which' is not recognized as an internal or external command).
 *
 * Pure Node — no shell-out, no platform-specific commands.
 */

import { existsSync, statSync, realpathSync } from "fs";
import { join, delimiter } from "path";
import { platform } from "os";

const IS_WIN = platform() === "win32";

/** Extensions to try on Windows when looking up an executable name. */
const PATH_EXT = IS_WIN
  ? (process.env.PATHEXT || ".COM;.EXE;.BAT;.CMD").split(";").map((e) => e.toLowerCase())
  : [""];

/**
 * Find an executable on the user's PATH.
 *
 * On Windows, `name` is matched against PATHEXT extensions (.exe, .cmd, etc.).
 * On Unix, an exact filename match is used.
 *
 * Returns the absolute path of the first match, or null if not found.
 */
export function whichSync(name: string): string | null {
  // If the caller already passed an absolute or qualified path, just verify it.
  if (name.includes("/") || name.includes("\\")) {
    return existsAndFile(name) ? name : null;
  }

  const dirs = (process.env.PATH || "").split(delimiter).filter(Boolean);
  for (const dir of dirs) {
    for (const ext of PATH_EXT) {
      const candidate = join(dir, name + ext);
      if (existsAndFile(candidate)) return candidate;
    }
  }
  return null;
}

function existsAndFile(p: string): boolean {
  try {
    return existsSync(p) && statSync(p).isFile();
  } catch {
    return false;
  }
}

/**
 * Resolve a binary on PATH all the way through symlinks (e.g. `/opt/homebrew/bin/openclaw`
 * → `/opt/homebrew/lib/node_modules/openclaw/dist/cli.js`). Returns null if the binary
 * is not found or cannot be resolved.
 */
export function realPathOf(name: string): string | null {
  const found = whichSync(name);
  if (!found) return null;
  try {
    return realpathSync(found);
  } catch {
    return found;
  }
}
