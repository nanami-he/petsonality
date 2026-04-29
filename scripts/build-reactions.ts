#!/usr/bin/env bun
/**
 * Build reactions pool JSON for shell hooks (both languages).
 *
 * Outputs:
 *   - dist/reactions-pool.json           (build artifact — shipped in npm tarball; the
 *                                          installer copies this to ~/.petsonality/ on
 *                                          npx installs so users don't need bun + sources)
 *   - ~/.petsonality/reactions-pool.json only when PETSONALITY_SYNC_RUNTIME=1
 *     or --sync-runtime is passed (dev runtime refresh for local dogfooding).
 *
 * Format: { zh: { pool, meta }, en: { pool, meta } }
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, resolve, dirname } from "path";
import { homedir } from "os";
import { fileURLToPath } from "url";
import { ANIMALS } from "../server/engine.ts";
import { getReaction as getReactionZh, type ReactionReason } from "../server/reactions.ts";
import { getPetById as getPetByIdZh } from "../server/pets.ts";

// English imports
import { REACTIONS_EN, ANIMAL_REACTIONS_EN } from "../server/reactions-en.ts";
import { getPetById as getPetByIdEn } from "../server/pets-en.ts";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const STATE_DIR = join(homedir(), ".petsonality");
const RUNTIME_OUTPUT = join(STATE_DIR, "reactions-pool.json");
const DIST_DIR = join(PROJECT_ROOT, "dist");
const DIST_OUTPUT = join(DIST_DIR, "reactions-pool.json");
const syncRuntime = process.env.PETSONALITY_SYNC_RUNTIME === "1" || process.argv.includes("--sync-runtime");

const REASONS: ReactionReason[] = ["error", "test-fail", "large-diff", "turn", "idle", "adopt", "pet"];

function collectReactions(
  getReaction: (reason: ReactionReason, animalId: any) => string,
  animalId: string,
  reason: ReactionReason,
  samples: number = 200,
): string[] {
  const seen = new Set<string>();
  for (let i = 0; i < samples; i++) {
    seen.add(getReaction(reason, animalId as any));
  }
  return [...seen];
}

// English getReaction (same logic, different pools)
function getReactionEn(reason: ReactionReason, animalId: any): string {
  const animalPool = ANIMAL_REACTIONS_EN[animalId]?.[reason];
  const generalPool = REACTIONS_EN[reason];
  const pool = animalPool && Math.random() < 0.4 ? animalPool : generalPool;
  return pool[Math.floor(Math.random() * pool.length)];
}

function buildLang(
  getReaction: (reason: ReactionReason, animalId: any) => string,
  getPetById: (id: string) => any,
) {
  const pool: Record<string, Record<string, string[]>> = {};
  for (const animal of ANIMALS) {
    pool[animal] = {};
    for (const reason of REASONS) {
      pool[animal][reason] = collectReactions(getReaction, animal, reason);
    }
  }

  const meta: Record<string, { talkLevel: string; cooldownRange: [number, number] }> = {};
  for (const animal of ANIMALS) {
    const profile = getPetById(animal);
    if (profile) {
      meta[animal] = { talkLevel: profile.talkLevel, cooldownRange: profile.cooldownRange };
    }
  }

  return { pool, meta };
}

const zh = buildLang(getReactionZh, getPetByIdZh);
const en = buildLang(getReactionEn, getPetByIdEn);

const output = { zh, en };
const json = JSON.stringify(output, null, 2);

// Dist artifact — gets shipped to npm via package.json#files = ["dist/", ...]
//    so npx users get the JSON without needing bun + scripts/ + server/ on disk.
if (!existsSync(DIST_DIR)) mkdirSync(DIST_DIR, { recursive: true });
writeFileSync(DIST_OUTPUT, json);

// Optional dev runtime sync — local hooks pick this up immediately, but normal
// builds stay hermetic and only write inside the project tree.
if (syncRuntime) {
  if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(RUNTIME_OUTPUT, json, { mode: 0o600 });
}

let totalZh = 0, totalEn = 0;
for (const animal of ANIMALS) {
  for (const reason of REASONS) {
    totalZh += zh.pool[animal][reason].length;
    totalEn += en.pool[animal][reason].length;
  }
}
console.log(`\x1b[32m✓\x1b[0m  reactions-pool.json: zh=${totalZh}, en=${totalEn} reactions`);
console.log(`\x1b[32m✓\x1b[0m  Written to ${DIST_OUTPUT}  (npm artifact)`);
if (syncRuntime) {
  console.log(`\x1b[32m✓\x1b[0m  Written to ${RUNTIME_OUTPUT}  (dev runtime)`);
}
