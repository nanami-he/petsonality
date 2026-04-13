#!/usr/bin/env node
/**
 * petsonality Stop hook — extracts <!-- pet: ... --> comments (Node.js version)
 *
 * Claude writes: <!-- pet: *歪头* 那个 error handler 少了 finally -->
 * This hook extracts it and updates the status line bubble.
 *
 * Replaces pet-comment.sh — no jq, no python3 dependency.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const STATE_DIR = join(homedir(), ".petsonality");
const SID = (process.env.TMUX_PANE || "default").replace(/^%/, "");
const STATUS_FILE = join(STATE_DIR, "status.json");
const PET_FILE = join(STATE_DIR, "pet.json");
const COOLDOWN_FILE = join(STATE_DIR, `.last_speak.${SID}`);
const REACTION_FILE = join(STATE_DIR, `reaction.${SID}.json`);

// ─── CJK display width (same as react.js) ───────────────────────────────────

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
  try { return (process.stdout.columns || 80) > 40 ? process.stdout.columns : 80; }
  catch { return 80; }
}

// ─── Main ───────────────────────────────────────────────────────────────────

function main() {
  // Read stdin (hook input)
  let input = "";
  try { input = readFileSync(0, "utf8"); } catch { process.exit(0); }

  // Exit if no status file
  if (!existsSync(STATUS_FILE)) process.exit(0);

  // Parse hook input
  let hookData;
  try { hookData = JSON.parse(input); } catch { process.exit(0); }

  const msg = hookData?.last_assistant_message || "";
  if (!msg) process.exit(0);

  // Extract <!-- pet: ... --> comment
  const match = msg.match(/<!--\s*pet:\s*(.*?)\s*-->/s);
  if (!match) process.exit(0);
  const comment = match[1].trim();
  if (!comment) process.exit(0);

  // Cooldown check
  const pet = readJSON(PET_FILE);
  const cdRange = pet?.cooldownRange || [1, 2];
  const cdMin = cdRange[0] * 60;
  const cdMax = cdRange[1] * 60;
  const cooldown = cdMin + Math.floor(Math.random() * Math.max(cdMax - cdMin, 30));

  try {
    const last = parseInt(readFileSync(COOLDOWN_FILE, "utf8").trim(), 10);
    if (!isNaN(last)) {
      const elapsed = Math.floor(Date.now() / 1000) - last;
      if (elapsed < cooldown) process.exit(0);
    }
  } catch { /* no file = can speak */ }

  // Write cooldown
  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(COOLDOWN_FILE, String(Math.floor(Date.now() / 1000)), { mode: 0o600 });

  // Update status.json
  const status = readJSON(STATUS_FILE);
  if (status) {
    status.reaction = comment;
    writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2), { mode: 0o600 });
  }

  // Wrap text for bubble
  const cols = getTermCols();
  let wrapW = cols - 26;
  if (wrapW < 20) wrapW = 20;
  if (wrapW > 60) wrapW = 60;

  const wrap = wrapText(comment, wrapW, 4);

  const state = {
    reaction: comment,
    wrapped: wrap.lines,
    widths: wrap.widths,
    maxWidth: wrap.maxWidth,
    timestamp: Date.now(),
    reason: "turn",
  };

  writeFileSync(REACTION_FILE, JSON.stringify(state), { mode: 0o600 });
}

main();
