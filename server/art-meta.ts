/**
 * Statusline color metadata — accent colors and special overrides
 *
 * Used by scripts/build-art.ts to inject ANSI color variables
 * into the generated shell art rendering block.
 *
 * Body colors come from engine.ts ANIMAL_COLOR.
 * This file only defines EXTRA per-animal colors.
 */

import type { AnimalId } from "./engine.ts";

export interface AccentRule {
  /** Which display line (0=L1, 1=L2, 2=L3, 3=L4) */
  line: number;
  /** Search → replace pairs. Applied longest-first to avoid partial matches. */
  patterns: [string, string][];
}

export interface ArtAccent {
  varName: string;
  rgb: [number, number, number];
  comment: string;
  rules: AccentRule[];
}

export interface AnimalMeta {
  accents?: ArtAccent[];
  /** Override bubble border color (default: same as body) */
  bubbleColor?: { rgb: [number, number, number]; comment: string };
}

export const ART_META: Partial<Record<AnimalId, AnimalMeta>> = {
  beaver: {
    accents: [{
      varName: "TH", rgb: [200, 195, 185], comment: "grey for teeth",
      rules: [{ line: 2, patterns: [["TT", "${TH}TT${C}"], ["T T", "${TH}T T${C}"]] }],
    }],
  },
  golden: {
    accents: [{
      varName: "TG", rgb: [240, 140, 150], comment: "pink tongue",
      rules: [{ line: 2, patterns: [["U", "${TG}U${C}"]] }],
    }],
  },
  panda: {
    accents: [
      {
        varName: "PP", rgb: [140, 100, 180], comment: "purple for ears & eye circles",
        rules: [
          { line: 0, patterns: [["n", "${PP}n${C}"]] },
          { line: 1, patterns: [["@", "${PP}@${C}"]] },
        ],
      },
      {
        varName: "BM", rgb: [80, 180, 80], comment: "green bamboo",
        rules: [{ line: 2, patterns: [["====", "${BM}====${C}"], ["==", "${BM}==${C}"], ["=", "${BM}=${C}"]] }],
      },
    ],
  },
  parrot: {
    accents: [{
      varName: "CR", rgb: [230, 80, 50], comment: "warm red crest",
      rules: [{ line: 0, patterns: [[",__", "${CR},__${C}"]] }],
    }],
  },
  dolphin: {
    bubbleColor: { rgb: [70, 130, 200], comment: "blue sea bubble" },
  },
};
