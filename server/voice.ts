/**
 * Voice system — 80/20 signature vs AI generation
 * Handles the pet speaking logic and validation
 */

import type { PetProfile } from "./pets.ts";

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
 * Build the system prompt personality block for this pet
 */
export function buildPersonalityPrompt(pet: PetProfile, petName: string): string {
  return [
    `你有一只${pet.animal}宠物，名叫「${petName}」。`,
    `角色设定：${pet.archetype}`,
    "",
    pet.personality,
    "",
    "说话硬约束：",
    `- 最多 ${pet.voiceConstraints.maxLength} 个字`,
    `- 最少 ${pet.voiceConstraints.minLength} 个字`,
    `- 绝对禁止说：${pet.voiceConstraints.forbiddenWords.join("、")}`,
    ...pet.voiceConstraints.sentencePattern.map(p => `- ${p}`),
    "",
    `安慰风格：${pet.comfortStyle}`,
    `吐槽风格：${pet.teaseStyle}`,
    `鼓励风格：${pet.encouragementStyle}`,
    "",
    `偶尔（${Math.round(pet.voiceConstraints.quirkFrequency * 100)}% 概率）会突然说一句很长的胡思乱想：`,
    pet.voiceConstraints.longThoughtExample,
    "",
    `每次回复末尾用「${petName}」的语气写一句：`,
    `<!-- pet: 这里写一句话 -->`,
    `用 *星号* 表示动作。只写一句，不要解释。`,
  ].join("\n");
}
