#!/usr/bin/env python3
"""
Generate demo GIF using PIL — full install → adopt → react flow.
Fox (ENTP) as the star. Real ASCII art from art.ts.
"""

from PIL import Image, ImageDraw, ImageFont
import os

FONT_PATH = "/System/Library/Fonts/Menlo.ttc"
FONT_SIZE = 17
BG = (24, 24, 24)
FG = (204, 204, 204)
GREEN = (80, 200, 80)
RED = (220, 80, 80)
ORANGE = (230, 150, 50)
CYAN = (100, 200, 220)
DIM = (100, 100, 100)
WHITE = (240, 240, 240)

OUTPUT = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets", "demo.gif")
os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)

font = ImageFont.truetype(FONT_PATH, FONT_SIZE)
char_h = int(FONT_SIZE * 1.55)

COLS = 52
ROWS = 16
W = int(font.getlength("W") * COLS) + 40
H = char_h * ROWS + 40
PAD = 20


def render_scene(lines_with_color):
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    for row, segments in enumerate(lines_with_color):
        x = PAD
        y = PAD + row * char_h
        if not segments:
            continue
        if isinstance(segments, str):
            draw.text((x, y), segments, font=font, fill=FG)
        else:
            for text, color in segments:
                draw.text((x, y), text, font=font, fill=color)
                x += int(font.getlength(text))
    return img


# ── Scene 1: Install ──
scene1 = [
    [("$ ", DIM), ("npx petsonality", WHITE)],
    [],
    [("  petsonality", WHITE), (" — MBTI terminal pet companion", DIM)],
    [],
    [("  ✓", GREEN), (" node found", FG)],
    [("  ✓", GREEN), (" Claude Code detected", FG)],
    [("  ✓", GREEN), (" MCP server registered", FG)],
    [("  ✓", GREEN), (" Hooks + status line configured", FG)],
    [],
    [("  Done!", GREEN), (" Type /pet to adopt.", FG)],
    [],
    [],
    [],
    [],
    [],
    [("  petsonality 0.3.3", DIM)],
]

# ── Scene 2: /pet → pick MBTI ──
scene2 = [
    [("$ ", DIM), ("/pet", WHITE)],
    [],
    [("  What's your MBTI?", FG)],
    [],
    [("   INTJ  INTP  ENTJ  ", DIM), ("ENTP", ORANGE)],
    [("   INFJ  INFP  ENFJ  ENFP", DIM)],
    [("   ISTJ  ISFJ  ESTJ  ESFJ", DIM)],
    [("   ISTP  ISFP  ESTP  ESFP", DIM)],
    [],
    [("  → ", GREEN), ("ENTP", ORANGE), (" selected", FG)],
    [],
    [],
    [],
    [],
    [],
    [],
]

# ── Scene 3: Meet your Fox ──
scene3 = [
    [("  Your pet is...", FG)],
    [],
    [("         /\\  /\\", ORANGE)],
    [("        ( -.-  )", ORANGE)],
    [("         > ^ <", ORANGE)],
    [("          /_\\~~~", ORANGE)],
    [],
    [("  ✓", GREEN), (" Meet ", FG), ("Fox", ORANGE), (" — Trickster Advisor", FG)],
    [],
    [("  Name your pet: ", DIM), ("ENTP", WHITE)],
    [],
    [("  ENTP joined your terminal.", GREEN)],
    [],
    [],
    [],
    [],
]

# ── Scene 4: Error → Fox reacts ──
scene4 = [
    [("$ ", DIM), ("npm test", WHITE)],
    [("  ✗ ", RED), ("2 tests failed", RED)],
    [],
    [("         /\\  /\\", ORANGE)],
    [("        ( >.<  )", ORANGE)],
    [("         > ^ <", ORANGE)],
    [("          /_\\~~>", ORANGE)],
    [],
    [("  ┌────────────────────────────────────┐", DIM)],
    [("  │ ", DIM), ("ENTP", ORANGE), (": ", DIM), ("Two? Did you do that on purpose?", FG), ("│", DIM)],
    [("  └────────────────────────────────────┘", DIM)],
    [],
    [],
    [],
    [],
    [],
]

# ── Scene 5: Tests pass → Fox reacts ──
scene5 = [
    [("$ ", DIM), ("npm test", WHITE)],
    [("  ✓ ", GREEN), ("302 tests passed", GREEN)],
    [],
    [("         /\\  /\\", ORANGE)],
    [("        ( o.o  )", ORANGE)],
    [("         > ^ <", ORANGE)],
    [("          /_\\~~~", ORANGE)],
    [],
    [("  ┌────────────────────────────────────┐", DIM)],
    [("  │ ", DIM), ("ENTP", ORANGE), (": ", DIM), ("Fine. You win this round.", FG), ("      │", DIM)],
    [("  └────────────────────────────────────┘", DIM)],
    [],
    [],
    [],
    [],
    [],
]

# ── Scene 6: Tagline ──
scene6 = [
    [],
    [],
    [],
    [],
    [("        petsonality", WHITE)],
    [("        Your type, your pet.", FG)],
    [],
    [("        $ npx petsonality", DIM)],
    [],
    [("        16 animals · 1276 reactions", DIM)],
    [("        2 languages · MIT", DIM)],
    [],
    [],
    [],
    [],
    [],
]

scenes = [
    (scene1, 2500),
    (scene2, 2500),
    (scene3, 3000),
    (scene4, 3500),
    (scene5, 3500),
    (scene6, 3000),
]

frames = [render_scene(s) for s, _ in scenes]
durations = [d for _, d in scenes]

frames[0].save(
    OUTPUT,
    save_all=True,
    append_images=frames[1:],
    duration=durations,
    loop=0,
    optimize=True,
)

size_kb = os.path.getsize(OUTPUT) / 1024
print(f"✓ demo.gif — {len(frames)} scenes, {size_kb:.0f}KB → {OUTPUT}")
