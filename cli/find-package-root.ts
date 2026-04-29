/**
 * Walk up from a script's URL until a directory containing package.json is
 * found. Returns that directory, or the filesystem root if none was found.
 *
 * The previous inline implementation used `while (dir !== "/")` which never
 * terminates on Windows — `path.dirname("C:\\")` returns `"C:\\"` itself, so
 * once the walk reached a drive root the loop spun forever. We instead detect
 * "dirname stopped changing" which is correct on every platform.
 */

import { existsSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

export function findPackageRoot(startUrl: string): string {
  let dir = resolve(dirname(fileURLToPath(startUrl)));
  while (!existsSync(join(dir, "package.json"))) {
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return dir;
}
