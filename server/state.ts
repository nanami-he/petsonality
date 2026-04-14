/**
 * State management — reads/writes pet data to ~/.petsonality/
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync, renameSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type { Pet, AnimalId } from "./engine.ts";
import { charWidth, stringWidth } from "./utils.ts";

const STATE_DIR = join(homedir(), ".petsonality");
const PET_FILE = join(STATE_DIR, "pet.json");
const CONFIG_FILE = join(STATE_DIR, "config.json");

// Session ID: PETSONALITY_SID (set by installer for OpenClaw), TMUX_PANE, or "default"
function sessionId(): string {
  const sid = process.env.PETSONALITY_SID;
  if (sid) return sid.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const pane = process.env.TMUX_PANE;
  if (pane) return pane.replace(/^%/, "");
  return "default";
}

function reactionFile(): string {
  return join(STATE_DIR, `reaction.${sessionId()}.json`);
}

function ensureDir(): void {
  // Auto-migrate from old directory name
  const oldDir = join(homedir(), ".mbti-pet");
  if (!existsSync(STATE_DIR) && existsSync(oldDir)) {
    try { renameSync(oldDir, STATE_DIR); } catch { /* another process already migrated */ }
  }
  if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true });
}

// ─── Pet persistence ───────────────────────────────────────────────────────

export function loadPet(): Pet | null {
  try {
    return JSON.parse(readFileSync(PET_FILE, "utf8"));
  } catch {
    return null;
  }
}

export function savePet(pet: Pet): void {
  ensureDir();
  writeFileSync(PET_FILE, JSON.stringify(pet, null, 2), { mode: 0o600 });
}

export function deletePet(): void {
  try {
    if (existsSync(PET_FILE)) unlinkSync(PET_FILE);
  } catch { /* noop */ }
}

// ─── Reaction state (for status line) ───────────────────────────────────────

export interface ReactionState {
  reaction: string;
  timestamp: number;
  reason: string;
}

export function loadReaction(): ReactionState | null {
  try {
    const data: ReactionState = JSON.parse(readFileSync(reactionFile(), "utf8"));
    // 10s TTL for MCP tool reads (pet_show). Statusline has shorter 4s TTL in pet-status.sh.
    if (Date.now() - data.timestamp > 10_000) return null;
    return data;
  } catch {
    return null;
  }
}

/** CJK-aware wrap — mirrors hooks/wrap.py logic */
function wrapText(text: string, maxW: number, maxLines: number): { lines: string[]; widths: number[]; maxWidth: number } {
  const raw: string[] = [];
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
    lines = [...lines.slice(0, maxLines - 1), last + "…"];
  }
  const widths = lines.map((l) => stringWidth(l));
  const maxWidth = widths.length > 0 ? Math.max(...widths) : 0;
  return { lines, widths, maxWidth };
}

// ─── Cooldown ──────────────────────────────────────────────────────────────
// Unlike hooks (which roll random cooldown on each check), the MCP tool
// fixes the next-allowed-at timestamp when the pet speaks. This avoids
// non-deterministic "roll again each check" behavior in model-driven calls.

function cooldownFile(): string {
  return join(STATE_DIR, `.next_speak.${sessionId()}`);
}

/** Check if cooldown has elapsed. Returns true if pet CAN speak. */
export function checkCooldown(): boolean {
  try {
    const nextAt = parseInt(readFileSync(cooldownFile(), "utf8").trim(), 10);
    if (isNaN(nextAt)) return true;
    return Math.floor(Date.now() / 1000) >= nextAt;
  } catch {
    return true; // no file = never spoke = can speak
  }
}

/** Record that the pet just spoke. Rolls cooldown and writes next-allowed-at. */
export function recordSpeak(cooldownRange: [number, number] = [5, 12]): void {
  ensureDir();
  const [cdMin, cdMax] = cooldownRange;
  const cdRange = Math.max((cdMax - cdMin) * 60, 60);
  const cooldownSec = cdMin * 60 + Math.floor(Math.random() * cdRange);
  const nextAt = Math.floor(Date.now() / 1000) + cooldownSec;
  writeFileSync(cooldownFile(), String(nextAt), { mode: 0o600 });
}

// ─── Hint consumption (P6: model spoke, prevent hook fallback) ─────────────

function hintFile(): string {
  return join(STATE_DIR, `hint.${sessionId()}.json`);
}

export function consumeHint(): void {
  try {
    const data = JSON.parse(readFileSync(hintFile(), "utf8"));
    if (data && !data.consumed) {
      data.consumed = true;
      writeFileSync(hintFile(), JSON.stringify(data), { mode: 0o600 });
    }
  } catch { /* no hint file */ }
}

export function saveReaction(reaction: string, reason: string): void {
  ensureDir();
  // Match hooks: WRAP_W = COLS - 26, clamped [20,60]. Server can't read COLS; use 40 as safe default.
  const wrap = wrapText(reaction, 40, 4);
  const state = {
    reaction,
    timestamp: Date.now(),
    reason,
    wrapped: wrap.lines,
    widths: wrap.widths,
    maxWidth: wrap.maxWidth,
  };
  writeFileSync(reactionFile(), JSON.stringify(state), { mode: 0o600 });
}

// ─── Status line state (compact JSON for the shell script) ──────────────────

export interface StatusState {
  name: string;
  petId: string;
  reaction: string;
  muted: boolean;
}

export function writeStatusState(pet: Pet, reaction?: string, muted?: boolean): void {
  ensureDir();
  const statusPath = join(STATE_DIR, "status.json");

  // Merge with existing state to avoid clearing reaction/muted
  let existing: Partial<StatusState> = {};
  try { existing = JSON.parse(readFileSync(statusPath, "utf8")); } catch { /* fresh */ }

  const state: StatusState = {
    name: pet.petName,
    petId: pet.petId,
    reaction: reaction !== undefined ? reaction : (existing.reaction ?? ""),
    muted: muted !== undefined ? muted : (existing.muted ?? false),
  };
  writeFileSync(statusPath, JSON.stringify(state, null, 2), { mode: 0o600 });
}

// ─── Config persistence ────────────────────────────────────────────────────

export interface PetConfig {
  commentCooldown: number;
  bubbleStyle: "classic" | "round";
  bubblePosition: "top" | "left";
}

const DEFAULT_CONFIG: PetConfig = {
  commentCooldown: 30,
  bubbleStyle: "classic",
  bubblePosition: "left",
};

export function loadConfig(): PetConfig {
  try {
    const data = JSON.parse(readFileSync(CONFIG_FILE, "utf8"));
    return { ...DEFAULT_CONFIG, ...data };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(config: Partial<PetConfig>): PetConfig {
  ensureDir();
  const current = loadConfig();
  const merged = { ...current, ...config };
  writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), { mode: 0o600 });
  return merged;
}
