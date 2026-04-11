/**
 * Shared utility functions — display width, padding, etc.
 */

// ─── CJK display width (CJK = 2 cols, ASCII = 1) ─────────────────────────

export function charWidth(ch: string): number {
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
  return 1;
}

export function stringWidth(str: string): number {
  return Array.from(str.replace(/\x1b\[[0-9;]*m/g, ""))
    .reduce((sum, ch) => sum + charWidth(ch), 0);
}

export function padDisplay(str: string, targetWidth: number): string {
  const pad = Math.max(0, targetWidth - stringWidth(str));
  return str + " ".repeat(pad);
}
