#!/usr/bin/env bun
/**
 * petsonality backup — snapshot all petsonality related state
 *
 * Usage:
 *   bun run backup                 Create a new snapshot
 *   bun run backup list            List all backups
 *   bun run backup show <ts>       Show what's in a backup
 *   bun run backup restore         Restore the latest backup
 *   bun run backup restore <ts>    Restore a specific backup
 *   bun run backup delete <ts>     Delete a specific backup
 *
 * Backups are stored in ~/.petsonality/backups/YYYY-MM-DD-HHMMSS/
 *
 * What gets backed up:
 *   - ~/.claude/settings.json (full file)
 *   - ~/.claude.json mcpServers["petsonality"] block (only our entry)
 *   - ~/.claude/skills/pet/SKILL.md
 *   - ~/.petsonality/pet.json
 *   - ~/.petsonality/status.json
 *   - ~/.petsonality/reaction.*.json
 */

import {
  readFileSync, writeFileSync, mkdirSync, existsSync,
  readdirSync, statSync, rmSync, copyFileSync,
} from "fs";
import { join } from "path";
import { homedir } from "os";

const HOME = homedir();
const BACKUPS_DIR = join(HOME, ".petsonality", "backups");
const SETTINGS = join(HOME, ".claude", "settings.json");
const CLAUDE_JSON = join(HOME, ".claude.json");
const SKILL = join(HOME, ".claude", "skills", "pet", "SKILL.md");
const STATE_DIR = existsSync(join(HOME, ".petsonality")) ? join(HOME, ".petsonality") : join(HOME, ".mbti-pet");

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const NC = "\x1b[0m";

function ok(msg: string) { console.log(`${GREEN}✓${NC}  ${msg}`); }
function info(msg: string) { console.log(`${CYAN}→${NC}  ${msg}`); }
function warn(msg: string) { console.log(`${YELLOW}⚠${NC}  ${msg}`); }
function err(msg: string) { console.log(`${RED}✗${NC}  ${msg}`); }

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function tryRead(path: string): string | null {
  try { return readFileSync(path, "utf8"); } catch { return null; }
}

function listBackups(): string[] {
  if (!existsSync(BACKUPS_DIR)) return [];
  return readdirSync(BACKUPS_DIR)
    .filter(f => /^\d{4}-\d{2}-\d{2}-\d{6}$/.test(f))
    .filter(f => statSync(join(BACKUPS_DIR, f)).isDirectory())
    .sort();
}

// ─── Create backup ──────────────────────────────────────────────────────────

function createBackup(): string {
  const ts = timestamp();
  const dir = join(BACKUPS_DIR, ts);
  mkdirSync(dir, { recursive: true });

  const manifest: Record<string, any> = { timestamp: ts, files: [] };

  // 1. settings.json
  const settings = tryRead(SETTINGS);
  if (settings) {
    writeFileSync(join(dir, "settings.json"), settings);
    manifest.files.push("settings.json");
    ok(`Backed up: ~/.claude/settings.json`);
  } else {
    warn(`Skipped: ~/.claude/settings.json (not found)`);
  }

  // 2. claude.json mcpServers["petsonality"] (or legacy "typet")
  const claudeJsonRaw = tryRead(CLAUDE_JSON);
  if (claudeJsonRaw) {
    try {
      const claudeJson = JSON.parse(claudeJsonRaw);
      const ourMcp = claudeJson.mcpServers?.["petsonality"] ?? claudeJson.mcpServers?.["typet"];
      if (ourMcp) {
        writeFileSync(join(dir, "mcpserver.json"), JSON.stringify(ourMcp, null, 2));
        manifest.files.push("mcpserver.json");
        ok(`Backed up: ~/.claude.json → mcpServers`);
      } else {
        warn(`Skipped: ~/.claude.json mcpServers (not registered)`);
      }
    } catch {
      err(`Failed to parse ~/.claude.json`);
    }
  }

  // 3. SKILL.md
  const skill = tryRead(SKILL);
  if (skill) {
    writeFileSync(join(dir, "SKILL.md"), skill);
    manifest.files.push("SKILL.md");
    ok(`Backed up: ~/.claude/skills/pet/SKILL.md`);
  } else {
    warn(`Skipped: ~/.claude/skills/pet/SKILL.md (not found)`);
  }

  // 4-6. state files
  const stateDestDir = join(dir, "state");
  mkdirSync(stateDestDir, { recursive: true });
  const stateFiles = ["pet.json", "status.json"];
  // Also grab reaction files
  if (existsSync(STATE_DIR)) {
    for (const f of readdirSync(STATE_DIR)) {
      if (f.startsWith("reaction.") && f.endsWith(".json")) stateFiles.push(f);
    }
  }
  for (const f of stateFiles) {
    const src = join(STATE_DIR, f);
    if (existsSync(src)) {
      copyFileSync(src, join(stateDestDir, f));
      manifest.files.push(`state/${f}`);
      ok(`Backed up: ${f}`);
    }
  }

  writeFileSync(join(dir, "manifest.json"), JSON.stringify(manifest, null, 2));

  return ts;
}

// ─── List backups ───────────────────────────────────────────────────────────

function cmdList() {
  const backups = listBackups();
  if (backups.length === 0) {
    info("No backups found.");
    info(`Run '${BOLD}bun run backup${NC}' to create one.`);
    return;
  }
  console.log(`\n${BOLD}petsonality backups${NC}\n`);
  for (const ts of backups) {
    const manifestPath = join(BACKUPS_DIR, ts, "manifest.json");
    const manifest = tryRead(manifestPath);
    let count = "?";
    if (manifest) {
      try {
        count = String(JSON.parse(manifest).files?.length ?? 0);
      } catch {}
    }
    const isLatest = ts === backups[backups.length - 1];
    const tag = isLatest ? `${GREEN}(latest)${NC}` : "";
    console.log(`  ${CYAN}${ts}${NC}  ${DIM}${count} files${NC}  ${tag}`);
  }
  console.log("");
}

// ─── Show backup contents ───────────────────────────────────────────────────

function cmdShow(ts: string) {
  const dir = join(BACKUPS_DIR, ts);
  if (!existsSync(dir)) {
    err(`Backup not found: ${ts}`);
    process.exit(1);
  }
  const manifest = tryRead(join(dir, "manifest.json"));
  if (!manifest) {
    err("manifest.json missing");
    process.exit(1);
  }
  const data = JSON.parse(manifest);
  console.log(`\n${BOLD}Backup ${ts}${NC}\n`);
  console.log(`  ${DIM}Files:${NC}`);
  for (const f of data.files) {
    console.log(`    - ${f}`);
  }
  console.log("");
}

// ─── Restore backup ─────────────────────────────────────────────────────────

function restoreBackup(ts: string) {
  const dir = join(BACKUPS_DIR, ts);
  if (!existsSync(dir)) {
    err(`Backup not found: ${ts}`);
    process.exit(1);
  }

  info(`Restoring backup ${ts}...\n`);

  // 1. settings.json — overwrite
  const settingsBak = join(dir, "settings.json");
  if (existsSync(settingsBak)) {
    mkdirSync(join(HOME, ".claude"), { recursive: true });
    copyFileSync(settingsBak, SETTINGS);
    ok("Restored: ~/.claude/settings.json");
  }

  // 2. claude.json mcpServers — merge our entry back in
  const mcpBak = join(dir, "mcpserver.json");
  if (existsSync(mcpBak)) {
    const ourMcp = JSON.parse(readFileSync(mcpBak, "utf8"));
    let claudeJson: Record<string, any> = {};
    try {
      claudeJson = JSON.parse(readFileSync(CLAUDE_JSON, "utf8"));
    } catch { /* empty */ }
    if (!claudeJson.mcpServers) claudeJson.mcpServers = {};
    claudeJson.mcpServers["petsonality"] = ourMcp;
    writeFileSync(CLAUDE_JSON, JSON.stringify(claudeJson, null, 2));
    ok('Restored: ~/.claude.json → mcpServers["petsonality"]');
  }

  // 3. SKILL.md
  const skillBak = join(dir, "SKILL.md");
  if (existsSync(skillBak)) {
    mkdirSync(join(HOME, ".claude", "skills", "pet"), { recursive: true });
    copyFileSync(skillBak, SKILL);
    ok("Restored: ~/.claude/skills/pet/SKILL.md");
  }

  // 4. state files (check both new "state/" and legacy "typet/" subdirs)
  const stateSubDir = existsSync(join(dir, "state")) ? join(dir, "state") : join(dir, "typet");
  if (existsSync(stateSubDir)) {
    mkdirSync(STATE_DIR, { recursive: true });
    for (const f of readdirSync(stateSubDir)) {
      copyFileSync(join(stateSubDir, f), join(STATE_DIR, f));
      ok(`Restored: ${f}`);
    }
  }

  console.log(`\n${GREEN}Restore complete.${NC} Restart Claude Code to apply.\n`);
}

// ─── Delete backup ──────────────────────────────────────────────────────────

function cmdDelete(ts: string) {
  const dir = join(BACKUPS_DIR, ts);
  if (!existsSync(dir)) {
    err(`Backup not found: ${ts}`);
    process.exit(1);
  }
  rmSync(dir, { recursive: true });
  ok(`Deleted backup ${ts}`);
}

// ─── Main ───────────────────────────────────────────────────────────────────

const action = process.argv[2] || "create";
const arg = process.argv[3];

switch (action) {
  case "create":
  case undefined: {
    console.log(`\n${BOLD}Creating petsonality backup...${NC}\n`);
    const ts = createBackup();
    console.log(`\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}`);
    console.log(`${GREEN}  Backup created: ${ts}${NC}`);
    console.log(`${GREEN}  Location: ${BACKUPS_DIR}/${ts}${NC}`);
    console.log(`${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n`);
    console.log(`${DIM}  Restore with: bun run backup restore${NC}`);
    console.log(`${DIM}  Or:           bun run backup restore ${ts}${NC}\n`);
    break;
  }

  case "list":
  case "ls":
    cmdList();
    break;

  case "show": {
    if (!arg) {
      err("Usage: bun run backup show <timestamp>");
      process.exit(1);
    }
    cmdShow(arg);
    break;
  }

  case "restore": {
    let ts = arg;
    if (!ts) {
      const all = listBackups();
      if (all.length === 0) {
        err("No backups to restore");
        process.exit(1);
      }
      ts = all[all.length - 1];
      info(`Restoring latest backup: ${ts}`);
    }
    restoreBackup(ts);
    break;
  }

  case "delete":
  case "rm": {
    if (!arg) {
      err("Usage: bun run backup delete <timestamp>");
      process.exit(1);
    }
    cmdDelete(arg);
    break;
  }

  case "--help":
  case "-h":
    console.log(`
${BOLD}petsonality backup${NC} — snapshot and restore all petsonality state

${BOLD}Commands:${NC}
  bun run backup                 Create a new snapshot
  bun run backup list            List all backups
  bun run backup show <ts>       Show what's in a backup
  bun run backup restore         Restore the latest backup
  bun run backup restore <ts>    Restore a specific backup
  bun run backup delete <ts>     Delete a specific backup

${BOLD}What gets backed up:${NC}
  - ~/.claude/settings.json (full)
  - ~/.claude.json mcpServers["petsonality"] (only our entry)
  - ~/.claude/skills/pet/SKILL.md
  - ~/.petsonality/pet.json
  - ~/.petsonality/status.json
  - ~/.petsonality/reaction.*.json

${BOLD}Backup location:${NC}
  ${BACKUPS_DIR}/<timestamp>/
`);
    break;

  default:
    err(`Unknown action: ${action}`);
    console.log(`Run 'bun run backup --help' for usage.`);
    process.exit(1);
}
