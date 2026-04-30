import { describe, test, expect } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import { collectReactionLines, sortReactionPool } from "./reaction-pool-order.ts";

const SCRIPT = join(import.meta.dir, "build-reactions.ts");

describe("build-reactions", () => {
  test("does not write to the user runtime directory during normal builds", () => {
    const source = readFileSync(SCRIPT, "utf8");

    expect(source).toContain("PETSONALITY_SYNC_RUNTIME");
    expect(source).toContain("syncRuntime");
    expect(source).toContain("dist/reactions-pool.json");
  });

  test("sorts reaction arrays before writing the pool artifact", () => {
    const pool = {
      fox: {
        turn: ["zebra", "alpha", "middle"],
        pet: ["two", "one"],
      },
      cat: {
        idle: ["nap", "blink"],
      },
    };

    expect(sortReactionPool(pool)).toEqual({
      cat: {
        idle: ["blink", "nap"],
      },
      fox: {
        pet: ["one", "two"],
        turn: ["alpha", "middle", "zebra"],
      },
    });
  });

  test("collects reactions from source pools without random sampling", () => {
    expect(
      collectReactionLines(
        { turn: ["general-b", "shared", "general-a"] },
        { fox: { turn: ["animal-b", "shared", "animal-a"] } },
        "fox",
        "turn",
      ),
    ).toEqual(["animal-a", "animal-b", "general-a", "general-b", "shared"]);
  });
});
