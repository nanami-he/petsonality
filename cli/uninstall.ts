/**
 * claude-buddy uninstall — remove all integrations
 */

import { readFileSync, writeFileSync, existsSync, rmSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const NC = "\x1b[0m";

function ok(msg: string) { console.log(`${GREEN}✓${NC}  ${msg}`); }
function warn(msg: string) { console.log(`${YELLOW}⚠${NC}  ${msg}`); }

const CLAUDE_DIR = join(homedir(), ".claude");
const SETTINGS_FILE = join(CLAUDE_DIR, "settings.json");
const SKILL_DIR = join(CLAUDE_DIR, "skills", "buddy");
const STATE_DIR = join(homedir(), ".claude-buddy");

console.log("\nclaude-buddy uninstall\n");

// Remove MCP server from ~/.claude.json
try {
  const claudeJsonPath = join(homedir(), ".claude.json");
  const claudeJson = JSON.parse(readFileSync(claudeJsonPath, "utf8"));
  if (claudeJson.mcpServers?.["claude-buddy"]) {
    delete claudeJson.mcpServers["claude-buddy"];
    if (Object.keys(claudeJson.mcpServers).length === 0) delete claudeJson.mcpServers;
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

  if (settings.statusLine?.command?.includes("buddy")) {
    delete settings.statusLine;
    ok("Status line removed");
    changed = true;
  }

  for (const hookType of ["PostToolUse", "Stop"] as const) {
    if (settings.hooks?.[hookType]) {
      const before = settings.hooks[hookType].length;
      settings.hooks[hookType] = settings.hooks[hookType].filter(
        (h: any) => !h.hooks?.some((hh: any) => hh.command?.includes("claude-buddy")),
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

// Keep state dir (companion data) — user might want it back
if (existsSync(STATE_DIR)) {
  warn(`Companion data kept at ${STATE_DIR} — delete manually if not needed`);
}

console.log(`\n${GREEN}Done.${NC} Restart Claude Code to apply changes.\n`);
