/**
 * Shared utility functions — display width, padding, etc.
 */

// ─── CJK locale detection ─────────────────────────────────────────────────
//
// On East Asian terminals (Chinese/Japanese/Korean Windows Terminal, iTerm2 in
// CJK locale, etc.) Unicode "Ambiguous" East Asian Width characters render as
// 2 columns instead of 1. The pet art uses a few of these (`◉`, `—`, `✦`, …)
// so without locale awareness the right border of any padded box drifts on
// CJK terminals — see issue #?.
//
// Detection order:
//   1. POSIX env vars (LC_ALL / LC_CTYPE / LANG / LANGUAGE)
//   2. Intl.DateTimeFormat resolved locale — works on Windows where the env
//      vars are usually unset but the system locale is e.g. "zh-CN".

const CJK_LOCALE_RE = /^(zh|ja|ko)\b/i;

function detectCjkLocale(): boolean {
  for (const v of [
    process.env.LC_ALL,
    process.env.LC_CTYPE,
    process.env.LANG,
    process.env.LANGUAGE,
  ]) {
    if (v && CJK_LOCALE_RE.test(v)) return true;
  }
  try {
    const loc = Intl.DateTimeFormat().resolvedOptions().locale || "";
    if (CJK_LOCALE_RE.test(loc)) return true;
  } catch {
    // Some restricted runtimes throw — fall through to false.
  }
  return false;
}

export const IS_CJK_LOCALE = detectCjkLocale();

// ─── Display width ────────────────────────────────────────────────────────
//
// CJK = 2 cols, ASCII = 1, with locale-aware handling of Ambiguous-width
// characters. Box-drawing chars (0x2500–0x257F) are intentionally excluded
// from the Ambiguous-as-wide branch because every mainstream terminal
// special-cases them to 1 column for TUI sanity even under a CJK locale.

export function charWidth(ch: string, cjk: boolean = IS_CJK_LOCALE): number {
  const code = ch.codePointAt(0) ?? 0;
  if (code < 32 || (code >= 0x7f && code < 0xa0)) return 0;
  if (
    (code >= 0x1100 && code <= 0x115f) ||
    (code >= 0x2e80 && code <= 0xa4cf && code !== 0x303f) ||
    (code >= 0xac00 && code <= 0xd7a3) ||
    (code >= 0xf900 && code <= 0xfaff) ||
    (code >= 0xfe10 && code <= 0xfe19) ||
    (code >= 0xfe30 && code <= 0xfe6f) ||
    (code >= 0xff00 && code <= 0xff60) ||
    (code >= 0xffe0 && code <= 0xffe6) ||
    // CJK Extension B-F
    (code >= 0x20000 && code <= 0x2fa1f) ||
    // Emoji (most are double-width in terminals)
    (code >= 0x1f300 && code <= 0x1f9ff) ||
    (code >= 0x1fa00 && code <= 0x1faff)
  ) return 2;
  if (cjk) {
    if (
      (code >= 0x2010 && code <= 0x2027) ||  // General Punctuation: em/en dash, quotes
      (code >= 0x2030 && code <= 0x205e) ||  // More General Punctuation
      (code >= 0x2150 && code <= 0x218f) ||  // Number Forms
      (code >= 0x2190 && code <= 0x21ff) ||  // Arrows
      (code >= 0x2200 && code <= 0x22ff) ||  // Mathematical Operators
      (code >= 0x2580 && code <= 0x25ff) ||  // Block Elements + Geometric Shapes (covers ◉)
      (code >= 0x2600 && code <= 0x26ff) ||  // Misc Symbols
      (code >= 0x2700 && code <= 0x27bf)     // Dingbats (covers ✦ ✧)
    ) return 2;
  }
  return 1;
}

export function stringWidth(str: string, cjk: boolean = IS_CJK_LOCALE): number {
  return Array.from(str.replace(/\x1b\[[0-9;]*m/g, ""))
    .reduce((sum, ch) => sum + charWidth(ch, cjk), 0);
}

export function padDisplay(str: string, targetWidth: number, cjk: boolean = IS_CJK_LOCALE): string {
  const pad = Math.max(0, targetWidth - stringWidth(str, cjk));
  return str + " ".repeat(pad);
}
