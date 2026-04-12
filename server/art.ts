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
    ["            ", "   /\\  /\\   ", "  ( >.<  )  ", "   > ^ <    ", "   /_\\~~~   "],
    ["            ", "   /\\  /\\   ", "  ( >.<  )  ", "   > ^ <    ", "   /_\\~~>   "],
    ["            ", "   /\\  /\\   ", "  ( o.o  )  ", "   > ^ <    ", "   /_\\~~~   "],
  ],
  // 5. INFJ wolf — tall pointed ears /|, V-shaped mouth
  wolf: [
    ["            ", "  _/|/|     ", " (·   |__  ", "  \\\\   / -  ", "   |  |  || "],
    ["            ", "  _/|/|     ", " (·   |__  ", "  \\\\   / ~  ", "   |  |  || "],
    ["            ", "  _/|/|     ", " (-   |__  ", "  \\\\   / -  ", "   |  |  || "],
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
  // 9. ISTJ beaver — n-ears, wide face, buck teeth >TT<, round bottom
  beaver: [
    ["            ", "  n____n    ", " (\u00b7    \u00b7)   ", " ( >TT< )   ", "  `----'    "],
    ["            ", "  n____n    ", " (\u00b7    \u00b7)   ", " ( >TT< )~  ", "  `----'    "],
    ["            ", "  n____n    ", " (-    \u00b7)   ", " ( >TT< )   ", "  `----'    "],
    ["            ", "  n____n    ", " (\u00b7    \u00b7)   ", " (=>TT<=)   ", "  `----'    "],  // gnaw
    ["            ", "  n____n    ", " (\u00b0    \u00b0)   ", " ( >TT< )!! ", "  `----'    "],  // slap
    ["            ", "  n____n    ", " (>    >)   ", " ( >TT< )   ", "  `----'    "],  // inspect right
    ["            ", "  n____n    ", " (<    <)   ", " ( >TT< )   ", "  `----'    "],  // inspect left
    ["            ", "  n____n    ", " (-    -)   ", " ( >TT< )\u2026  ", "  `----'    "],  // sigh
    ["            ", "  n____n    ", " (\u00b7    \u00b7)   ", " (= T T=)   ", "  `----'    "],  // gnaw open
  ],
  // 10. ISFJ elephant — facing left, trunk touching ground, big ear
  elephant: [
    ["            ", "    __  ___ ", "   ( \u2022  |  )", "    \\ |_  | ", "    _) |__| "],
    ["            ", "    __  ___ ", "   ( \u2022  |  )", "    \\ |_  | ", "   _)  |__| "],
    ["            ", "    __  ___ ", "   ( -  |  )", "    \\ |_  | ", "    _) |__| "],
    ["            ", "    __  ___ ", "   ( \u2022  |  )", "    \\ |_  | ", "    _) |_ | "],  // stomp R
    ["            ", "    __  ___ ", "   ( \u2022  |  )", "    \\ |_  | ", "    _) | _| "],  // stomp L
    ["            ", "    __  ___ ", "   ( \u2022  |  )", "    \\ |_  | ", "   _/  |__| "],  // trunk up
    ["            ", "   __ _____ ", "   ( \u2022  |  )", "    \\ |_  | ", "    _) |__| "],  // listen
    ["            ", "    __  ___ ", "   ( \u2013  |  )", "    \\ |_  | ", "    _) |__| "],  // nod
  ],
  // 11. ESTJ lion — mane {*W*}, whiskers = ^ =, chin fluff *~~*
  lion: [
    ["            ", " {*|_W_|*}  ", " ( \u25c9   \u25c9 )  ", " { = ^ = }  ", "  * *~~* *  "],
    ["            ", " {*|_W_|*}  ", " ( \u25c9   \u25c9 )  ", " { = ^ = }~ ", "  * *~~* *  "],
    ["            ", " {*|_W_|*}  ", " ( -   \u25c9 )  ", " { = ^ = }  ", "  * *~~* *  "],
    ["            ", " {*|_W_|*}  ", " ( \u25c9   \u25c9 )  ", " { = V = }  ", "  * *~~* *  "],  // roar
    ["            ", " }*|_W_|*{  ", " ( \u25c9   \u25c9 )  ", " } = ^ = {  ", "  * *~~* *  "],  // shake L
    ["            ", " {*|_W_|*}  ", " ( \u25c9   \u25c9 )  ", " { = ^ = }  ", "  * *~~* *  "],  // shake R
    ["            ", " {*|_W_|*}  ", " ( >   < )  ", " { = ^ = }  ", "  * *~~* *  "],  // glare
    ["            ", " {*|_W_|*}  ", " ( -   - )  ", " { = O = }  ", "  * *~~* *  "],  // yawn
  ],
  // 12. ESFJ golden retriever — fluffy fur ~~, tongue U, tail wag
  golden: [
    ["            ", "  _/~\\~~    ", " ( \u2022  \\~~   ", "  U    |    ", "  \\__(__)~  "],
    ["            ", "  _/~\\~~    ", " ( \u2022  \\~~   ", "  U    |    ", "  \\__(__)~~ "],
    ["            ", "  _/~\\~~    ", " ( -  \\~~   ", "  U    |    ", "  \\__(__)~  "],
    ["            ", "  _/~\\~~    ", " ( \u2022  \\~~   ", "  U    |    ", "  \\__(__)~~~"],  // wag
    ["            ", "  _/~\\~~    ", " ( \u2022  \\~~   ", "  U    |    ", " ~\\__( )~   "],  // jump
    ["            ", "  _/~\\~~    ", " ( \u2022  \\~~   ", " U     |    ", "  \\__(__)~  "],  // lick out
    ["            ", "  _/~\\~~    ", " ( \u2022  \\~~   ", "  U    |    ", "  \\__(__)~  "],  // lick back
    ["            ", "   ~~/ ~\\_  ", "  (~~  \u2022 )  ", "   |    U   ", " ~(__)__/~  "],  // spin
  ],
  // 13. ISTP cat — iconic /\_/\ ears, curled up loaf, aloof
  cat: [
    ["            ", "   /\\_/\\    ", "  ( \u2022.\u2022 )   ", "   > ^ <    ", "  (_____)~  "],
    ["            ", "   /\\_/\\    ", "  ( \u2022.\u2022 )   ", "   > ^ <    ", "  (_____)~~ "],
    ["            ", "   /\\_/\\    ", "  ( -.\u2022 )   ", "   > ^ <    ", "  (_____)~  "],
    ["            ", "   /\\_/\\    ", "  ( \u25c9.\u25c9 )   ", "   > ^ <    ", "  (_____)~  "],  // stare
    ["            ", "   /\\_/\\    ", "  ( \u2013.\u2013 )   ", "   > ^_<    ", "  (_____)~  "],  // lick
    ["            ", "   /\\_/\\  ~ ", "  ( \u2013.\u2013 )   ", "   > ^ <    ", "  (_____)   "],  // stretch
  ],
  // 14. ISFP panda — round ears n, black eye circles @, chubby
  panda: [
    ["            ", "  n __ n    ", " / @  @ \\   ", " (  ww  )   ", "( --  -- )  "],
    ["            ", "  n __ n    ", " / @  @ \\   ", " (  ww  )   ", "( --  -- )  "],
    ["            ", "  n __ n    ", " / @  - \\   ", " (  ww  )   ", "( --  -- )  "],
    ["            ", "  n __ n    ", " / @  @ \\   ", " (  ww  ====", "( --  -- )  "],  // eat 0: ==== enters, covers )
    ["            ", "  n __ n    ", " / @  @ \\   ", " (  ====)   ", "( ||  || )  "],  // eat 1: covers ww, ) stays
    ["            ", "  n __ n    ", " / @  @ \\   ", " (  ww==)   ", "( ||  || )  "],  // eat 2: == left
    ["            ", "  n __ n    ", " / @  @ \\   ", " (  ww =)   ", "( --  -- )  "],  // eat 3: = left
    ["            ", "  n __ n    ", "  \\ @  @ /  ", " (  ww  )   ", " ( --  -- ) "],  // roll
    ["            ", "  n __ n    ", " / \u00b7  \u00b7 \\   ", " (  ww  )   ", "( --  -- )  "],  // stare
    ["            ", "  n __ n    ", " / >  < \\   ", " (  ww  )   ", "( --  -- )  "],  // frown
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
