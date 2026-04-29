import { describe, test, expect } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { pathToFileURL } from "url";
import { findPackageRoot } from "./find-package-root.ts";

describe("findPackageRoot", () => {
  test("returns the directory holding package.json when walking up from a nested script", () => {
    const root = mkdtempSync(join(tmpdir(), "petsonality-pkg-"));
    try {
      writeFileSync(join(root, "package.json"), "{}");
      const nested = join(root, "dist", "cli");
      mkdirSync(nested, { recursive: true });
      const scriptUrl = pathToFileURL(join(nested, "doctor.js")).href;
      expect(findPackageRoot(scriptUrl)).toBe(root);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("terminates instead of infinite-looping when no package.json is reachable", () => {
    // Regression: prior `while (dir !== "/")` loop never terminated on Windows
    // because path.dirname("C:\\") returns "C:\\" itself.
    const fakeUrl = "file:///Z:/petsonality-test-no-pkg-anywhere/x.js";
    const result = findPackageRoot(fakeUrl);
    expect(typeof result).toBe("string");
  });
});
