/**
 * petsonality uninstall — remove all integrations
 */

import { readFileSync, writeFileSync, existsSync, rmSync, readdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const NC = "\x1b[0m";

function ok(msg: string) { console.log(`${GREEN}✓${NC}  ${msg}`); }
function warn(msg: string) { console.log(`${YELLOW}⚠${NC}  ${msg}`); }

const CLAUDE_DIR = join(homedir(), ".claude");
const SETTINGS_FILE = join(CLAUDE_DIR, "settings.json");
const SKILL_DIR = join(CLAUDE_DIR, "skills", "pet");
const STATE_DIR = join(homedir(), ".petsonality");
const LEGACY_STATE_DIR = join(homedir(), ".mbti-pet");

console.log("\npetsonality uninstall\n");

// Stop all popup reopen loops and close any running popup
try {
  for (const dir of [STATE_DIR, LEGACY_STATE_DIR]) {
    if (!existsSync(dir)) continue;
    // Kill all session popup loops (popup-reopen-pid.*)
    for (const f of readdirSync(dir).filter(f => f.startsWith("popup-reopen-pid."))) {
      const pidPath = join(dir, f);
      const pid = parseInt(readFileSync(pidPath, "utf8").trim(), 10);
      if (pid > 0) { try { process.kill(pid); } catch { /* already dead */ } }
      rmSync(pidPath, { force: true });
    }
    // Clean up all session-scoped files
    const patterns = ["popup-stop.", "popup-resize.", "popup-env.", "popup-scroll.",
                      "reaction.", ".last_reaction.", ".last_comment."];
    for (const f of readdirSync(dir)) {
      if (patterns.some(p => f.startsWith(p))) {
        rmSync(join(dir, f), { force: true });
      }
    }
  }
  // Close any open popup
  if (process.env.TMUX) {
    const { execSync } = await import("child_process");
    execSync("tmux display-popup -C 2>/dev/null", { stdio: "ignore" });
  }
  ok("Popup stopped");
} catch { /* not in tmux or no popup */ }

// Remove MCP server from ~/.claude.json (both new and legacy keys)
try {
  const claudeJsonPath = join(homedir(), ".claude.json");
  const claudeJson = JSON.parse(readFileSync(claudeJsonPath, "utf8"));
  let removed = false;
  for (const key of ["petsonality", "typet"]) {
    if (claudeJson.mcpServers?.[key]) {
      delete claudeJson.mcpServers[key];
      removed = true;
    }
  }
  if (removed) {
    if (Object.keys(claudeJson.mcpServers ?? {}).length === 0) delete claudeJson.mcpServers;
    writeFileSync(claudeJsonPath, JSON.stringify(claudeJson, null, 2));
    ok("MCP server removed from ~/.claude.json");
  }
} catch {
  warn("Could not update ~/.claude.json");
}

// Remove hooks and statusline from settings.json
try {
  const settings = JSON.parse(readFileSync(SETTINGS_FILE, "utf8"));
  let changed = false;

  if (settings.statusLine?.command?.includes("pet")) {
    delete settings.statusLine;
    ok("Status line removed");
    changed = true;
  }

  for (const hookType of ["PostToolUse", "Stop", "SessionStart", "SessionEnd"] as const) {
    if (settings.hooks?.[hookType]) {
      const before = settings.hooks[hookType].length;
      settings.hooks[hookType] = settings.hooks[hookType].filter(
        (h: any) => !h.hooks?.some((hh: any) => hh.command?.includes("petsonality") || hh.command?.includes("typet")),
      );
      if (settings.hooks[hookType].length < before) {
        ok(`${hookType} hooks removed`);
        changed = true;
      }
      if (settings.hooks[hookType].length === 0) delete settings.hooks[hookType];
    }
  }
  if (settings.hooks && Object.keys(settings.hooks).length === 0) delete settings.hooks;

  if (changed) {
    writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2) + "\n");
  }
} catch {
  warn("Could not update settings.json");
}

// Remove skill
if (existsSync(SKILL_DIR)) {
  rmSync(SKILL_DIR, { recursive: true });
  ok("Skill removed");
} else {
  warn("Skill not found (already removed)");
}

// Remove OpenClaw patch if present
try {
  const { removePatch } = await import("./openclaw-patch.ts");
  const result = removePatch();
  if (result.success && result.message !== "No patch to remove") {
    ok(result.message);
  }
} catch { /* openclaw not installed */ }

// Keep state dir (pet data) — user might want it back
if (existsSync(STATE_DIR)) {
  warn(`Pet data kept at ${STATE_DIR} — delete manually if not needed`);
} else if (existsSync(LEGACY_STATE_DIR)) {
  warn(`Pet data kept at ${LEGACY_STATE_DIR} — delete manually if not needed`);
}

console.log(`\n${GREEN}Done.${NC} Restart Claude Code to apply changes.\n`);
