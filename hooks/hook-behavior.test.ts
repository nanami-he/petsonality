import { describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { tmpdir } from "os";

const ROOT = dirname(import.meta.dir);
const NODE_PATH = Buffer.from(Bun.spawnSync({
  cmd: ["/bin/zsh", "-lc", "command -v node"],
  stdout: "pipe",
}).stdout).toString("utf8").trim();

function tempHome(prefix: string): string {
  const home = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(home, ".petsonality"), { recursive: true });
  return home;
}

function runNode(script: string, stdin: string, home: string) {
  return Bun.spawnSync({
    cmd: [NODE_PATH, script],
    cwd: ROOT,
    stdin: Buffer.from(stdin),
    env: { ...process.env, HOME: home, TMUX_PANE: "%pettest", LANG: "en_US.UTF-8" },
  });
}

function runNodeWithEnv(script: string, stdin: string, home: string, env: Record<string, string>) {
  return Bun.spawnSync({
    cmd: [NODE_PATH, script],
    cwd: ROOT,
    stdin: Buffer.from(stdin),
    env: { ...process.env, HOME: home, LANG: "en_US.UTF-8", ...env },
  });
}

describe("hook behavior", () => {
  test("Stop hook accepts model pet comment after PostToolUse writes a hint", () => {
    const home = tempHome("petsonality-hooks-");
    const stateDir = join(home, ".petsonality");
    writeFileSync(join(stateDir, "pet.json"), JSON.stringify({
      petId: "labrador",
      petName: "Bao",
      cooldownRange: [5, 12],
    }));
    writeFileSync(join(stateDir, "status.json"), JSON.stringify({
      name: "Bao",
      petId: "labrador",
      reaction: "",
      muted: false,
    }));
    writeFileSync(join(stateDir, "reactions-pool.json"), JSON.stringify({
      en: {
        pool: { labrador: { error: ["fallback"] } },
        meta: { labrador: { talkLevel: "moderate" } },
      },
    }));

    const react = runNode("hooks/react.js", JSON.stringify({ tool_response: "error: boom" }), home);
    expect(react.exitCode).toBe(0);

    const comment = runNode(
      "hooks/pet-comment.js",
      JSON.stringify({ last_assistant_message: "reply <!-- pet: model comment -->" }),
      home,
    );
    expect(comment.exitCode).toBe(0);

    const status = JSON.parse(readFileSync(join(stateDir, "status.json"), "utf8"));
    const hint = JSON.parse(readFileSync(join(stateDir, "hint.pettest.json"), "utf8"));
    expect(status.reaction).toBe("model comment");
    expect(hint.consumed).toBe(true);
    expect(existsSync(join(stateDir, "reaction.pettest.json"))).toBe(true);
  });

  test("bash statusline renders without jq in PATH", () => {
    const home = tempHome("petsonality-statusline-");
    const stateDir = join(home, ".petsonality");
    writeFileSync(join(stateDir, "status.json"), JSON.stringify({
      name: "Bao",
      petId: "labrador",
      reaction: "hi",
      muted: false,
    }));

    const binDir = join(home, "bin");
    mkdirSync(binDir);
    symlinkSync(NODE_PATH, join(binDir, "node"));

    const result = Bun.spawnSync({
      cmd: ["/bin/bash", "statusline/pet-status.sh"],
      cwd: ROOT,
      env: { ...process.env, HOME: home, PATH: `${binDir}:/bin`, TMUX_PANE: "%pettest" },
      stdout: "pipe",
      stderr: "pipe",
    });

    expect(result.exitCode).toBe(0);
    expect(Buffer.from(result.stdout).toString("utf8")).toContain("Bao");
  });

  test("hooks and bash statusline honor PETSONALITY_SID override", () => {
    const home = tempHome("petsonality-sid-");
    const stateDir = join(home, ".petsonality");
    writeFileSync(join(stateDir, "pet.json"), JSON.stringify({
      petId: "labrador",
      petName: "Bao",
      cooldownRange: [5, 12],
    }));
    writeFileSync(join(stateDir, "status.json"), JSON.stringify({
      name: "Bao",
      petId: "labrador",
      reaction: "",
      muted: false,
    }));

    const comment = runNodeWithEnv(
      "hooks/pet-comment.js",
      JSON.stringify({ last_assistant_message: "reply <!-- pet: scoped comment -->" }),
      home,
      { PETSONALITY_SID: "window/one", TMUX_PANE: "%wrong" },
    );
    expect(comment.exitCode).toBe(0);
    expect(existsSync(join(stateDir, "reaction.window_one.json"))).toBe(true);
    expect(existsSync(join(stateDir, "reaction.wrong.json"))).toBe(false);

    const binDir = join(home, "bin");
    mkdirSync(binDir);
    symlinkSync(NODE_PATH, join(binDir, "node"));

    const result = Bun.spawnSync({
      cmd: ["/bin/bash", "statusline/pet-status.sh"],
      cwd: ROOT,
      env: {
        ...process.env,
        HOME: home,
        PATH: `${binDir}:/bin:/usr/bin`,
        PETSONALITY_SID: "window/one",
        TMUX_PANE: "%wrong",
      },
      stdout: "pipe",
      stderr: "pipe",
    });

    expect(result.exitCode).toBe(0);
    expect(Buffer.from(result.stdout).toString("utf8")).toContain("scoped comment");
  });
});
