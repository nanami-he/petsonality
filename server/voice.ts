/**
 * Voice system — 80/20 signature vs AI generation
 * Handles the pet speaking logic and validation
 */

import type { PetProfile } from "./pets.ts";
import { voicePromptTemplate, forbiddenWordsJoiner } from "./messages.ts";

/**
 * Pick a line: 20% from signature pool, 80% returns null (AI should generate)
 */
export function maybeSignatureLine(pet: PetProfile): string | null {
  if (Math.random() < 0.2) {
    const pool = pet.signatureLines;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  return null;
}

/**
 * Validate AI-generated voice against pet constraints.
 * Returns true if the line passes, false if it should be replaced by a signature.
 */
export function validateVoice(text: string, pet: PetProfile): boolean {
  const constraints = pet.voiceConstraints;

  // Strip action descriptions (*xxx*) — they don't count toward length
  const speechOnly = text.replace(/\*[^*]+\*/g, "").trim();

  // Pure-action lines (no speech text) are always valid
  if (speechOnly.length === 0) return true;

  // Strip punctuation for length count
  const cleanText = speechOnly.replace(/[（）()「」""。，！？、：；…—]/g, "").trim();

  if (cleanText.length > constraints.maxLength) return false;
  if (cleanText.length < constraints.minLength) return false;

  // Forbidden words check
  for (const word of constraints.forbiddenWords) {
    if (text.includes(word)) return false;
  }

  return true;
}

/**
 * Get a random fallback line from signature pool
 */
export function fallbackLine(pet: PetProfile): string {
  const pool = pet.signatureLines;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Build the system prompt personality block for this pet (lang-aware via messages.ts).
 */
export function buildPersonalityPrompt(pet: PetProfile, petName: string): string {
  const tpl = voicePromptTemplate();
  const fill = (s: string, params: Record<string, string | number>): string => {
    let out = s;
    for (const [k, v] of Object.entries(params)) out = out.split(`{${k}}`).join(String(v));
    return out;
  };

  return [
    fill(tpl.intro, { animal: pet.animal, name: petName }),
    fill(tpl.archetypeLine, { archetype: pet.archetype }),
    "",
    pet.personality,
    "",
    tpl.hardConstraints,
    fill(tpl.maxLine, { n: pet.voiceConstraints.maxLength }),
    fill(tpl.minLine, { n: pet.voiceConstraints.minLength }),
    fill(tpl.forbiddenLine, { words: pet.voiceConstraints.forbiddenWords.join(forbiddenWordsJoiner()) }),
    ...pet.voiceConstraints.sentencePattern.map(p => `- ${p}`),
    "",
    fill(tpl.comfortLine, { style: pet.comfortStyle }),
    fill(tpl.teaseLine, { style: pet.teaseStyle }),
    fill(tpl.encourageLine, { style: pet.encouragementStyle }),
    "",
    fill(tpl.quirkLine, { pct: Math.round(pet.voiceConstraints.quirkFrequency * 100) }),
    pet.voiceConstraints.longThoughtExample,
    "",
    tpl.actionRule,
  ].join("\n");
}
