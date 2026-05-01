import { describe, expect, test } from "bun:test";
import {
  findPetsonalityHookEntries,
  statusLineReplacementPreview,
} from "./install-transparency.ts";

describe("install transparency", () => {
  test("prompts before replacing a non-petsonality status line", () => {
    expect(
      statusLineReplacementPreview(
        { command: "/usr/local/bin/starship status", refreshInterval: 1 },
        { command: "/Users/me/.petsonality/statusline/pet-status.sh", refreshInterval: 1, padding: 1, type: "command" },
      ),
    ).toEqual({
      existing: { command: "/usr/local/bin/starship status", refreshInterval: 1 },
      next: { command: "/Users/me/.petsonality/statusline/pet-status.sh", refreshInterval: 1, padding: 1, type: "command" },
    });
  });

  test("does not prompt when refreshing a petsonality status line", () => {
    expect(
      statusLineReplacementPreview(
        { command: "/Users/me/.petsonality/statusline/pet-status.sh", refreshInterval: 1 },
        { command: "/Users/me/.petsonality/statusline/pet-status.sh", refreshInterval: 1, padding: 1, type: "command" },
      ),
    ).toBeNull();
  });

  test("finds only petsonality or legacy hook entries for replacement", () => {
    const hooks = [
      { hooks: [{ type: "command", command: "node /tmp/third-party.js" }] },
      { hooks: [{ type: "command", command: "node ~/.petsonality/hooks/react.js" }] },
      { hooks: [{ type: "command", command: "node ~/.typet/hooks/react.js" }] },
    ];

    expect(findPetsonalityHookEntries(hooks)).toEqual([hooks[1], hooks[2]]);
  });
});
