import { describe, test, expect } from "bun:test";
import { formatHookCommand } from "./hook-command.ts";

describe("formatHookCommand", () => {
  test("quotes node and script paths so Windows paths with spaces survive", () => {
    expect(
      formatHookCommand(
        "C:\\Program Files\\nodejs\\node.exe",
        "C:\\Users\\me\\App Data\\petsonality\\hooks\\react.js",
      ),
    ).toBe(
      '"C:\\Program Files\\nodejs\\node.exe" "C:\\Users\\me\\App Data\\petsonality\\hooks\\react.js"',
    );
  });
});
