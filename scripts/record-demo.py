#!/usr/bin/env python3
"""
Generate a clean asciinema .cast demo for petsonality.
Simple sequential layout — no side-by-side, no cursor movement.
"""

import json, os, time

OUTPUT = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets", "demo.cast")
os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)

COLS, ROWS = 60, 18
R = "\033[0m"
DIM = "\033[2m"
BOLD = "\033[1m"
GREEN = "\033[32m"
RED = "\033[31m"
CYAN = "\033[36m"
GOLD = "\033[38;2;210;175;80m"

events = []
t = 0.0

def out(text, delay=0.0):
    global t; t += delay
    events.append([round(t, 3), "o", text])

def clear():
    out("\033[2J\033[H")

def typed(text, cps=20):
    for ch in text:
        out(ch, 1.0/cps)

def nl():
    out("\r\n")

# ── Scene 1: Install ────────────────────────────────────
clear()
out(f"{DIM}${R} ", 0.3)
typed("npx petsonality")
nl(); out("", 0.4)
nl()
out(f"  {BOLD}petsonality{R} — MBTI terminal pet companion\r\n", 0.2)
nl()
out(f"  {GREEN}✓{R} node found\r\n", 0.3)
out(f"  {GREEN}✓{R} Claude Code detected\r\n", 0.2)
out(f"  {GREEN}✓{R} MCP server registered\r\n", 0.2)
out(f"  {GREEN}✓{R} Hooks + status line configured\r\n", 0.2)
nl()
out(f"  {GREEN}Done! Type /pet to adopt your companion.{R}\r\n", 0.4)

# ── Scene 2: Adopt ──────────────────────────────────────
out("", 2.0)
clear()
out(f"{DIM}${R} ", 0.3)
typed("/pet")
nl(); out("", 0.5)
nl()
out(f"  Your MBTI? {BOLD}ENFJ{R}\r\n", 0.5)
out(f"  Recommended: {GOLD}Labrador{R} — Warm Coach\r\n", 0.4)
nl()
out(f"  {GOLD}      __/\\{R}\r\n", 0.1)
out(f"  {GOLD}    __/@ ){R}\r\n", 0.1)
out(f"  {GOLD}   O     \\{R}\r\n", 0.1)
out(f"  {GOLD}    U \\___\\-{R}\r\n", 0.1)
nl()
out(f"  {GREEN}✓{R} Meet {BOLD}ENFJ{R} the Labrador!\r\n", 0.5)

# ── Scene 3: Coding + error ─────────────────────────────
out("", 2.0)
clear()
out(f"{DIM}You code. Your pet watches.{R}\r\n", 0.5)
nl()
out(f"{DIM}${R} ", 0.6)
typed("bun test")
nl(); out("", 0.4)
out(f"  {RED}✗ 2 tests failed{R}\r\n", 0.5)
nl()
out(f"  {GOLD}ENFJ:{R} *sighs* ...you okay?\r\n", 0.6)

# ── Scene 4: Fix + success ──────────────────────────────
out("", 2.0)
nl()
out(f"{DIM}${R} ", 0.4)
typed("bun test")
nl(); out("", 0.4)
out(f"  {GREEN}✓ 302 tests passed{R}\r\n", 0.5)
nl()
out(f"  {GOLD}ENFJ:{R} *tail wags* ...hm.\r\n", 0.6)

# ── Scene 5: Daily moment ───────────────────────────────
out("", 2.0)
nl()
out(f"  {GOLD}ENFJ:{R} have you had water?\r\n", 0.8)

# ── Scene 6: Tagline ────────────────────────────────────
out("", 2.5)
clear()
out("\r\n\r\n\r\n", 0.2)
out(f"     {BOLD}petsonality{R}\r\n", 0.4)
out(f"     Your type, your pet.\r\n", 0.3)
nl()
out(f"     {DIM}npx petsonality{R}\r\n", 0.6)
out(f"     {DIM}16 animals · 1276 reactions · 2 languages{R}\r\n", 0.4)

# Write
with open(OUTPUT, "w") as f:
    f.write(json.dumps({
        "version": 2, "width": COLS, "height": ROWS,
        "timestamp": int(time.time()),
        "env": {"SHELL": "/bin/zsh", "TERM": "xterm-256color"},
        "title": "petsonality demo",
    }) + "\n")
    for ev in events:
        f.write(json.dumps(ev) + "\n")

print(f"✓ {OUTPUT} — {len(events)} events, {t:.1f}s")
