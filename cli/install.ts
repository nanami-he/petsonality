/**
 * petsonality installer
 *
 * Registers: MCP server (in ~/.claude.json), skill, hooks, status line (in settings.json)
 * Checks: bun, jq, ~/.claude/ directory
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync } from "fs";
import { execSync } from "child_process";
import { join } from "path";
import { homedir, platform } from "os";
import { findOpenClawTuiFile } from "./openclaw-patch.ts";
import { whichSync } from "./which.ts";
import { formatHookCommand } from "./hook-command.ts";
import { findPackageRoot } from "./find-package-root.ts";
import { statusLineConfigForPlatform, formatStatusLineCommand } from "./statusline-config.ts";
import { createInterface } from "readline/promises";
import { stdin as input, stdout as output } from "process";
import {
  findPetsonalityHookEntries,
  formatReplacementPreview,
  statusLineReplacementPreview,
} from "./install-transparency.ts";

const CURRENT_PLATFORM = platform();
const IS_WIN = CURRENT_PLATFORM === "win32";

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
const PROJECT_ROOT = findPackageRoot(import.meta.url);

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

async function confirmChange(title: string, existing: unknown, next: unknown): Promise<boolean> {
  console.log("");
  console.log(formatReplacementPreview(`${YELLOW}${title}${NC}`, { existing, next }));

  if (process.env.PETSONALITY_ASSUME_YES === "1") {
    info("PETSONALITY_ASSUME_YES=1 set — continuing");
    return true;
  }
  if (!input.isTTY) {
    warn("Non-interactive install — continuing for backwards compatibility");
    return true;
  }

  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question("Replace this config? [y/N] ");
    return answer.trim().toLowerCase() === "y" || answer.trim().toLowerCase() === "yes";
  } finally {
    rl.close();
  }
}

// ─── Preflight checks ──────────────────────────────────────────────────────

function detectHosts(): { claude: boolean; openclaw: boolean } {
  const claude = existsSync(CLAUDE_DIR) && existsSync(join(homedir(), ".claude.json"));
  let openclaw = false;
  try {
    openclaw = !!findOpenClawTuiFile();
  } catch {
    // Fallback if openclaw-patch helper throws — check PATH cross-platform
    openclaw = !!whichSync("openclaw");
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

  // jq is optional for the Unix bash status line. The Windows PowerShell status
  // line uses ConvertFrom-Json and does not need jq.
  if (IS_WIN) {
    ok("PowerShell status line available (no jq required on Windows)");
  } else {
    try {
      execSync("jq --version", { stdio: "ignore" });
      ok("jq found (used by status line)");
    } catch {
      warn("jq not found — status line bubbles will be limited");
      info("Install: brew install jq (optional)");
    }
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
  // process.execPath is the absolute path of the node binary running this script —
  // always correct, no shell-out needed (works on Windows too).
  const nodePath = process.execPath;
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

async function installStatusLine(settings: Record<string, any>) {
  const nextStatusLine = statusLineConfigForPlatform(CURRENT_PLATFORM, RUNTIME_DIR);
  const preview = statusLineReplacementPreview(settings.statusLine, nextStatusLine);
  if (preview) {
    warn("Existing non-petsonality statusLine found.");
    const confirmed = await confirmChange("Petsonality statusLine replacement", preview.existing, preview.next);
    if (!confirmed) {
      warn("Skipped status line configuration at your request");
      return;
    }
    mkdirSync(join(homedir(), ".petsonality"), { recursive: true });
    writeFileSync(join(homedir(), ".petsonality", "statusline.bak"), JSON.stringify(settings.statusLine, null, 2));
    warn("Old config backed up in ~/.petsonality/statusline.bak");
  }
  settings.statusLine = nextStatusLine;
  ok(IS_WIN ? "PowerShell status line configured" : "Status line configured");
  if (IS_WIN) {
    info("If Claude Code does not render the status line, accept the project trust dialog and restart Claude Code.");
  }
}

// ─── Step 3b: Copy runtime files to ~/.petsonality/ (stable paths) ─────────

function installRuntimeFiles() {
  const runtimeDir = join(homedir(), ".petsonality");
  mkdirSync(join(runtimeDir, "hooks"), { recursive: true });
  mkdirSync(join(runtimeDir, "statusline"), { recursive: true });

  // Copy hooks
  cpSync(join(PROJECT_ROOT, "hooks", "react.js"), join(runtimeDir, "hooks", "react.js"), { force: true });
  cpSync(join(PROJECT_ROOT, "hooks", "pet-comment.js"), join(runtimeDir, "hooks", "pet-comment.js"), { force: true });

  // Copy statusline scripts and generated art data
  cpSync(join(PROJECT_ROOT, "statusline", "pet-status.sh"), join(runtimeDir, "statusline", "pet-status.sh"), { force: true });
  cpSync(join(PROJECT_ROOT, "statusline", "pet-status.ps1"), join(runtimeDir, "statusline", "pet-status.ps1"), { force: true });
  cpSync(join(PROJECT_ROOT, "statusline", "pet-art.json"), join(runtimeDir, "statusline", "pet-art.json"), { force: true });
  try { execSync(`chmod +x "${join(runtimeDir, "statusline", "pet-status.sh")}"`); } catch {}

  // Copy server
  mkdirSync(join(runtimeDir, "dist"), { recursive: true });
  cpSync(join(PROJECT_ROOT, "dist", "server.js"), join(runtimeDir, "dist", "server.js"), { force: true });

  ok("Runtime files copied to ~/.petsonality/");
}

const RUNTIME_DIR = join(homedir(), ".petsonality");

// ─── Step 4: Hooks ─────────────────────────────────────────────────────────

async function replacePetsonalityHookEntries(settings: Record<string, any>, hookType: "PostToolUse" | "Stop", nextEntry: Record<string, any>): Promise<boolean> {
  if (!settings.hooks[hookType]) settings.hooks[hookType] = [];

  const existingEntries = findPetsonalityHookEntries(settings.hooks[hookType]);
  if (existingEntries.length > 0) {
    const confirmed = await confirmChange(`Petsonality ${hookType} hook replacement`, existingEntries, nextEntry);
    if (!confirmed) {
      warn(`Skipped ${hookType} hook replacement at your request`);
      return false;
    }
  }

  settings.hooks[hookType] = settings.hooks[hookType].filter(
    (h: any) => !h.hooks?.some((hh: any) => hh.command?.includes("petsonality") || hh.command?.includes("typet")),
  );
  settings.hooks[hookType].push(nextEntry);
  return true;
}

async function installHooks(settings: Record<string, any>) {
  const reactHook = join(RUNTIME_DIR, "hooks", "react.js");
  const commentHook = join(RUNTIME_DIR, "hooks", "pet-comment.js");

  if (!settings.hooks) settings.hooks = {};

  // Resolve node path for hooks (cross-platform; same node that's running this installer).
  const nodePath = process.execPath;

  const postToolUseEntry = {
    hooks: [{ type: "command", command: formatHookCommand(nodePath, reactHook) }],
  };

  const stopEntry = {
    hooks: [{ type: "command", command: formatHookCommand(nodePath, commentHook) }],
  };

  const postToolUseInstalled = await replacePetsonalityHookEntries(settings, "PostToolUse", postToolUseEntry);
  const stopInstalled = await replacePetsonalityHookEntries(settings, "Stop", stopEntry);

  if (postToolUseInstalled || stopInstalled) ok("Hooks registered: PostToolUse + Stop");
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

  // Register MCP server in OpenClaw config (cross-platform node lookup).
  const ocNodePath = process.execPath;
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
  const statusLineCommand = formatStatusLineCommand(CURRENT_PLATFORM, RUNTIME_DIR);

  switch (diag.status) {
    case "native": {
      // PR merged — use native config, clean up old patch artifacts
      if (!ocConfig.ui) ocConfig.ui = {};
      ocConfig.ui.statusLine = {
        command: statusLineCommand,
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
      const result = applyPatch(statusLineCommand);
      if (result.success) ok(result.message);
      else warn(result.message);
      break;
    }
    case "unpatched": {
      // Fresh OpenClaw without native support — apply patch
      info("Applying temporary statusLine patch...");
      warn("This is a compatibility patch until OpenClaw merges statusLine support");
      const result = applyPatch(statusLineCommand);
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
  await installStatusLine(settings);
  await installHooks(settings);
  ensurePermissions(settings);
  saveSettings(settings);
} else {
  info("Claude Code not detected — skipping Claude-specific setup");
}

// ─── Install reactions pool (shipped as a build artifact in dist/) ─────────
// Previously this ran `bun run build:reactions` at install time, which silently
// failed for every npx user because scripts/ + server/ aren't in the published
// tarball — every user ended up on fallback reactions. Now we ship the
// pre-built JSON in dist/ and just copy it into place. No bun runtime needed.
try {
  const builtPool = join(PROJECT_ROOT, "dist", "reactions-pool.json");
  const runtimePool = join(RUNTIME_DIR, "reactions-pool.json");
  if (existsSync(builtPool)) {
    cpSync(builtPool, runtimePool, { force: true });
    ok("Reactions pool installed (638/lang)");
  } else {
    warn("dist/reactions-pool.json missing — hooks will use fallback reactions");
    info("(this should not happen for npm-installed copies; rebuild with `bun run build:reactions` if developing locally)");
  }
} catch (e) {
  warn(`Could not install reactions pool — hooks will use fallback reactions (${(e as Error).message})`);
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
