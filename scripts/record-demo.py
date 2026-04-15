#!/usr/bin/env python3
"""
Generate an asciinema .cast file for the petsonality demo.
Shows: statusline with pet animation + speech bubble.
"""

import json
import os
import subprocess
import time

OUTPUT = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets", "demo.cast")
os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)

# Terminal size
COLS = 80
ROWS = 24

# ANSI colors
RESET = "\033[0m"
GOLD = "\033[38;2;210;175;80m"  # labrador color
PINK = "\033[38;2;240;140;150m"  # tongue
DIM = "\033[2m"
GREEN = "\033[32m"
CYAN = "\033[36m"
BOLD = "\033[1m"

# Labrador frames
LAB_IDLE = [
    f"      __/\\  ",
    f"    __/@ )  ",
    f"   O     \\  ",
    f"    U \\___\\-",
]

LAB_BLINK = [
    f"      __/\\  ",
    f"    __/- )  ",
    f"   O     \\  ",
    f"    U \\___\\-",
]

LAB_NUZZLE = [
    f"      __/\\  ",
    f"    __/@ )  ",
    f"  O>     \\  ",
    f"    U \\___\\-",
]

# Bubble frames
def make_bubble(text, pet_lines, color=GOLD):
    """Render pet + bubble side by side."""
    # Bubble
    text_w = len(text)
    top = f"╭{'─' * (text_w + 2)}╮"
    mid = f"│ {text} │"
    bot = f"╰{'─' * (text_w + 2)}╯"

    lines = []
    lines.append(f"  {color}{pet_lines[0]}{RESET}        {top}")
    lines.append(f"  {color}{pet_lines[1]}{RESET}        {mid}")
    lines.append(f"  {color}{pet_lines[2]}{RESET}        {bot}")
    lines.append(f"  {color}{pet_lines[3]}{RESET}")
    return "\n".join(lines)

def make_pet_only(pet_lines, color=GOLD):
    lines = []
    for l in pet_lines:
        lines.append(f"  {color}{l}{RESET}")
    return "\n".join(lines)

# Build cast file
events = []
t = 0.0

def header():
    return {
        "version": 2,
        "width": COLS,
        "height": ROWS,
        "timestamp": int(time.time()),
        "env": {"SHELL": "/bin/zsh", "TERM": "xterm-256color"},
        "title": "petsonality — Your type, your pet",
    }

def output(text, delay=0.0):
    global t
    t += delay
    events.append([round(t, 3), "o", text])

def clear():
    output("\033[2J\033[H")

def type_text(text, delay_per_char=0.05):
    for ch in text:
        output(ch, delay_per_char)

def newline():
    output("\r\n")

# ─── Scene 1: Install ───────────────────────────────────────────────────────
clear()
output(f"{DIM}~ ${RESET} ", 0.5)
type_text("npx petsonality", 0.04)
output("\r\n", 0.3)
output(f"\r\n{CYAN}╔══════════════════════════════════════════════════════════╗{RESET}\r\n")
output(f"{CYAN}║{RESET}  {BOLD}petsonality{RESET} — MBTI terminal pet companion       {CYAN}║{RESET}\r\n", 0.1)
output(f"{CYAN}╚══════════════════════════════════════════════════════════╝{RESET}\r\n", 0.1)
output(f"\r\n{GREEN}✓{RESET}  node found (v22.0.0)\r\n", 0.3)
output(f"{GREEN}✓{RESET}  Claude Code detected\r\n", 0.2)
output(f"{GREEN}✓{RESET}  MCP server registered\r\n", 0.2)
output(f"{GREEN}✓{RESET}  Hooks registered\r\n", 0.2)
output(f"{GREEN}✓{RESET}  Status line configured\r\n", 0.2)
output(f"\r\n{GREEN}  Done! Restart Claude Code and type /pet{RESET}\r\n", 0.5)

# ─── Scene 2: Adoption ──────────────────────────────────────────────────────
output("\r\n", 1.5)
clear()
output(f"{DIM}~ ${RESET} ", 0.5)
type_text("/pet", 0.06)
output("\r\n", 0.5)
output(f"\r\n  {BOLD}Pick your MBTI:{RESET}\r\n", 0.3)
output(f"  1. INTJ  2. INTP  3. ENTJ  4. ENTP\r\n", 0.1)
output(f"  5. INFJ  6. INFP  {BOLD}7. ENFJ{RESET}  8. ENFP\r\n", 0.1)
output(f"\r\n{DIM}> {RESET}", 0.5)
type_text("7", 0.1)
output("\r\n", 0.5)

output(f"\r\n  Recommended: {BOLD}Labrador{RESET} (ENFJ) — Warm Coach\r\n", 0.5)
output(f"\r\n", 0.3)

# Show labrador art
art_block = f"""  {GOLD}      __/\\  {RESET}
  {GOLD}    __/@ )  {RESET}
  {GOLD}   O     \\  {RESET}
  {GOLD}    {PINK}U{GOLD} \\___\\-{RESET}
"""
output(art_block, 0.3)
output(f"\r\n  Name your pet (or press Enter for default): ", 0.5)
type_text("ENFJ", 0.08)
output("\r\n", 0.3)
output(f"\r\n  {GREEN}✓{RESET} Adopted! Meet {BOLD}ENFJ{RESET} the Labrador.\r\n", 0.5)

# ─── Scene 3: Pet in action ─────────────────────────────────────────────────
output("\r\n", 1.5)
clear()
output(f"{DIM}You code... your pet watches.{RESET}\r\n\r\n", 0.5)

# Show idle pet
output(make_pet_only(LAB_IDLE) + "\r\n", 0.8)

# Blink
output("\033[4A")  # move up 4 lines
output(make_pet_only(LAB_BLINK) + "\r\n", 0.4)
output("\033[4A")
output(make_pet_only(LAB_IDLE) + "\r\n", 0.3)

# Error happens
output(f"\r\n{DIM}~ ${RESET} ", 0.8)
type_text("bun test", 0.04)
output("\r\n", 0.3)
output(f"  \033[31m✗ 2 tests failed\033[0m\r\n", 0.5)

# Pet reacts with bubble
output("\r\n", 0.3)
output(make_bubble("*sighs* ...you okay?", LAB_IDLE) + "\r\n", 0.5)

# Wait, then new reaction
output("\r\n", 2.0)
output("\033[5A")  # move up
output(make_bubble("have you had water?", LAB_NUZZLE) + "\r\n", 0.0)

# ─── Scene 4: Success ───────────────────────────────────────────────────────
output("\r\n", 2.5)
output(f"{DIM}~ ${RESET} ", 0.3)
type_text("bun test", 0.04)
output("\r\n", 0.3)
output(f"  {GREEN}✓ 302 tests passed{RESET}\r\n", 0.5)

output("\r\n", 0.3)
output(make_bubble("*tail wags* ...hm.", LAB_IDLE) + "\r\n", 0.5)

# ─── Scene 5: Tagline ───────────────────────────────────────────────────────
output("\r\n", 2.0)
clear()
output(f"\r\n\r\n\r\n", 0.3)
output(f"        {BOLD}petsonality{RESET} — Your type, your pet.\r\n", 0.5)
output(f"\r\n        {DIM}npx petsonality{RESET}\r\n", 0.8)
output(f"\r\n        {DIM}16 MBTI animals • 1276 reactions • 2 languages{RESET}\r\n", 0.5)

# Write cast file
with open(OUTPUT, "w") as f:
    f.write(json.dumps(header()) + "\n")
    for ev in events:
        f.write(json.dumps(ev) + "\n")

print(f"✓ Written {OUTPUT}")
print(f"  {len(events)} events, {t:.1f}s total")
print(f"  Convert: agg {OUTPUT} assets/demo.gif --theme monokai --font-size 16")
