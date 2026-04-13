#!/usr/bin/env bun
/**
 * Extract art frames from the old shell script and output art.ts entries.
 * Used to sync redesigned shell art back to art.ts.
 */

import { readFileSync } from "fs";

const shell = readFileSync("/tmp/old-pet-status.sh", "utf8");

// Find the art rendering case block
const artMatch = shell.match(/^case "\$PET_ID" in\n([\s\S]*?)^\*\)\n\s+L1.*\n^esac$/m);
if (!artMatch) {
  // Try finding each animal individually
}

const earlyAnimals = ["raven", "owl", "bear", "fox", "wolf", "deer", "labrador"];

for (const animal of earlyAnimals) {
  // Find the animal's case block in the art rendering section
  // Pattern: animal)\n    case $FRAME in\n      ...\n    esac ;;
  const pattern = new RegExp(
    `  ${animal}\\)\\n(?:    [A-Z]+.*\\n)*    case \\$FRAME in\\n([\\s\\S]*?)    esac ;;`,
    "m"
  );

  const match = shell.match(pattern);
  if (!match) {
    console.error(`WARNING: Could not find art for ${animal}`);
    continue;
  }

  const caseBlock = match[1];

  // Extract each frame
  const framePattern = /\s*(\d+)\) (.*?) ;;/g;
  const frames: Map<number, string[]> = new Map();

  let m;
  while ((m = framePattern.exec(caseBlock)) !== null) {
    const frameNum = parseInt(m[1]);
    const assignments = m[2];

    // Parse L1="..."; L2="..."; L3="..."; L4="..."
    const lines: string[] = [];
    const linePattern = /L(\d)="([^"]*)"/g;
    let lm;
    while ((lm = linePattern.exec(assignments)) !== null) {
      const lineNum = parseInt(lm[1]);
      let value = lm[2];
      // Shell double-quote escaping → display chars:
      // \\ → \ (already correct for TS double-quoted)
      // \" → " (need to handle for TS)
      // The value AS-IS from shell is close to TS format
      lines[lineNum - 1] = value;
    }

    if (lines.length === 4) {
      frames.set(frameNum, lines);
    }
  }

  if (frames.size === 0) {
    console.error(`WARNING: No frames found for ${animal}`);
    continue;
  }

  // Sort by frame number and output as art.ts entries
  const sortedFrames = [...frames.entries()].sort((a, b) => a[0] - b[0]);

  console.log(`  // ${animal} — ${sortedFrames.length} frames (from redesigned shell)`);
  console.log(`  ${animal}: [`);

  for (const [frameNum, lines] of sortedFrames) {
    // Convert shell-escaped strings to TypeScript
    // The lines are in shell double-quote escaping which is mostly the same as TS
    // But we need to check for \" which should become " (use single quotes or escape)
    const tsLines = lines.map(line => {
      // Check if line contains unescaped double quotes
      if (line.includes('\\"')) {
        // Convert \" to " and wrap in single quotes
        const clean = line.replace(/\\"/g, '"');
        return `'${clean}'`;
      }
      return `"${line}"`;
    });

    const comment = frameNum >= 3 ? `  // action frame ${frameNum}` : "";
    console.log(`    ["            ", ${tsLines.join(", ")}],${comment}`);
  }

  console.log(`  ],`);
  console.log("");
}
