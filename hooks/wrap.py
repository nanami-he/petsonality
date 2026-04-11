#!/usr/bin/env python3
"""CJK-aware text wrap for pet bubble. Called by hooks, result stored in reaction JSON."""
import json, sys, unicodedata

def ch_width(ch):
    if unicodedata.combining(ch) or ch == '\u200d':
        return 0
    eaw = unicodedata.east_asian_width(ch)
    if eaw in ('W', 'F'):
        return 2
    cp = ord(ch)
    if 0x1F300 <= cp <= 0x1FAFF:
        return 2
    return 1

def str_width(s):
    return sum(ch_width(c) for c in s)

def wrap(text, max_w):
    lines = []
    cur = ""
    w = 0
    for ch in text:
        if ch == "\n":
            lines.append(cur)
            cur = ""
            w = 0
            continue
        cw = ch_width(ch)
        if cur and w + cw > max_w:
            lines.append(cur)
            cur = ch
            w = cw
        else:
            cur += ch
            w += cw
    if cur or not lines:
        lines.append(cur)
    return lines

if __name__ == '__main__':
    text = sys.argv[1] if len(sys.argv) > 1 else ""
    max_w = int(sys.argv[2]) if len(sys.argv) > 2 else 40
    max_lines = int(sys.argv[3]) if len(sys.argv) > 3 else 4
    lines = wrap(text, max_w)
    # Truncate to max_lines
    if len(lines) > max_lines:
        last = lines[max_lines - 1]
        # Trim last line to fit "…"
        while str_width(last) >= max_w:
            last = last[:-1]
        lines = lines[:max_lines - 1] + [last + "…"]
    widths = [str_width(l) for l in lines]
    max_width = max(widths) if widths else 0
    print(json.dumps({
        "lines": lines,
        "widths": widths,
        "maxWidth": max_width,
    }, ensure_ascii=False))
