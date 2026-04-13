#!/usr/bin/env node
/**
 * petsonality PostToolUse hook — companion rhythm (Node.js version)
 *
 * Triggers on: errors, test failures, large diffs, milestones, AND daily events.
 * Reads animal-specific reactions from ~/.petsonality/reactions-pool.json
 * Frequency controlled by talkLevel (chatty/moderate/quiet/silent).
 *
 * Replaces react.sh — no jq, no python3 dependency.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const STATE_DIR = join(homedir(), ".petsonality");
const SID = (process.env.TMUX_PANE || "default").replace(/^%/, "");
const REACTION_FILE = join(STATE_DIR, `reaction.${SID}.json`);
const PET_FILE = join(STATE_DIR, "pet.json");
const COOLDOWN_FILE = join(STATE_DIR, `.last_speak.${SID}`);
const STREAK_FILE = join(STATE_DIR, `.silent_streak.${SID}`);
const POOL_FILE = join(STATE_DIR, "reactions-pool.json");

// ─── CJK display width ─────────────────────────────────────────────────────

function charWidth(ch) {
  const code = ch.codePointAt(0) ?? 0;
  if (code < 32 || (code >= 0x7f && code < 0xa0)) return 0;
  if (
    (code >= 0x1100 && code <= 0x115f) ||
    (code >= 0x2e80 && code <= 0xa4cf && code !== 0x303f) ||
    (code >= 0xac00 && code <= 0xd7a3) ||
    (code >= 0xf900 && code <= 0xfaff) ||
    (code >= 0xfe10 && code <= 0xfe19) ||
    (code >= 0xfe30 && code <= 0xfe6f) ||
    (code >= 0xff00 && code <= 0xff60) ||
    (code >= 0xffe0 && code <= 0xffe6) ||
    (code >= 0x20000 && code <= 0x2fa1f) ||
    (code >= 0x1f300 && code <= 0x1f9ff) ||
    (code >= 0x1fa00 && code <= 0x1faff)
  ) return 2;
  return 1;
}

function stringWidth(str) {
  return Array.from(str.replace(/\x1b\[[0-9;]*m/g, ""))
    .reduce((sum, ch) => sum + charWidth(ch), 0);
}

function wrapText(text, maxW, maxLines) {
  const raw = [];
  let cur = "";
  let w = 0;
  for (const ch of text) {
    if (ch === "\n") { raw.push(cur); cur = ""; w = 0; continue; }
    const cw = charWidth(ch);
    if (cur && w + cw > maxW) { raw.push(cur); cur = ch; w = cw; }
    else { cur += ch; w += cw; }
  }
  if (cur || raw.length === 0) raw.push(cur);

  let lines = raw;
  if (lines.length > maxLines) {
    let last = lines[maxLines - 1];
    while (stringWidth(last) >= maxW) last = last.slice(0, -1);
    lines = [...lines.slice(0, maxLines - 1), last + "\u2026"];
  }
  const widths = lines.map(l => stringWidth(l));
  const maxWidth = widths.length > 0 ? Math.max(...widths) : 0;
  return { lines, widths, maxWidth };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function readJSON(path) {
  try { return JSON.parse(readFileSync(path, "utf8")); }
  catch { return null; }
}

function getTermCols() {
  // Walk process tree to find a TTY with width
  try {
    const cols = process.stdout.columns || 80;
    return cols > 40 ? cols : 80;
  } catch { return 80; }
}

// ─── Frequency parameters by talkLevel ──────────────────────────────────────

const FREQ = {
  chatty:   { daily: 15, milestone: 30, streakMax: 7,  cdMin: 30,  cdMax: 75  },
  moderate: { daily: 10, milestone: 20, streakMax: 10, cdMin: 60,  cdMax: 120 },
  quiet:    { daily: 5,  milestone: 12, streakMax: 14, cdMin: 120, cdMax: 240 },
  silent:   { daily: 3,  milestone: 8,  streakMax: 18, cdMin: 180, cdMax: 360 },
};

// ─── Main ───────────────────────────────────────────────────────────────────

function main() {
  // Read stdin (hook input)
  let input = "";
  try { input = readFileSync(0, "utf8"); } catch { process.exit(0); }

  // Exit if no pet or no pool
  const pet = readJSON(PET_FILE);
  if (!pet?.petId) process.exit(0);

  const pool = readJSON(POOL_FILE);
  if (!pool?.pool) process.exit(0);

  const petId = pet.petId;
  const talkLevel = pool.meta?.[petId]?.talkLevel || "moderate";
  const freq = FREQ[talkLevel] || FREQ.moderate;

  // ─── Cooldown check ───────────────────────────────────────────────────
  const cdRange = Math.max(freq.cdMax - freq.cdMin, 30);
  const cooldown = freq.cdMin + Math.floor(Math.random() * cdRange);

  try {
    const last = parseInt(readFileSync(COOLDOWN_FILE, "utf8").trim(), 10);
    if (!isNaN(last)) {
      const elapsed = Math.floor(Date.now() / 1000) - last;
      if (elapsed < cooldown) process.exit(0);
    }
  } catch { /* no file = can speak */ }

  // ─── Parse tool output ────────────────────────────────────────────────
  let hookData;
  try { hookData = JSON.parse(input); } catch { process.exit(0); }
  const result = hookData?.tool_response || "";
  if (!result) process.exit(0);

  // ─── Silent streak ────────────────────────────────────────────────────
  let streak = 0;
  try { streak = parseInt(readFileSync(STREAK_FILE, "utf8").trim(), 10) || 0; }
  catch { /* no file */ }
  streak++;

  const forceSpeak = streak >= freq.streakMax;

  // ─── Event detection ──────────────────────────────────────────────────
  let reason = "";
  let priority = 0; // 0=daily, 2=milestone, 3=error

  // Priority 3: Errors and failures
  if (/\b[1-9]\d* (failed|failing)\b|tests? failed|^FAIL(ED)?|✗|✘/im.test(result)) {
    reason = "test-fail"; priority = 3;
  } else if (/\berror:|\bexception\b|\btraceback\b|\bpanicked at\b|\bfatal:|exit code [1-9]/im.test(result)) {
    reason = "error"; priority = 3;
  } else if (/^\+.*\d+ insertions|\d+ files? changed/im.test(result)) {
    const m = result.match(/(\d+) insertions/);
    if (m && parseInt(m[1]) > 80) { reason = "large-diff"; priority = 3; }
  }

  // Priority 2: Milestones
  if (priority < 2) {
    if (/\b(0 fail|all pass|tests? passed|✓.*pass)\b|^ok\b.*tests?/im.test(result)) {
      reason = "turn"; priority = 2;
    } else if (/create mode|^\[.*\]\s/m.test(result)) {
      reason = "turn"; priority = 2;
    }
  }

  // Priority 1: Daily
  if (priority === 0) {
    reason = "turn"; priority = 1;
  }

  // ─── Probability gate ─────────────────────────────────────────────────
  let shouldSpeak = false;

  if (forceSpeak) {
    shouldSpeak = true;
  } else if (priority >= 3) {
    shouldSpeak = true;
  } else if (priority >= 2) {
    shouldSpeak = Math.random() * 100 < freq.milestone;
  } else {
    shouldSpeak = Math.random() * 100 < freq.daily;
  }

  if (!shouldSpeak) {
    // Update streak and exit
    mkdirSync(STATE_DIR, { recursive: true });
    writeFileSync(STREAK_FILE, String(streak), { mode: 0o600 });
    process.exit(0);
  }

  // ─── Pick reaction from pool ──────────────────────────────────────────
  const animalPool = pool.pool[petId]?.[reason] || pool.pool.labrador?.[reason] || [];
  let reaction = "";
  if (animalPool.length > 0) {
    reaction = animalPool[Math.floor(Math.random() * animalPool.length)];
  }
  if (!reaction) reaction = "*看了看你*";

  // ─── Write reaction ───────────────────────────────────────────────────
  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(COOLDOWN_FILE, String(Math.floor(Date.now() / 1000)), { mode: 0o600 });
  writeFileSync(STREAK_FILE, "0", { mode: 0o600 });

  // Wrap text for bubble
  const cols = getTermCols();
  let wrapW = cols - 26;
  if (wrapW < 20) wrapW = 20;
  if (wrapW > 60) wrapW = 60;

  const wrap = wrapText(reaction, wrapW, 4);

  const state = {
    reaction,
    wrapped: wrap.lines,
    widths: wrap.widths,
    maxWidth: wrap.maxWidth,
    timestamp: Date.now(),
    reason,
  };

  writeFileSync(REACTION_FILE, JSON.stringify(state), { mode: 0o600 });

  // Update status.json
  const statusPath = join(STATE_DIR, "status.json");
  try {
    const status = readJSON(statusPath);
    if (status) {
      status.reaction = reaction;
      writeFileSync(statusPath, JSON.stringify(status, null, 2), { mode: 0o600 });
    }
  } catch { /* skip */ }
}

main();
