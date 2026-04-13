/**
 * petsonality installer
 *
 * Registers: MCP server (in ~/.claude.json), skill, hooks, status line (in settings.json)
 * Checks: bun, jq, ~/.claude/ directory
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync } from "fs";
import { execSync } from "child_process";
import { join, resolve, dirname } from "path";
import { homedir } from "os";

const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const NC = "\x1b[0m";

const CLAUDE_DIR = join(homedir(), ".claude");
const SETTINGS_FILE = join(CLAUDE_DIR, "settings.json");
const SKILL_DIR = join(CLAUDE_DIR, "skills", "pet");
const PROJECT_ROOT = resolve(dirname(import.meta.dir));

function banner() {
  console.log(`
${CYAN}╔══════════════════════════════════════════════════════════╗${NC}
${CYAN}║${NC}  ${BOLD}petsonality${NC} — MBTI terminal pet companion       ${CYAN}║${NC}
${CYAN}║${NC}  ${DIM}MCP + Skill + StatusLine + Hooks${NC}                  ${CYAN}║${NC}
${CYAN}╚══════════════════════════════════════════════════════════╝${NC}
`);
}

function ok(msg: string) { console.log(`${GREEN}✓${NC}  ${msg}`); }
function info(msg: string) { console.log(`${CYAN}→${NC}  ${msg}`); }
function warn(msg: string) { console.log(`${YELLOW}⚠${NC}  ${msg}`); }
function err(msg: string) { console.log(`${RED}✗${NC}  ${msg}`); }

// ─── Preflight checks ──────────────────────────────────────────────────────

function preflight(): boolean {
  let pass = true;

  try {
    execSync("bun --version", { stdio: "ignore" });
    ok("bun found");
  } catch {
    err("bun not found. Install: curl -fsSL https://bun.sh/install | bash");
    pass = false;
  }

  try {
    execSync("jq --version", { stdio: "ignore" });
    ok("jq found");
  } catch {
    warn("jq not found — needed for status line + hooks");
    err("Install: brew install jq");
    pass = false;
  }

  try {
    execSync("python3 --version", { stdio: "ignore" });
    ok("python3 found");
  } catch {
    warn("python3 not found — needed for bubble text wrapping");
    err("Install python3 for your platform");
    pass = false;
  }

  if (!existsSync(CLAUDE_DIR)) {
    err("~/.claude/ not found. Start Claude Code once first.");
    pass = false;
  } else {
    ok("~/.claude/ found");
  }

  if (!existsSync(join(homedir(), ".claude.json"))) {
    err("~/.claude.json not found. Start Claude Code once first.");
    pass = false;
  } else {
    ok("~/.claude.json found");
  }

  return pass;
}

// ─── Settings helpers ──────────────────────────────────────────────────────

function loadSettings(): Record<string, any> {
  try { return JSON.parse(readFileSync(SETTINGS_FILE, "utf8")); }
  catch { return {}; }
}

function saveSettings(settings: Record<string, any>) {
  mkdirSync(CLAUDE_DIR, { recursive: true });
  writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2) + "\n");
}

// ─── Step 1: Register MCP server ───────────────────────────────────────────

function installMcp() {
  const bunPath = execSync("which bun", { encoding: "utf8" }).trim();
  const serverPath = join(PROJECT_ROOT, "server", "index.ts");
  const claudeJsonPath = join(homedir(), ".claude.json");

  let claudeJson: Record<string, any> = {};
  try { claudeJson = JSON.parse(readFileSync(claudeJsonPath, "utf8")); }
  catch { /* fresh */ }

  if (!claudeJson.mcpServers) claudeJson.mcpServers = {};

  // Clean up legacy "typet" entry
  if (claudeJson.mcpServers["typet"]) {
    delete claudeJson.mcpServers["typet"];
  }

  claudeJson.mcpServers["petsonality"] = {
    command: bunPath,
    args: [serverPath],
    cwd: PROJECT_ROOT,
  };

  writeFileSync(claudeJsonPath, JSON.stringify(claudeJson, null, 2));
  ok("MCP server registered in ~/.claude.json");
}

// ─── Step 2: Install skill ─────────────────────────────────────────────────

function installSkill() {
  const srcSkill = join(PROJECT_ROOT, "skills", "pet", "SKILL.md");
  mkdirSync(SKILL_DIR, { recursive: true });
  cpSync(srcSkill, join(SKILL_DIR, "SKILL.md"), { force: true });
  ok("Skill installed: ~/.claude/skills/pet/SKILL.md");
}

// ─── Step 3: Status line ───────────────────────────────────────────────────

function installStatusLine(settings: Record<string, any>) {
  if (settings.statusLine?.command && !settings.statusLine.command.includes("petsonality") && !settings.statusLine.command.includes("typet")) {
    warn(`Existing statusLine found: ${settings.statusLine.command}`);
    warn("Replacing with petsonality status line. Old config backed up in ~/.petsonality/statusline.bak");

    mkdirSync(join(homedir(), ".petsonality"), { recursive: true });
    writeFileSync(join(homedir(), ".petsonality", "statusline.bak"), JSON.stringify(settings.statusLine, null, 2));
  }
  settings.statusLine = {
    type: "command",
    command: join(PROJECT_ROOT, "statusline", "pet-status.sh"),
    padding: 1,
    refreshInterval: 1,
  };
  ok("Status line configured");
}

// ─── Step 4: Hooks ─────────────────────────────────────────────────────────

function installHooks(settings: Record<string, any>) {
  const reactHook = join(PROJECT_ROOT, "hooks", "react.sh");
  const commentHook = join(PROJECT_ROOT, "hooks", "pet-comment.sh");

  if (!settings.hooks) settings.hooks = {};

  // PostToolUse — clean up both old (typet) and new (petsonality) entries
  if (!settings.hooks.PostToolUse) settings.hooks.PostToolUse = [];
  settings.hooks.PostToolUse = settings.hooks.PostToolUse.filter(
    (h: any) => !h.hooks?.some((hh: any) => hh.command?.includes("petsonality") || hh.command?.includes("typet")),
  );
  settings.hooks.PostToolUse.push({
    hooks: [{ type: "command", command: reactHook }],
  });

  // Stop — same cleanup
  if (!settings.hooks.Stop) settings.hooks.Stop = [];
  settings.hooks.Stop = settings.hooks.Stop.filter(
    (h: any) => !h.hooks?.some((hh: any) => hh.command?.includes("petsonality") || hh.command?.includes("typet")),
  );
  settings.hooks.Stop.push({
    hooks: [{ type: "command", command: commentHook }],
  });

  ok("Hooks registered: PostToolUse + Stop");
}

// ─── Step 5: Permissions ───────────────────────────────────────────────────

function ensurePermissions(settings: Record<string, any>) {
  if (!settings.permissions) settings.permissions = {};
  if (!settings.permissions.allow) settings.permissions.allow = [];

  const allow: string[] = settings.permissions.allow;

  // Remove legacy permission
  const legacyIdx = allow.findIndex((p: string) => p.includes("typet"));
  if (legacyIdx !== -1) allow.splice(legacyIdx, 1);

  if (!allow.some((p: string) => p.includes("petsonality"))) {
    allow.push("mcp__petsonality__*");
    ok("Permission added: mcp__petsonality__*");
  } else {
    ok("MCP permissions already configured");
  }
}

// ─── Step 6: OpenClaw patch ────────────────────────────────────────────────

async function installOpenClaw() {
  const { findOpenClawTuiFile, hasNativeStatusLine, applyPatch } = await import("./openclaw-patch.ts");
  const tuiFile = findOpenClawTuiFile();
  if (!tuiFile) return;

  info("OpenClaw detected");

  if (hasNativeStatusLine(tuiFile)) {
    ok("OpenClaw has native statusLine support — writing config");
    // Write to openclaw config
    const ocConfigPath = join(homedir(), ".openclaw", "openclaw.json");
    try {
      let ocConfig: Record<string, any> = {};
      try { ocConfig = JSON.parse(readFileSync(ocConfigPath, "utf8")); } catch { /* fresh */ }
      if (!ocConfig.ui) ocConfig.ui = {};
      ocConfig.ui.statusLine = {
        command: join(PROJECT_ROOT, "statusline", "pet-status.sh"),
        refreshInterval: 1000,
      };
      writeFileSync(ocConfigPath, JSON.stringify(ocConfig, null, 2));
      ok("OpenClaw statusLine configured");
    } catch {
      warn("Could not write OpenClaw config");
    }
    return;
  }

  // No native support — apply temporary patch
  info("Applying temporary statusLine patch...");
  warn("This is a compatibility patch until OpenClaw merges statusLine support");
  const scriptPath = join(PROJECT_ROOT, "statusline", "pet-status.sh");
  const result = applyPatch(scriptPath);
  if (result.success) {
    ok(result.message);
  } else {
    warn(result.message);
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────

banner();
info("Checking requirements...\n");

if (!preflight()) {
  console.log(`\n${RED}Installation aborted. Fix the issues above and retry.${NC}\n`);
  process.exit(1);
}

console.log("");
info("Installing petsonality...\n");

const settings = loadSettings();
installMcp();
installSkill();
installStatusLine(settings);
installHooks(settings);
ensurePermissions(settings);
saveSettings(settings);

// OpenClaw support (separate from Claude Code)
await installOpenClaw();

console.log(`
${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}
${GREEN}  Done! Restart Claude Code and type /pet${NC}
${GREEN}  Your pet will guide you through adoption.${NC}
${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}

${DIM}  /pet          adopt or show your pet
  /pet pet      interact with your pet
  /pet off      mute reactions
  /pet on       unmute reactions${NC}
`);
