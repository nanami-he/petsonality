/**
 * ASCII art for all 16 MBTI pet animals
 *
 * Each animal has 3 animation frames (idle variations).
 * Each frame is 5 lines, ~12 chars wide.
 * First line is empty (reserved for future use).
 */

import type { AnimalId } from "./engine.ts";
import { charWidth, stringWidth, padDisplay as padToWidth } from "./utils.ts";

// ─── Animal art: 3 frames × 5 lines each ──────────────────────────────────

export const ANIMAL_ART: Record<AnimalId, string[][]> = {
  // 1. INTJ raven — hooked beak <, eyes: ◉ focus → ● glare → - blink
  raven: [
    ["            ", "  <(\u25c9)      ", "   (\\ \\_    ", "    \\\\//    ", '  --" "---  '],
    ["            ", "  <(\u25cf)      ", "   (\\ \\_    ", "    \\\\//    ", '  --" "---  '],
    ["            ", "  <(-)      ", "   (\\ \\_    ", "    \\\\//    ", '  --" "---  '],
  ],
  // 2. INTP owl — compact, big eyes {◉,◉}, shifts left/right
  owl: [
    ["            ", "            ", "    {\u25c9,\u25c9}   ", "    /)_)    ", '  \u2014\u2014" "\u2014\u2014   '],
    ["            ", "            ", "     {\u25c9,\u25c9}  ", "    /)_)    ", '  \u2014\u2014" "\u2014\u2014   '],
    ["            ", "            ", "    {-,-}   ", "    /)_)    ", '  \u2014\u2014" "\u2014\u2014   '],
  ],
  // 3. ENTJ bear — stocky, small round ears c()o
  bear: [
    ["            ", "  c(\\__/)o  ", "  ( o  o )  ", "  (  ww  )  ", "   /|  |\\   "],
    ["            ", "  c(\\__/)o  ", "  ( o  o )  ", "  (  ww  )  ", "  ~/|  |\\   "],
    ["            ", "  c(\\__/)o  ", "  ( -  o )  ", "  (  ww  )  ", "   /|  |\\   "],
  ],
  // 4. ENTP fox — pointy ears, big bushy tail ~~~
  fox: [
    ["            ", "   /\\  /\\   ", "  ( o.o  )  ", "   > ^ <    ", "   /_\\~~~   "],
    ["            ", "   /\\  /\\   ", "  ( o.o  )  ", "   > ^ <    ", "   /_\\~~>   "],
    ["            ", "   /\\  /\\   ", "  ( -.o  )  ", "   > ^ <    ", "   /_\\~~~   "],
  ],
  // 5. INFJ wolf — tall pointed ears /|, V-shaped mouth
  wolf: [
    ["            ", "   /|  |\\   ", "  ( o  o )  ", "   ( VV )   ", "   /|  |\\   "],
    ["            ", "   /|  |\\   ", "  ( o  o )  ", "   ( VV )   ", "  ~/|  |\\   "],
    ["            ", "   /|  |\\   ", "  ( -  o )  ", "   ( VV )   ", "   /|  |\\   "],
  ],
  // 6. INFP deer — forked antlers }|/ \|{
  deer: [
    ["            ", "  }|/  \\|{  ", "   (\\__/)   ", "   (o  o)   ", "    (  )    "],
    ["            ", "  }|/  \\|{  ", "   (\\__/)   ", "   (o  o)   ", "    (  )~   "],
    ["            ", "  }|/  \\|{  ", "   (\\__/)   ", "   (-  o)   ", "    (  )    "],
  ],
  // 7. ENFJ labrador — floppy ear drooping, side profile
  labrador: [
    ["            ", "   ___/ \\_  ", "  | o   \\   ", "  |     _>  ", "  |____|/   "],
    ["            ", "   ___/ \\_  ", "  | o   \\   ", "  |     _>  ", " ~|____|/   "],
    ["            ", "   ___/ \\_  ", "  | -   \\   ", "  |     _>  ", "  |____|/   "],
  ],
  // 8. ENFP dolphin — streamlined arc, dorsal fin
  dolphin: [
    ["            ", "       ,    ", "  _.-~o)    ", " /    /~~   ", " \\___/      "],
    ["            ", "       ,    ", "  _.-~o)    ", " /    /~~   ", " \\___/~     "],
    ["            ", "       ,    ", "  _.-~-)    ", " /    /~~   ", " \\___/      "],
  ],
  // 9. ISTJ beaver — buck teeth TT, flat tail [=====]
  beaver: [
    ["            ", "   (\\__/)   ", "   (o  o)   ", "   (>TT<)   ", "   [=====]  "],
    ["            ", "   (\\__/)   ", "   (o  o)   ", "   (>TT<)   ", "  ~[=====]  "],
    ["            ", "   (\\__/)   ", "   (-  o)   ", "   (>TT<)   ", "   [=====]  "],
  ],
  // 10. ISFJ elephant — big ear flap, curving trunk
  elephant: [
    ["            ", "   ___  __  ", "  /o   |  ) ", "  |   _/    ", "  |__|      "],
    ["            ", "   ___  __  ", "  /o   |  ) ", "  |   _/    ", " ~|__|      "],
    ["            ", "   ___  __  ", "  /-   |  ) ", "  |   _/    ", "  |__|      "],
  ],
  // 11. ESTJ lion — mane {*|__|*} surrounding face
  lion: [
    ["            ", " {*|____|*} ", "  ( o  o )  ", "  ( =w=  )  ", "   /|  |\\   "],
    ["            ", " {*|____|*} ", "  ( o  o )  ", "  ( =w=  )  ", "  ~/|  |\\   "],
    ["            ", " {*|____|*} ", "  ( -  o )  ", "  ( =w=  )  ", "   /|  |\\   "],
  ],
  // 12. ESFJ golden retriever — long fluffy fur ~~
  golden: [
    ["            ", "   _/~\\~~   ", "  ( o  \\~~  ", "  |     O   ", "  \\__(__)   "],
    ["            ", "   _/~\\~~   ", "  ( o  \\~~  ", "  |     O   ", " ~\\__(__)   "],
    ["            ", "   _/~\\~~   ", "  ( -  \\~~  ", "  |     O   ", "  \\__(__)   "],
  ],
  // 13. ISTP cat — iconic /\_/\ ears, aloof
  cat: [
    ["            ", "   /\\_/\\    ", "  ( o.o )   ", "   > ^ <    ", "  /|   |\\   "],
    ["            ", "   /\\_/\\    ", "  ( o.o )   ", "   > ^ <    ", "  /|   |\\~  "],
    ["            ", "   /\\_/\\    ", "  ( -.o )   ", "   > ^ <    ", "  /|   |\\   "],
  ],
  // 14. ISFP panda — black eye circles @
  panda: [
    ["            ", "  (\\__/)    ", "  (@  @)    ", "  ( ww )    ", "  /|  |\\    "],
    ["            ", "  (\\__/)    ", "  (@  @)    ", "  ( ww )    ", " ~/|  |\\    "],
    ["            ", "  (\\__/)    ", "  (#  @)    ", "  ( ww )    ", "  /|  |\\    "],
  ],
  // 15. ESTP cheetah — spots on legs, speed line ~
  cheetah: [
    ["            ", "   /\\_/\\  ~ ", "  (o . o)   ", "   >.v.<    ", "  /|'.|\\    "],
    ["            ", "   /\\_/\\  ~ ", "  (o . o)   ", "   >.v.<    ", "  /|'.|\\~   "],
    ["            ", "   /\\_/\\  ~ ", "  (- . o)   ", "   >.v.<    ", "  /|'.|\\    "],
  ],
  // 16. ESFP parrot — hooked beak >, crest, perch |||
  parrot: [
    ["            ", "    ,__     ", "  >(o  )    ", "   \\\\__/    ", "    |||     "],
    ["            ", "    ,__     ", "  >(o  )    ", "   \\\\__/    ", "    |||~    "],
    ["            ", "    ,__     ", "  >(-  )    ", "   \\\\__/    ", "    |||     "],
  ],
};

// No ANSI in MCP tool output (markdown strips it). Colors only in statusline.

// ─── Get art frame ─────────────────────────────────────────────────────────

export function getArtFrame(animalId: AnimalId, frame: number = 0): string[] {
  const frames = ANIMAL_ART[animalId];
  return frames[frame % frames.length];
}

// ─── Word wrap (CJK-aware) ─────────────────────────────────────────────────

function wordWrap(text: string, maxWidth: number): string[] {
  const result: string[] = [];
  let current = "";
  let currentW = 0;

  // Split on spaces but keep CJK chars as individual tokens
  for (const ch of text) {
    const w = charWidth(ch);
    if (ch === " " && currentW + 1 > maxWidth) {
      result.push(current);
      current = "";
      currentW = 0;
      continue;
    }
    if (currentW + w > maxWidth) {
      result.push(current);
      current = ch;
      currentW = w;
    } else {
      current += ch;
      currentW += w;
    }
  }
  if (current) result.push(current);
  return result.length > 0 ? result : [""];
}

// ─── Render pet card ───────────────────────────────────────────────────────

export function renderPetCard(
  animalId: AnimalId,
  name: string,
  subtitle: string,
  reaction?: string,
  extraLines?: string[],
  frame: number = 0,
): string {
  const art = getArtFrame(animalId, frame);

  // Inner width (display cols between │ and │)
  const INNER = 40;
  const hr = "─".repeat(INNER);
  const lines: string[] = [];

  function row(content: string): string {
    return `│${padToWidth(content, INNER)}│`;
  }

  // Top border
  lines.push(`╭${hr}╮`);

  // Art
  for (const artLine of art) {
    if (!artLine.trim()) continue;
    lines.push(row(`  ${artLine}`));
  }

  // Separator
  lines.push(`├${"─".repeat(INNER)}┤`);

  // Name + subtitle (wrapped if needed)
  lines.push(row(` ${name}`));
  const subWrapped = wordWrap(subtitle, INNER - 2);
  for (const sl of subWrapped) {
    lines.push(row(` ${sl}`));
  }

  // Speech bubble (word-wrapped)
  if (reaction) {
    lines.push(`├${"─".repeat(INNER)}┤`);
    const maxW = INNER - 3; // 2 indent + 1 padding
    const wrapped = wordWrap(reaction, maxW);
    for (const wl of wrapped) {
      lines.push(row(`  ${wl}`));
    }
  }

  // Extra lines (mood, interaction count, etc.)
  if (extraLines && extraLines.length > 0) {
    lines.push(`├${"─".repeat(INNER)}┤`);
    for (const el of extraLines) {
      lines.push(row(` ${el}`));
    }
  }

  // Bottom border
  lines.push(`╰${hr}╯`);

  return lines.join("\n");
}
