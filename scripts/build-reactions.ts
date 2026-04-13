#!/usr/bin/env bun
/**
 * Build reactions pool JSON for shell hooks.
 *
 * Exports all animal × reason reactions from reactions.ts into a JSON file
 * that react.sh can read without needing to call the TS server.
 *
 * Output: ~/.petsonality/reactions-pool.json
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { ANIMALS } from "../server/engine.ts";
import { getReaction, type ReactionReason } from "../server/reactions.ts";
import { getPetById } from "../server/pets.ts";

const STATE_DIR = join(homedir(), ".petsonality");
const OUTPUT = join(STATE_DIR, "reactions-pool.json");

const REASONS: ReactionReason[] = ["error", "test-fail", "large-diff", "turn", "idle", "adopt", "pet"];

// Collect unique reactions per animal × reason by sampling getReaction many times
// (getReaction has 40% animal-specific / 60% generic randomness)
function collectReactions(animalId: string, reason: ReactionReason, samples: number = 200): string[] {
  const seen = new Set<string>();
  for (let i = 0; i < samples; i++) {
    seen.add(getReaction(reason, animalId as any));
  }
  return [...seen];
}

// Build the pool
const pool: Record<string, Record<string, string[]>> = {};

for (const animal of ANIMALS) {
  pool[animal] = {};
  for (const reason of REASONS) {
    pool[animal][reason] = collectReactions(animal, reason);
  }
}

// Also include talkLevel per animal for hook frequency control
const meta: Record<string, { talkLevel: string; cooldownRange: [number, number] }> = {};
for (const animal of ANIMALS) {
  const profile = getPetById(animal);
  if (profile) {
    meta[animal] = {
      talkLevel: profile.talkLevel,
      cooldownRange: profile.cooldownRange,
    };
  }
}

if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true });

const output = { pool, meta };
writeFileSync(OUTPUT, JSON.stringify(output, null, 2), { mode: 0o600 });

// Stats
let total = 0;
for (const animal of ANIMALS) {
  for (const reason of REASONS) {
    total += pool[animal][reason].length;
  }
}
console.log(`\x1b[32m✓\x1b[0m  reactions-pool.json: ${ANIMALS.length} animals × ${REASONS.length} reasons = ${total} reactions`);
console.log(`\x1b[32m✓\x1b[0m  Written to ${OUTPUT}`);
