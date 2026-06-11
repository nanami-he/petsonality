/**
 * Cross-platform binary lookup. Replaces `execSync("which X")` which fails
 * on Windows ('which' is not recognized as an internal or external command).
 *
 * Pure Node — no shell-out, no platform-specific commands.
 */

import { existsSync, statSync, realpathSync } from "fs";
import { join, delimiter } from "path";
import { platform, homedir } from "os";

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

/**
 * Normalizes a node binary path (like a Homebrew keg path `/opt/homebrew/Cellar/node/...`)
 * to its stable, version-agnostic symlink path if they point to the exact same binary.
 *
 * For Windows and other environments where no stable candidate matches, the original path is returned.
 */
export function stableNodePath(
  execPath: string,
  candidates?: string[]
): string {
  if (platform() === "win32") {
    return execPath;
  }

  const pathNode = candidates ? null : whichSync("node");
  const resolvedCandidates = candidates || [
    pathNode,
    "/opt/homebrew/bin/node",
    "/usr/local/bin/node",
    "/home/linuxbrew/.linuxbrew/bin/node",
    join(homedir(), ".volta/bin/node"),
  ].filter((candidate): candidate is string => !!candidate);

  try {
    const realExec = realpathSync(execPath);
    for (const candidate of resolvedCandidates) {
      try {
        if (existsSync(candidate) && realpathSync(candidate) === realExec) {
          return candidate;
        }
      } catch {
        // Individual candidate resolution failed; skip and continue
      }
    }
  } catch {
    // Fallback to original input if realpath resolution of execPath fails
  }

  return execPath;
}

