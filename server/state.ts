/**
 * State management — reads/writes pet data to ~/.mbti-pet/
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type { Pet, AnimalId } from "./engine.ts";

const STATE_DIR = join(homedir(), ".mbti-pet");
const PET_FILE = join(STATE_DIR, "pet.json");
const CONFIG_FILE = join(STATE_DIR, "config.json");

// Session ID: sanitized tmux pane number, or "default" outside tmux
function sessionId(): string {
  const pane = process.env.TMUX_PANE;
  if (!pane) return "default";
  return pane.replace(/^%/, "");
}

function reactionFile(): string {
  return join(STATE_DIR, `reaction.${sessionId()}.json`);
}

function ensureDir(): void {
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
    // 20s for tool reads (pet_show). Statusline has shorter 4s TTL in pet-status.sh.
    if (Date.now() - data.timestamp > 10_000) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveReaction(reaction: string, reason: string): void {
  ensureDir();
  const state: ReactionState = { reaction, timestamp: Date.now(), reason };
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
  writeFileSync(statusPath, JSON.stringify(state), { mode: 0o600 });
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
