#!/usr/bin/env bun
/**
 * build-art — Generate statusline shell art from art.ts (single source of truth)
 *
 * Reads:  server/art.ts, server/engine.ts, server/art-meta.ts
 * Writes: statusline/pet-status.sh (between markers)
 *
 * Usage: bun run build:art
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { ANIMAL_ART } from "../server/art.ts";
import { ANIMALS, ANIMAL_COLOR } from "../server/engine.ts";
import { ART_META } from "../server/art-meta.ts";
import type { AnimalId } from "../server/engine.ts";

// Resolve paths relative to this script's directory
const SCRIPT_DIR = new URL(".", import.meta.url).pathname;
const PROJECT_ROOT = join(SCRIPT_DIR, "..");
const SHELL_PATH = join(PROJECT_ROOT, "statusline", "pet-status.sh");

// ─── Helpers ────────────────────────────────────────────────────────────────

function extractRgb(ansi: string): [number, number, number] {
  const m = ansi.match(/38;2;(\d+);(\d+);(\d+)/);
  if (!m) throw new Error(`Cannot parse ANSI color: ${JSON.stringify(ansi)}`);
  return [+m[1], +m[2], +m[3]];
}

function shellColor(rgb: [number, number, number]): string {
  return `$'\\033[38;2;${rgb[0]};${rgb[1]};${rgb[2]}m'`;
}

function shellEscape(s: string): string {
  let out = "";
  for (const ch of s) {
    if (ch === "\\") out += "\\\\";
    else if (ch === '"') out += '\\"';
    else if (ch === "`") out += "\\`";
    else if (ch === "$") out += "\\$";
    else out += ch;
  }
  return out;
}

function applyAccents(line: string, lineIdx: number, animalId: AnimalId): string {
  const meta = ART_META[animalId];
  if (!meta?.accents) return line;

  for (const accent of meta.accents) {
    for (const rule of accent.rules) {
      if (rule.line !== lineIdx) continue;
      const sorted = [...rule.patterns].sort((a, b) => b[0].length - a[0].length);
      for (const [search, replace] of sorted) {
        // split+join avoids infinite loop when replacement contains search
        line = line.split(search).join(replace);
      }
    }
  }
  return line;
}

// ─── Validation ─────────────────────────────────────────────────────────────

let errors = 0;
for (const animal of ANIMALS) {
  const frames = ANIMAL_ART[animal];
  for (let f = 0; f < frames.length; f++) {
    for (let li = 0; li < frames[f].length; li++) {
      if (frames[f][li].length !== 12) {
        console.error(`ERROR: ${animal} frame ${f} line ${li}: width ${frames[f][li].length} (expected 12)`);
        errors++;
      }
    }
  }
}
if (errors > 0) {
  console.error(`\n${errors} validation error(s). Fix art.ts before building.`);
  process.exit(1);
}

// ─── Generate color assignment block ────────────────────────────────────────

const maxIdLen = Math.max(...ANIMALS.map(a => a.length));
const colorLines: string[] = [];
for (const animal of ANIMALS) {
  const rgb = extractRgb(ANIMAL_COLOR[animal]);
  const pad = " ".repeat(maxIdLen - animal.length);
  colorLines.push(`  ${animal})${pad}  C=${shellColor(rgb)} ;;`);
}
const colors = [
  `case "$PET_ID" in`,
  ...colorLines,
  `  *)${" ".repeat(maxIdLen - 1)}  C=$'\\033[0m' ;;`,
  `esac`,
].join("\n");

// ─── Generate bubble border color block ─────────────────────────────────────

const bubbleOverrides: string[] = [];
for (const animal of ANIMALS) {
  const meta = ART_META[animal];
  if (meta?.bubbleColor) {
    bubbleOverrides.push(`  ${animal}) BC=${shellColor(meta.bubbleColor.rgb)} ;;  # ${meta.bubbleColor.comment}`);
  }
}
const bubbleColors = [
  `BC="$C"  # default: same as pet`,
  `case "$PET_ID" in`,
  ...bubbleOverrides,
  `esac`,
].join("\n");

// ─── Generate art rendering block ───────────────────────────────────────────

const artBlocks: string[] = [];
for (const animal of ANIMALS) {
  const frames = ANIMAL_ART[animal];
  const meta = ART_META[animal];

  const accentDecls: string[] = [];
  if (meta?.accents) {
    for (const accent of meta.accents) {
      accentDecls.push(`    ${accent.varName}=${shellColor(accent.rgb)}  # ${accent.comment}`);
    }
  }

  const frameCases: string[] = [];
  for (let f = 0; f < frames.length; f++) {
    const displayLines = frames[f].slice(1); // skip line 0 (reserved)
    const parts: string[] = [];
    for (let li = 0; li < displayLines.length; li++) {
      let line = displayLines[li];
      line = shellEscape(line);        // escape shell special chars first
      line = applyAccents(line, li, animal); // then inject ${VAR} references (unescaped)
      parts.push(`L${li + 1}="${line}"`);
    }
    const pad = f >= 10 ? "" : " ";
    frameCases.push(`      ${pad}${f}) ${parts.join("; ")} ;;`);
  }

  const inner = [
    ...accentDecls,
    `    case $FRAME in`,
    ...frameCases,
    `    esac ;;`,
  ];
  artBlocks.push(`  ${animal})\n${inner.join("\n")}`);
}

const art = [
  `case "$PET_ID" in`,
  ...artBlocks,
  `  *)`,
  `    L1="    (?)     "; L2="            "; L3="            "; L4="            " ;;`,
  `esac`,
].join("\n");

// ─── Replace markers in shell script ────────────────────────────────────────

const COLOR_START = "# <<< GENERATED: COLORS >>>";
const COLOR_END = "# <<< END GENERATED: COLORS >>>";
const BUBBLE_START = "# <<< GENERATED: BUBBLE COLORS >>>";
const BUBBLE_END = "# <<< END GENERATED: BUBBLE COLORS >>>";
const ART_START = "# <<< GENERATED: ART >>>";
const ART_END = "# <<< END GENERATED: ART >>>";

function replaceSection(content: string, startMarker: string, endMarker: string, replacement: string): string {
  const startIdx = content.indexOf(startMarker);
  const endIdx = content.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1) {
    throw new Error(`Markers not found: ${startMarker} / ${endMarker}`);
  }
  return content.slice(0, startIdx + startMarker.length) + "\n" +
    replacement + "\n" +
    content.slice(endIdx);
}

let shell = readFileSync(SHELL_PATH, "utf8");
shell = replaceSection(shell, COLOR_START, COLOR_END, colors);
shell = replaceSection(shell, BUBBLE_START, BUBBLE_END, bubbleColors);
shell = replaceSection(shell, ART_START, ART_END, art);
writeFileSync(SHELL_PATH, shell);

const totalFrames = ANIMALS.reduce((s, a) => s + ANIMAL_ART[a].length, 0);
console.log(`✓ Generated colors for ${ANIMALS.length} animals`);
console.log(`✓ Generated art for ${ANIMALS.length} animals (${totalFrames} total frames)`);
console.log(`✓ Written to ${SHELL_PATH}`);
