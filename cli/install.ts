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
// Walk up from script location to find the package root (where package.json lives).
// In dev: cli/install.ts → dirname gives project root directly.
// In dist: dist/cli/install.js → dirname gives dist/, need to go up one more.
function findPackageRoot(): string {
  let dir = resolve(dirname(new URL(".", import.meta.url).pathname));
  while (dir !== "/" && !existsSync(join(dir, "package.json"))) {
    dir = dirname(dir);
  }
  return dir;
}
const PROJECT_ROOT = findPackageRoot();

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

function detectHosts(): { claude: boolean; openclaw: boolean } {
  const claude = existsSync(CLAUDE_DIR) && existsSync(join(homedir(), ".claude.json"));
  let openclaw = false;
  try {
    const { findOpenClawTuiFile } = require("./openclaw-patch.ts");
    openclaw = !!findOpenClawTuiFile();
  } catch {
    // Try simpler detection
    try { execSync("which openclaw", { stdio: "ignore" }); openclaw = true; } catch {}
  }
  return { claude, openclaw };
}

function preflight(): boolean {
  let pass = true;

  try {
    const nodeVer = execSync("node --version", { encoding: "utf8" }).trim();
    ok(`node found (${nodeVer})`);
  } catch {
    err("node not found. Install: https://nodejs.org/");
    pass = false;
  }

  // jq is optional — only needed for statusline bubble display
  try {
    execSync("jq --version", { stdio: "ignore" });
    ok("jq found (used by status line)");
  } catch {
    warn("jq not found — status line bubbles will be limited");
    info("Install: brew install jq (optional)");
  }

  const hosts = detectHosts();
  if (hosts.claude) ok("Claude Code detected");
  if (hosts.openclaw) ok("OpenClaw detected");

  if (!hosts.claude && !hosts.openclaw) {
    err("No supported host found.");
    info("Install Claude Code (https://claude.ai/code) or OpenClaw (https://github.com/openclaw/openclaw)");
    pass = false;
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
  const nodePath = execSync("which node", { encoding: "utf8" }).trim();
  const serverPath = join(RUNTIME_DIR, "dist", "server.js");
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
    command: nodePath,
    args: [serverPath],
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
    command: join(RUNTIME_DIR, "statusline", "pet-status.sh"),
    padding: 1,
    refreshInterval: 1,
  };
  ok("Status line configured");
}

// ─── Step 3b: Copy runtime files to ~/.petsonality/ (stable paths) ─────────

function installRuntimeFiles() {
  const runtimeDir = join(homedir(), ".petsonality");
  mkdirSync(join(runtimeDir, "hooks"), { recursive: true });
  mkdirSync(join(runtimeDir, "statusline"), { recursive: true });

  // Copy hooks
  cpSync(join(PROJECT_ROOT, "hooks", "react.js"), join(runtimeDir, "hooks", "react.js"), { force: true });
  cpSync(join(PROJECT_ROOT, "hooks", "pet-comment.js"), join(runtimeDir, "hooks", "pet-comment.js"), { force: true });

  // Copy statusline
  cpSync(join(PROJECT_ROOT, "statusline", "pet-status.sh"), join(runtimeDir, "statusline", "pet-status.sh"), { force: true });
  try { execSync(`chmod +x "${join(runtimeDir, "statusline", "pet-status.sh")}"`); } catch {}

  // Copy server
  mkdirSync(join(runtimeDir, "dist"), { recursive: true });
  cpSync(join(PROJECT_ROOT, "dist", "server.js"), join(runtimeDir, "dist", "server.js"), { force: true });

  ok("Runtime files copied to ~/.petsonality/");
}

const RUNTIME_DIR = join(homedir(), ".petsonality");

// ─── Step 4: Hooks ─────────────────────────────────────────────────────────

function installHooks(settings: Record<string, any>) {
  const reactHook = join(RUNTIME_DIR, "hooks", "react.js");
  const commentHook = join(RUNTIME_DIR, "hooks", "pet-comment.js");

  if (!settings.hooks) settings.hooks = {};

  // Resolve node path for hooks
  const nodePath = execSync("which node", { encoding: "utf8" }).trim();

  // PostToolUse — clean up both old (typet) and new (petsonality) entries
  if (!settings.hooks.PostToolUse) settings.hooks.PostToolUse = [];
  settings.hooks.PostToolUse = settings.hooks.PostToolUse.filter(
    (h: any) => !h.hooks?.some((hh: any) => hh.command?.includes("petsonality") || hh.command?.includes("typet")),
  );
  settings.hooks.PostToolUse.push({
    hooks: [{ type: "command", command: `${nodePath} ${reactHook}` }],
  });

  // Stop — same cleanup
  if (!settings.hooks.Stop) settings.hooks.Stop = [];
  settings.hooks.Stop = settings.hooks.Stop.filter(
    (h: any) => !h.hooks?.some((hh: any) => hh.command?.includes("petsonality") || hh.command?.includes("typet")),
  );
  settings.hooks.Stop.push({
    hooks: [{ type: "command", command: `${nodePath} ${commentHook}` }],
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
  const { diagnosePatch, applyPatch, autoUpgrade } = await import("./openclaw-patch.ts");
  const diag = diagnosePatch();

  if (diag.status === "not-installed") return;

  info("OpenClaw detected");

  const ocConfigPath = join(homedir(), ".openclaw", "openclaw.json");
  let ocConfig: Record<string, any> = {};
  try { ocConfig = JSON.parse(readFileSync(ocConfigPath, "utf8")); } catch { /* fresh */ }

  // Register MCP server in OpenClaw config
  const ocNodePath = execSync("which node", { encoding: "utf8" }).trim();
  const ocServerPath = join(RUNTIME_DIR, "dist", "server.js");
  if (!ocConfig.mcp) ocConfig.mcp = {};
  if (!ocConfig.mcp.servers) ocConfig.mcp.servers = {};
  ocConfig.mcp.servers["petsonality"] = {
    command: ocNodePath,
    args: [ocServerPath],
    env: {
      PETSONALITY_HOST: "openclaw",
    },
  };
  ok("MCP server registered in OpenClaw config (with host env)");

  // StatusLine: decide based on three-state detection
  const scriptPath = join(RUNTIME_DIR, "statusline", "pet-status.sh");

  switch (diag.status) {
    case "native": {
      // PR merged — use native config, clean up old patch artifacts
      if (!ocConfig.ui) ocConfig.ui = {};
      ocConfig.ui.statusLine = {
        command: scriptPath,
        refreshInterval: 1000,
      };
      ok("OpenClaw has native statusLine support — using config");
      const upgrade = autoUpgrade();
      if (upgrade.upgraded) ok(upgrade.message);
      break;
    }
    case "patched": {
      // Already patched — nothing to do
      ok("Patch already active");
      break;
    }
    case "stale": {
      // OpenClaw updated and removed our patch — re-apply
      warn("OpenClaw updated — patch was removed, re-applying...");
      const result = applyPatch(scriptPath);
      if (result.success) ok(result.message);
      else warn(result.message);
      break;
    }
    case "unpatched": {
      // Fresh OpenClaw without native support — apply patch
      info("Applying temporary statusLine patch...");
      warn("This is a compatibility patch until OpenClaw merges statusLine support");
      const result = applyPatch(scriptPath);
      if (result.success) ok(result.message);
      else warn(result.message);
      break;
    }
  }

  // Write OpenClaw config
  try {
    writeFileSync(ocConfigPath, JSON.stringify(ocConfig, null, 2));
  } catch {
    warn("Could not write OpenClaw config");
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

const hosts = detectHosts();

// ─── Copy runtime files to stable paths ────────────────────────────────────
installRuntimeFiles();

// ─── Claude Code installation ──────────────────────────────────────────────
if (hosts.claude) {
  info("Installing for Claude Code...\n");
  const settings = loadSettings();
  installMcp();
  installSkill();
  installStatusLine(settings);
  installHooks(settings);
  ensurePermissions(settings);
  saveSettings(settings);
} else {
  info("Claude Code not detected — skipping Claude-specific setup");
}

// ─── Build reactions pool (needed by both hosts) ───────────────────────────
try {
  execSync("bun run build:reactions", { cwd: PROJECT_ROOT, stdio: "inherit" });
} catch {
  warn("Could not build reactions pool — hooks will use fallback reactions");
}

// ─── OpenClaw installation ─────────────────────────────────────────────────
await installOpenClaw();

const hostNames = [];
if (hosts.claude) hostNames.push("Claude Code");
if (hosts.openclaw) hostNames.push("OpenClaw");

console.log(`
${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}
${GREEN}  Done! Restart ${hostNames.join(" / ")} and type /pet${NC}
${GREEN}  Your pet will guide you through adoption.${NC}
${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}

${DIM}  /pet          adopt or show your pet
  /pet pet      interact with your pet
  /pet off      mute reactions
  /pet on       unmute reactions${NC}
`);
