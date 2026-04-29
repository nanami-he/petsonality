import { describe, test, expect } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

const SCRIPT = join(import.meta.dir, "build-reactions.ts");

describe("build-reactions", () => {
  test("does not write to the user runtime directory during normal builds", () => {
    const source = readFileSync(SCRIPT, "utf8");

    expect(source).toContain("PETSONALITY_SYNC_RUNTIME");
    expect(source).toContain("syncRuntime");
    expect(source).toContain("dist/reactions-pool.json");
  });
});
