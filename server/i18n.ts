/**
 * Language detection + i18n routing
 *
 * Auto-detects language from LANG env variable.
 * zh* → Chinese, everything else → English.
 */

import { REACTIONS as REACTIONS_ZH, ANIMAL_REACTIONS as ANIMAL_REACTIONS_ZH, getReaction as getReactionBase } from "./reactions.ts";
import { REACTIONS_EN, ANIMAL_REACTIONS_EN } from "./reactions-en.ts";
import { LAUNCH_PETS as PETS_ZH, getPetById as getPetByIdZh } from "./pets.ts";
import { LAUNCH_PETS as PETS_EN, getPetById as getPetByIdEn } from "./pets-en.ts";
import type { ReactionReason } from "./reactions.ts";
import type { AnimalId } from "./engine.ts";

export type Lang = "zh" | "en";

export function detectLang(): Lang {
  const lang = process.env.LANG || process.env.LC_ALL || process.env.LANGUAGE || "";
  return lang.startsWith("zh") ? "zh" : "en";
}

const lang = detectLang();

// ─── Reactions ──────────────────────────────────────────────────────────────

export function getReaction(
  reason: ReactionReason,
  animalId: AnimalId,
  context?: { line?: number; count?: number; lines?: number },
): string {
  const reactions = lang === "zh" ? REACTIONS_ZH : REACTIONS_EN;
  const animalReactions = lang === "zh" ? ANIMAL_REACTIONS_ZH : ANIMAL_REACTIONS_EN;

  const animalPool = animalReactions[animalId]?.[reason];
  const generalPool = reactions[reason];

  const pool = animalPool && Math.random() < 0.4 ? animalPool : generalPool;
  let reaction = pool[Math.floor(Math.random() * pool.length)];

  if (context?.line) reaction = reaction.replace("{line}", String(context.line));
  if (context?.count) reaction = reaction.replace("{count}", String(context.count));
  if (context?.lines) reaction = reaction.replace("{lines}", String(context.lines));

  return reaction;
}

// ─── Pet profiles ───────────────────────────────────────────────────────────

export function getPetById(id: string) {
  return lang === "zh" ? getPetByIdZh(id) : getPetByIdEn(id);
}

export function getAllPets() {
  return lang === "zh" ? PETS_ZH : PETS_EN;
}

export { lang };
